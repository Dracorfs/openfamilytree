/**
 * Patches the Vercel function output to run as Node.js 20.x serverless.
 *
 * The vercel-edge adapter produces an entry that expects a Web API Request and
 * returns a Web API Response — that is the Edge function signature. Vercel's
 * Node.js serverless runtime calls handlers with (IncomingMessage, ServerResponse)
 * instead, so we write a thin adapter that bridges the two formats and point
 * .vc-config.json at it.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const funcDir = ".vercel/output/functions/_qwik-city.func";

// ── Node.js ↔ Web-API adapter ────────────────────────────────────────────────
const wrapper = `
import qwikHandler from './entry.vercel-edge.js';

export default async function handler(req, res) {
  // Build an absolute URL from the incoming Node.js request.
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost';
  const url   = new URL(req.url, proto + '://' + host);

  // Copy incoming headers into a Web API Headers object.
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) { for (const v of val) headers.append(key, v); }
    else headers.set(key, val);
  }

  // Buffer the request body (GET / HEAD have none).
  const bodyless = !req.method || req.method === 'GET' || req.method === 'HEAD';
  const body = bodyless ? undefined : await new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => { const b = Buffer.concat(chunks); resolve(b.length ? b : undefined); });
  });

  // Call the Qwik / edge handler.
  const request  = new Request(url.href, { method: req.method || 'GET', headers, body });
  const response = await qwikHandler(request);

  // Write status + headers to the Node.js response.
  res.statusCode = response.status;
  const setCookies = [];
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') { setCookies.push(value); }
    else { res.setHeader(key, value); }
  });
  if (setCookies.length) res.setHeader('Set-Cookie', setCookies);

  // Stream / buffer the response body.
  if (response.body) {
    const reader = response.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        await new Promise((ok, fail) => res.write(value, (err) => err ? fail(err) : ok()));
      }
    };
    await pump();
  } else {
    res.end();
  }
}
`.trimStart();

writeFileSync(join(funcDir, "entry.vercel-node.js"), wrapper);

// ── Patch .vc-config.json ────────────────────────────────────────────────────
const configPath = join(funcDir, ".vc-config.json");
const patched = { runtime: "nodejs20.x", handler: "entry.vercel-node.js", maxDuration: 30 };
writeFileSync(configPath, JSON.stringify(patched, null, 2) + "\n");

console.log("Patched .vc-config.json →", patched);
console.log("Wrote entry.vercel-node.js (Node.js ↔ Web-API adapter)");
