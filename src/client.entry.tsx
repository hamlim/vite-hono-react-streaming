import rdc from "react-dom/client";
import { App } from "./app";

console.log("client entry");

let { hydrateRoot } = rdc;

hydrateRoot(
  document.documentElement,
  <App req={new Request(window.location.href)} />,
);
