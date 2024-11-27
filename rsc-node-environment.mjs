import {
  Worker,
  //BroadcastChannel
} from "node:worker_threads";
import {
  DevEnvironment,
  // RemoteEnvironmentTransport,
  // createServer
} from "vite";

export function createWorkerEnvironment(name, config, context) {
  let worker = new Worker("./rsc-node-worker.mjs");
  let handlerToWorkerListener = new WeakMap();

  let workerHotChannel = {
    send: (data) => {
      console.log("send", data);
      worker.postMessage(data);
    },
    on: (event, handler) => {
      console.log("on", event);
      if (event === "connection") {
        return;
      }

      function listener(value) {
        if (value.type === "custom" && value.event === event) {
          let client = {
            send(payload) {
              console.log("send", payload);
              worker.postMessage(payload);
            },
          };
          handler(value.data, client);
        }
      }
      handlerToWorkerListener.set(handler, listener);
      worker.on("message", listener);
    },
    off: (event, handler) => {
      if (event === "connection") {
        return;
      }
      let listener = handlerToWorkerListener.get(handler);
      if (listener) {
        worker.off("message", listener);
        handlerToWorkerListener.delete(handler);
      }
    },
  };

  return new DevEnvironment(name, config, {
    transport: workerHotChannel,
  });
}

// Usage:
// await createServer({
//   environments: {
//     worker: {
//       dev: {
//         createEnvironment: createWorkerEnvironment,
//       },
//     },
//   },
// })
