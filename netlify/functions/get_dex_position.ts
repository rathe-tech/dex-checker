import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { PublicKey } from "@solana/web3.js";

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const input = JSON.parse(event.body!);
  const poolAddress = new PublicKey(input.poolAddress);
  const nftAddress = new PublicKey(input.nftAddress);

  return {
    body: JSON.stringify({
      poolAddress,
      nftAddress
    }),
    statusCode: 200
  };
};