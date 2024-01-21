import Decimal from "decimal.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { getDexPosition } from "./get_dex_position";
import { Kamino, numberToDex } from "@hubbleprotocol/kamino-sdk";

export async function getKaminoDexPosition({
  connection,
  strategyAddress
}: {
  connection: Connection,
  strategyAddress: PublicKey
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
  const kamino = new Kamino("mainnet-beta", connection);
  const strategy = await kamino.getStrategyByAddress(strategyAddress);
  const { strategyDex, positionMint: nftAddress, pool: poolAddress } = strategy!;
  const dex = numberToDex(strategyDex.toNumber()) as any;
  return await getDexPosition({ dex, connection, poolAddress, nftAddress });
}