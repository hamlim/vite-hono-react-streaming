import { serve } from "@hono/node-server";
import react from "@vitejs/plugin-react-swc";
import { Hono } from "hono";
import { stream as streamResponse } from "hono/streaming";
import { createServer as createViteServer } from "vite";
// import react from '@vitejs/plugin-react';

let server = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
  environments: {
    server: {},
  },
  plugins: [react()],
});

const environment = server.environments.server;

const app = new Hono();

app.use(async (c, next) => {
  await next();
  return server.middlewares(c.env.incoming, c.env.outgoing, () => {});
});

app.use("*", async function handler(context, next) {
  // only render the app for html requests
  if (context.req.header("accept").includes("text/html")) {
    const { render } = await environment.runner.import(
      "./src/server.entry.tsx",
    );

    context.res.headers.set("content-type", "text/html");

    return streamResponse(context, async function streamHandler(stream) {
      await render({
        context,
        stream,
      });
    });
  }
  await next();
});

serve(app);
