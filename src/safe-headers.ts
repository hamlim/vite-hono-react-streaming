let denyList = [
  "Accept-Encoding",
  "Access-Control-Request-Headers",
  "Access-Control-Request-Method",
  "Connection",
  "Content-Length",
  "Cookie",
  "Date",
  "DNT",
  "Expect",
  "Host",
  "Keep-Alive",
  "Origin",
  "Permissions-Policy",
  // Proxy- headers
  // Sec- headers
  "Referer",
  "TE",
  "Trailer",
  "Transfer-Encoding",
  "Upgrade",
  "Via",
  // not documented on MDN
  "upgrade-insecure-requests",
  // Should be allowed, but Chrome hasn't supported it yet
  // @SEE: https://issues.chromium.org/issues/40450316
  "user-agent",
].map((s) => s.toLowerCase());

export function cleanHeaders(headers: Headers): Headers {
  let clean = new Headers();
  // @ts-ignore
  for (let [key, value] of headers.entries()) {
    if (denyList.includes(key.toLowerCase())) continue;
    if (key.startsWith("sec-")) continue;
    if (key.startsWith("proxy-")) continue;
    clean.set(key, value);
  }
  return clean;
}
