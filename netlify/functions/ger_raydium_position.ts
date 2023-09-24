import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { Connection, PublicKey } from "@solana/web3.js";
import { getRaydiumPosition } from "./shared/get_raydium_position";

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const input = JSON.parse(event.body!);
  const poolAddress = new PublicKey(input.poolAddress);
  const nftAddress = new PublicKey(input.nftAddress);

  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const position = await getRaydiumPosition({ connection, poolAddress, nftAddress });

  return {
    body: JSON.stringify(position),
    statusCode: 200
  };
};