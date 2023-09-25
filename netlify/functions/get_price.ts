import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { PublicKey } from "@solana/web3.js";

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const input = JSON.parse(event.body!);

  const inputMint = new PublicKey(input.inputMint);
  const outputMint = new PublicKey(input.outputMint);

  const response = await fetch(`https://price.jup.ag/v4/price?ids=${inputMint}&vsToken=${outputMint}`);
  const model = await response.json();

  return {
    body: JSON.stringify(model.data[input.inputMint].price),
    statusCode: 200
  };
};