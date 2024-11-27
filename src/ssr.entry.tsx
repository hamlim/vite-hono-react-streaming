import { type ReactNode, use } from "react";
import rds from "react-dom/server.browser";
import type { TODO } from "./types";

let { renderToReadableStream } = rds;

export async function render({
  stream,
  flightData,
}: {
  stream: { pipe: (stream: ReadableStream) => Promise<void> };
  flightData: TODO;
}) {
  function Root(): ReactNode {
    return use(flightData);
  }
  let pipeable = await renderToReadableStream(<Root />, {
    bootstrapModules: ["/@vite/client", "/src/client.entry.tsx"],
  });

  await stream.pipe(pipeable);
}
