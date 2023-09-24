import Decimal from "decimal.js";
import { Wallet } from "@coral-xyz/anchor";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  PoolUtil,
  PriceMath,
  WhirlpoolContext,
  buildWhirlpoolClient,
  collectFeesQuote,
  collectRewardsQuote
} from "@orca-so/whirlpools-sdk";
import { ParsableMintInfo } from "@orca-so/common-sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export async function getOrcaPosition({
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
  const wallet = new Wallet(Keypair.generate());
  const context = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID);
  const client = buildWhirlpoolClient(context);
  const pool = await client.getPool(poolAddress);
  const positionPda = PDAUtil.getPosition(ORCA_WHIRLPOOL_PROGRAM_ID, nftAddress);
  const position = await client.getPosition(positionPda.publicKey);

  const positionData = position.getData();
  const poolData = pool.getData();

  const lowerSqrtPrice = PriceMath.tickIndexToSqrtPriceX64(positionData.tickLowerIndex);
  const upperSqrtPrice = PriceMath.tickIndexToSqrtPriceX64(positionData.tickUpperIndex);

  const tokenAInfo = pool.getTokenAInfo();
  const tokenBInfo = pool.getTokenBInfo();

  const tokenAmounts = PoolUtil.getTokenAmountsFromLiquidity(
    positionData.liquidity,
    poolData.sqrtPrice,
    lowerSqrtPrice,
    upperSqrtPrice,
    false
  );

  const price = PriceMath.sqrtPriceX64ToPrice(poolData.sqrtPrice, tokenAInfo.decimals, tokenBInfo.decimals);
  const invertedPrice = PriceMath.invertPrice(price, tokenAInfo.decimals, tokenBInfo.decimals);

  const tokenAAmount = new Decimal(tokenAmounts.tokenA.toString());
  const tokenBAmount = new Decimal(tokenAmounts.tokenB.toString());

  const priceLower = PriceMath.sqrtPriceX64ToPrice(lowerSqrtPrice, tokenAInfo.decimals, tokenBInfo.decimals);
  const priceUpper = PriceMath.sqrtPriceX64ToPrice(upperSqrtPrice, tokenAInfo.decimals, tokenBInfo.decimals);

  const inRange =
    poolData.tickCurrentIndex <= positionData.tickUpperIndex &&
    poolData.tickCurrentIndex > positionData.tickLowerIndex;

  const tickLower = position.getLowerTickData();
  const tickUpper = position.getUpperTickData();

  const fees = collectFeesQuote({ position: positionData, tickLower, tickUpper, whirlpool: poolData });
  const pendingFeeA = new Decimal(fees.feeOwedA.toString());
  const pendingFeeB = new Decimal(fees.feeOwedB.toString());

  const rawRewards = collectRewardsQuote({ position: positionData, tickLower, tickUpper, whirlpool: poolData });
  const rewardsZipped = pool.getRewardInfos()
    .map((ri, i) => [ri.mint, rawRewards[i]] as const)
    .filter(([m]) => !m.equals(PublicKey.default))
    .map(([m, r]) => [m, new Decimal(r!.toString())] as [PublicKey, Decimal]);
  const pendingRewards = rewardsZipped.map(([_, d]) => d);
  const rewardMintAccounts = await client.getContext().connection
    .getMultipleAccountsInfo(rewardsZipped.map(([mint]) => mint));
  const rewardMints = rewardsZipped.map(([address], i) => {
    const { decimals } = ParsableMintInfo.parse(address, rewardMintAccounts[i])!;
    return { address, decimals };
  });

  return {
    mints: [
      { address: tokenAInfo.mint, decimals: tokenAInfo.decimals },
      { address: tokenBInfo.mint, decimals: tokenBInfo.decimals },
      ...rewardMints
    ],
    liquidity: [tokenAAmount, tokenBAmount],
    pendingFees: [pendingFeeA, pendingFeeB],
    pendingRewards,
    price,
    invertedPrice,
    range: [priceLower, priceUpper],
    invertedRange: [new Decimal(1).div(priceUpper), new Decimal(1).div(priceLower)],
    inRange,
  };
}