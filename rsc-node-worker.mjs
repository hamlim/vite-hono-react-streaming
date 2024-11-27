import { fileURLToPath } from "node:url";
import { parentPort } from "node:worker_threads";
import { ESModulesEvaluator, ModuleRunner } from "vite/module-runner";

/** @type {import('vite/module-runner').ModuleRunnerTransport} */
const transport = {
  connect({ onMessage, onDisconnection }) {
    parentPort.on("message", onMessage);
    parentPort.on("close", onDisconnection);
  },
  send(data) {
    parentPort.postMessage(data);
  },
};

const runner = new ModuleRunner(
  {
    root: fileURLToPath(new URL("./", import.meta.url)),
    transport,
  },
  new ESModulesEvaluator(),
);

console.log("Here????");
