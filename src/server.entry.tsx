// import rds from "react-dom/server.browser";

// let { renderToReadableStream } = rds;

import type { Context } from "hono";
import { renderToPipeableStream } from "react-server-dom-webpack/server.browser";
import { App } from "./app";

export async function render({
  context,
  stream,
}: { context: Context; stream: ReadableStream }) {
  let pipeable = await renderToPipeableStream(
    <App req={context.req.raw} />,
    {},
  );

  // await stream.pipe(pipeable);
  return pipeable;
}
