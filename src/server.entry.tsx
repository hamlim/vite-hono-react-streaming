import rds from "react-dom/server.browser";

let { renderToReadableStream } = rds;

import App from "./app";

export async function render({ context, stream }) {
  let pipeable = await renderToReadableStream(<App req={context.req.raw} />, {
    bootstrapModules: ["/@vite/client", "/src/client.entry.tsx"],
  });

  await stream.pipe(pipeable);
}
