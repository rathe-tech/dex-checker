import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

export const handler: Handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  const response = await fetch("https://token.jup.ag/all");
  const data = await response.json();

  return {
    body: JSON.stringify(data),
    statusCode: 200
  };
};