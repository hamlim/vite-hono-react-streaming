import rdc from "react-dom/client";
import { App } from "./app";

console.log("client entry");

let { hydrateRoot } = rdc;

window.addEventListener("load", () => {
  let headers = new Headers();
  for (let [key, value] of Object.entries(globalThis.ssrContext.headers)) {
    headers.set(key, value as string);
  }

  let req = new Request(globalThis.ssrContext.url || window.location.href, {
    headers,
  });

  console.log(req);

  hydrateRoot(document, <App req={req} />);
});
