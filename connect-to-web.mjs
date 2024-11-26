export { connectToWeb };

export { createServerResponse };

import { ServerResponse } from "node:http";
import { PassThrough, Readable } from "node:stream";

/**
 * Creates a custom ServerResponse object that allows for intercepting and streaming the response.
 *
 * @param {IncomingMessage} incomingMessage - The incoming HTTP request message.
 * @returns {{
 *   res: ServerResponse;
 *   onReadable: (cb: (result: { readable: Readable; headers: object; statusCode: number }) => void) => void
 * }}
 * An object containing:
 *   - res: The custom ServerResponse object.
 *   - onReadable: A function that takes a callback. The callback is invoked when the response is readable,
 *     providing an object with the readable stream, headers, and status code.
 */
function createServerResponse(incomingMessage) {
  const res = new ServerResponse(incomingMessage);
  const passThrough = new PassThrough();
  let handled = false;

  const onReadable = (cb) => {
    const handleReadable = () => {
      if (handled) return;
      handled = true;
      cb({
        readable: Readable.from(passThrough),
        headers: res.getHeaders(),
        statusCode: res.statusCode,
      });
    };

    passThrough.once("readable", handleReadable);
    passThrough.once("end", handleReadable);
  };

  passThrough.once("finish", () => {
    res.emit("finish");
  });
  passThrough.once("close", () => {
    res.destroy();
    res.emit("close");
  });
  passThrough.on("drain", () => {
    res.emit("drain");
  });

  res.write = passThrough.write.bind(passThrough);
  res.end = passThrough.end.bind(passThrough);

  res.writeHead = function writeHead(statusCode, statusMessage, headers) {
    res.statusCode = statusCode;
    if (typeof statusMessage === "object") {
      headers = statusMessage;
      statusMessage = undefined;
    }
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      }
    }
    return res;
  };

  return {
    res,
    onReadable,
  };
}

export const DUMMY_BASE_URL = "http://localhost";

export { flattenHeaders, groupHeaders, parseHeaders };

function groupHeaders(headers) {
  const grouped = {};

  for (const [key, value] of headers) {
    if (grouped[key]) {
      // If the key already exists, append the new value
      if (Array.isArray(grouped[key])) {
        grouped[key].push(value);
      } else {
        grouped[key] = [grouped[key], value];
      }
    } else {
      // If the key doesn't exist, add it to the object
      grouped[key] = value;
    }
  }

  // Convert the object back to an array
  return Object.entries(grouped);
}

function flattenHeaders(headers) {
  const flatHeaders = [];

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const v of value) {
        if (v != null) {
          flatHeaders.push([key, String(v)]);
        }
      }
    } else {
      flatHeaders.push([key, String(value)]);
    }
  }

  return flatHeaders;
}

function parseHeaders(headers) {
  const result = [];
  if (typeof headers.forEach === "function") {
    headers.forEach((value, key) => {
      if (Array.isArray(value)) {
        for (const value_ of value) {
          result.push([key, value_]);
        }
      } else {
        result.push([key, value]);
      }
    });
  } else {
    for (const [key, value] of Object.entries(headers)) {
      if (Array.isArray(value)) {
        for (const value_ of value) {
          result.push([key, value_]);
        }
      } else {
        result.push([key, value]);
      }
    }
  }

  return result;
}

const statusCodesWithoutBody = [
  100, // Continue
  101, // Switching Protocols
  102, // Processing (WebDAV)
  103, // Early Hints
  204, // No Content
  205, // Reset Content
  304, // Not Modified
];

/**
 * Converts a Connect-style middleware to a web-compatible request handler.
 *
 * @param {Function} handler - The Connect-style middleware function to be converted.
 * @returns {Function} A function that handles web requests and returns a Response or undefined.
 */
function connectToWeb(handler) {
  return async (request) => {
    const req = createIncomingMessage(request);
    const { res, onReadable } = createServerResponse(req);

    return new Promise((resolve, reject) => {
      onReadable(({ readable, headers, statusCode }) => {
        const responseBody = statusCodesWithoutBody.includes(statusCode)
          ? null
          : Readable.toWeb(readable);
        resolve(
          new Response(responseBody, {
            status: statusCode,
            headers: flattenHeaders(headers),
          }),
        );
      });

      const next = (error) => {
        if (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        } else {
          resolve(undefined);
        }
      };

      Promise.resolve(handler(req, res, next)).catch(next);
    });
  };
}

/**
 * Creates an IncomingMessage object from a web Request.
 *
 * @param {Request} request - The web Request object.
 * @returns {IncomingMessage} An IncomingMessage-like object compatible with Node.js HTTP module.
 */
function createIncomingMessage(request) {
  const parsedUrl = new URL(request.url, DUMMY_BASE_URL);
  const pathnameAndQuery =
    (parsedUrl.pathname || "") + (parsedUrl.search || "");
  const body = request.body
    ? Readable.fromWeb(request.body)
    : Readable.from([]);

  return Object.assign(body, {
    url: pathnameAndQuery,
    method: request.method,
    headers: Object.fromEntries(request.headers),
  });
}
