import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { Connection, PublicKey } from "@solana/web3.js";
import { getDexPosition } from "./shared/get_dex_position";

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const input = JSON.parse(event.body!);

  const dex = input.dex as any;
  const poolAddress = new PublicKey(input.poolAddress);
  const nftAddress = new PublicKey(input.nftAddress);

  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const position = await getDexPosition({ connection, dex, poolAddress, nftAddress });

  return {
    body: JSON.stringify(position),
    statusCode: 200
  };
};