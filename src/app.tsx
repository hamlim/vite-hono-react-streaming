import { useEffect } from "react";

export function App({ req }) {
  //   console.log(req);

  useEffect(() => {
    console.log(req.url);
  }, []);
  return (
    <html>
      <head>
        <title>Testing</title>
      </head>
      <body>
        <main>
          <h1>Hello World!</h1>
        </main>
        <div suppressHydrationWarning>
          {typeof window === "undefined" ? (
            <pre>
              {JSON.stringify(
                Object.fromEntries(req.headers.entries()),
                null,
                2,
              )}
            </pre>
          ) : null}
        </div>
      </body>
    </html>
  );
}
