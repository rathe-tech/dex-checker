import Decimal from "decimal.js";
import {
  Connection,
  PublicKey
} from "@solana/web3.js";
import { getOrcaPosition } from "./get_orca_position";
import { getRaydiumPosition } from "./get_raydium_position";

export async function getDexPosition({
  dex,
  connection,
  poolAddress,
  nftAddress,
}: {
  dex: "RAYDIUM" | "ORCA",
  connection: Connection,
  poolAddress: PublicKey,
  nftAddress: PublicKey,
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
  switch (dex) {
    case "ORCA":
      return await getOrcaPosition({ connection, poolAddress, nftAddress });
    case "RAYDIUM":
      return await getRaydiumPosition({ connection, poolAddress, nftAddress });
    default:
      throw new Error(`Not supported DEX: ${dex}`);
  }
}