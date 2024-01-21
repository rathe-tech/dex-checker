import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

export const handler: Handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  const response = await fetch("https://api.mainnet.orca.so/v1/whirlpool/list");
  const data = await response.json();

  return {
    body: JSON.stringify(data),
    statusCode: 200
  };
};

