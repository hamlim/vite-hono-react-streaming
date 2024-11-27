import { serve } from "@hono/node-server";
import react from "@vitejs/plugin-react";
// import react from "@vitejs/plugin-react-swc";
import { Hono } from "hono";
import { stream as streamResponse } from "hono/streaming";
import { createServer as createViteServer } from "vite";
import { createWorkerEnvironment } from "./rsc-node-environment.mjs";

let server = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
  environments: {
    server: {},
    rsc: {
      resolve: {
        conditions: ["react-server", "node"],
        noExternal: true,
      },
      dev: {
        createEnvironment: createWorkerEnvironment,
      },
    },
  },
  plugins: [react()],
});

let ssrEnv = server.environments.server;
let rscEnv = server.environments.rsc;

let app = new Hono();

app.use(async (c, next) => {
  let viteDevMiddleware = () =>
    new Promise((resolve) => {
      server.middlewares(c.env.incoming, c.env.outgoing, () => resolve());
    });
  await viteDevMiddleware();
  await next();
});

app.use("*", async function handler(context, next) {
  // Check if response has already started
  if (context.res.writableEnded) {
    return;
  }

  // only render the app for html requests
  if (context.req.header("accept").includes("text/html")) {
    // Hmm - this won't work as I'm thinking about it
    // If we offload the work to the worker - we need to serialize the context
    // BTW: I don't know what `handleInvoke` does here
    let { render: rscRender } = await rscEnv.hot.handleInvoke({
      entry: "./src/server.entry.tsx",
    });

    console.dir(rscEnv, { depth: 2 });

    // let flightData = await rscRender({ context });
    let flightData = {};

    console.log(flightData);

    const { render } = await ssrEnv.runner.import("./src/ssr.entry.tsx");

    context.res.headers.set("content-type", "text/html");

    return streamResponse(context, async function streamHandler(stream) {
      await render({
        stream,
        flightData,
      });
    });
  }
  await next();
});

serve(app);
