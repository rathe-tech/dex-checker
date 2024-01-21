import Decimal from "decimal.js";
import {
  Connection,
  PublicKey
} from "@solana/web3.js";
import {
  LiquidityMath,
  MAINNET_PROGRAM_ID,
  PoolInfoLayout,
  PositionInfoLayout,
  PositionUtils,
  SPL_MINT_LAYOUT,
  SqrtPriceMath,
  TickArrayLayout,
  TickUtils,
  getPdaPersonalPositionAddress
} from "@raydium-io/raydium-sdk";

export async function getRaydiumPosition({
  connection,
  poolAddress,
  nftAddress
}: {
  connection: Connection,
  poolAddress: PublicKey,
  nftAddress: PublicKey
}): Promise<{
  mints: {
    address: PublicKey,
    decimals: number,
  }[],
  liquidity: [Decimal, Decimal],
  pendingFees: [Decimal, Decimal],
  pendingRewards: Decimal[],
  price: Decimal,
  invertedPrice: Decimal,
  range: [Decimal, Decimal],
  invertedRange: [Decimal, Decimal],
  inRange: boolean,
}> {
  const poolAccount = await connection.getAccountInfo(poolAddress);
  if (poolAccount == null) {
    throw new Error(`Can not fetch account for address: ${poolAddress}`);
  }
  const pool = PoolInfoLayout.decode(poolAccount.data);

  const pdaPositionAddress = getPdaPersonalPositionAddress(MAINNET_PROGRAM_ID.CLMM, nftAddress);
  const positionAccount = await connection.getAccountInfo(pdaPositionAddress.publicKey);
  if (positionAccount == null) {
    throw new Error(`Can not fetch account for address: ${pdaPositionAddress.publicKey}`);
  }
  const position = PositionInfoLayout.decode(positionAccount.data);

  const sqrtPriceX64Lower = SqrtPriceMath.getSqrtPriceX64FromTick(position.tickLower);
  const sqrtPriceX64Upper = SqrtPriceMath.getSqrtPriceX64FromTick(position.tickUpper);
  const amounts = LiquidityMath.getAmountsFromLiquidity(
    pool.sqrtPriceX64,
    sqrtPriceX64Lower,
    sqrtPriceX64Upper,
    position.liquidity,
    false
  );

  const price = SqrtPriceMath.sqrtPriceX64ToPrice(pool.sqrtPriceX64, pool.mintDecimalsA, pool.mintDecimalsB);
  const invertedPrice = new Decimal(1).div(price);

  const tokenAAmount = new Decimal(amounts.amountA.toString());
  const tokenBAmount = new Decimal(amounts.amountB.toString());

  const priceLower = SqrtPriceMath.sqrtPriceX64ToPrice(sqrtPriceX64Lower, pool.mintDecimalsA, pool.mintDecimalsB);
  const priceUpper = SqrtPriceMath.sqrtPriceX64ToPrice(sqrtPriceX64Upper, pool.mintDecimalsA, pool.mintDecimalsB);

  const inRange = 
    pool.tickCurrent < position.tickUpper && 
    pool.tickCurrent >= position.tickLower;

  const tickArrayLowerAddress = TickUtils.getTickArrayAddressByTick(
    poolAccount.owner,
    poolAddress,
    position.tickLower,
    pool.tickSpacing
  );
  const tickArrayUpperAddress = TickUtils.getTickArrayAddressByTick(
    poolAccount.owner,
    poolAddress,
    position.tickUpper,
    pool.tickSpacing
  );

  const tickOffsetLower = TickUtils.getTickOffsetInArray(position.tickLower, pool.tickSpacing);
  const tickOffsetUpper = TickUtils.getTickOffsetInArray(position.tickUpper, pool.tickSpacing);

  const tickArrayLowerAccount = await connection.getAccountInfo(tickArrayLowerAddress);
  if (tickArrayLowerAccount == null) {
    throw new Error(`Can not fetch account for address: ${tickArrayLowerAddress}`);
  }
  const tickArrayUpperAccount = await connection.getAccountInfo(tickArrayUpperAddress);
  if (tickArrayUpperAccount == null) {
    throw new Error(`Can not fetch account for address: ${tickArrayUpperAddress}`);
  }

  const tickArrayLower = TickArrayLayout.decode(tickArrayLowerAccount.data);
  const tickArrayUpper = TickArrayLayout.decode(tickArrayUpperAccount.data);

  const tickLowerState = tickArrayLower.ticks[tickOffsetLower];
  const tickUpperState = tickArrayUpper.ticks[tickOffsetUpper];

  const fees = PositionUtils.GetPositionFees(pool as any, position as any, tickLowerState, tickUpperState);
  const pendingFeeA = new Decimal(fees.tokenFeeAmountA.toString());
  const pendingFeeB = new Decimal(fees.tokenFeeAmountB.toString());

  const rawRewards = PositionUtils.GetPositionRewards(pool as any, position as any, tickLowerState, tickUpperState);
  const rewardsZipped = pool.rewardInfos
    .map((ri, i) => [ri.tokenMint, rawRewards[i]] as const)
    .filter(([m]) => !m.equals(PublicKey.default))
    .map(([m, r]) => [m, new Decimal(r!.toString())] as [PublicKey, Decimal]);
  const pendingRewards = rewardsZipped.map(([_, d]) => d);
  const rewardMintAccounts = await connection.getMultipleAccountsInfo(rewardsZipped.map(([mint]) => mint));
  const rewardMints = rewardsZipped.map(([address], i) => {
    const { decimals } = SPL_MINT_LAYOUT.decode(rewardMintAccounts[i]!.data)!;
    return { address, decimals };
  });

  return {
    mints: [
      { address: pool.mintA, decimals: pool.mintDecimalsA },
      { address: pool.mintB, decimals: pool.mintDecimalsB },
      ...rewardMints
    ],
    liquidity: [tokenAAmount, tokenBAmount],
    pendingFees: [pendingFeeA, pendingFeeB],
    pendingRewards,
    price: price,
    invertedPrice: invertedPrice,
    range: [priceLower, priceUpper],
    invertedRange: [new Decimal(1).div(priceUpper), new Decimal(1).div(priceLower)],
    inRange,
  };
}