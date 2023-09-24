import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { Connection, PublicKey } from "@solana/web3.js";
import { getKaminoDexPosition } from "./shared/get_kamino_dex_position";

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const input = JSON.parse(event.body!);
  const strategyAddress = new PublicKey(input.strategyAddress);

  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const position = await getKaminoDexPosition({ connection, strategyAddress });

  return {
    body: JSON.stringify(position),
    statusCode: 200
  };
};