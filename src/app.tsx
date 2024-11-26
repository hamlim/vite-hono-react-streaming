import { useEffect } from "react";
import { cleanHeaders } from "./safe-headers";

export function App({ req }) {
  //   console.log(req);

  useEffect(() => {
    console.log(req.url);
  }, []);
  return (
    <html lang="en">
      <head>
        <title>Testing</title>
      </head>
      <body>
        <main>
          <h1>Hello World!</h1>
        </main>
        <div suppressHydrationWarning>
          <pre
            suppressHydrationWarning
            // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                // @ts-ignore
                Object.fromEntries(cleanHeaders(req.headers).entries()),
                null,
                2,
              ),
            }}
          />
        </div>
        <script
          type="module"
          id="ssr_context"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={{
            __html: `let headers = ${JSON.stringify(
              // @ts-ignore
              Object.fromEntries(cleanHeaders(req.headers).entries()),
            )};
globalThis.ssrContext = { url: "${req.url}", headers };`,
          }}
        />
        {/* I think the vite server.transformIndexHtml would normally do this for us */}
        <script
          type="module"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={{
            __html: `import RefreshRuntime from './@react-refresh';
  RefreshRuntime.injectIntoGlobalHook(window);
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
  window.__vite_plugin_react_preamble_installed__ = true;`,
          }}
        />
      </body>
    </html>
  );
}
