import Decimal from "decimal.js";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { PublicKey } from "@solana/web3.js";

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const input = JSON.parse(event.body!);

  const inputMint = new PublicKey(input.inputMint);
  const outputMint = new PublicKey(input.outputMint);
  const amount = new Decimal(input.amount);

  if (amount.isZero() || inputMint.equals(outputMint)) {
    return {
      body: JSON.stringify(amount),
      statusCode: 200
    };
  } else {
    const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`);

    if (response.status !== 200) {
      const raw = await response.text();
      console.error(raw);
      return {
        body: raw,
        statusCode: response.status
      };
    }

    const data = await response.json();
    return {
      body: JSON.stringify(new Decimal(data.outAmount)),
      statusCode: 200
    };
  }
};