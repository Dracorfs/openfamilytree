/**
 * Patches the Vercel output to run as Node.js 20.x serverless.
 * Writes a thin adapter (IncomingMessage/ServerResponse ↔ Web API Request/Response)
 * because Prisma needs Node.js built-ins unavailable in Edge Runtime.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const funcDir = ".vercel/output/functions/_qwik-city.func";

// ── Write the Node.js adapter ────────────────────────────────────────────────
const adapterCode = [
  'import qwikHandler from "./entry.vercel-edge.js";',
  "",
  "export async function handler(req, res) {",
  "  try {",
  "    const proto = req.headers['x-forwarded-proto'] || 'https';",
  "    const host  = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost';",
  "    const url   = new URL(req.url, proto + '://' + host);",
  "",
  "    const headers = new Headers();",
  "    for (const [key, val] of Object.entries(req.headers)) {",
  "      if (val === undefined) continue;",
  "      if (Array.isArray(val)) val.forEach(v => headers.append(key, v));",
  "      else headers.set(key, val);",
  "    }",
  "",
  "    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';",
  "    let body;",
  "    if (hasBody) {",
  "      body = await new Promise(resolve => {",
  "        const chunks = [];",
  "        req.on('data', c => chunks.push(c));",
  "        req.on('end', () => resolve(Buffer.concat(chunks)));",
  "      });",
  "      if (!body.length) body = undefined;",
  "    }",
  "",
  "    const init = { method: req.method, headers };",
  "    if (body) { init.body = body; init.duplex = 'half'; }",
  "",
  "    const response = await qwikHandler(new Request(url.href, init));",
  "",
  "    res.statusCode = response.status;",
  "    for (const [key, value] of response.headers.entries()) {",
  "      if (key === 'set-cookie') {",
  "        res.setHeader('Set-Cookie', response.headers.getSetCookie());",
  "      } else {",
  "        res.setHeader(key, value);",
  "      }",
  "    }",
  "",
  "    if (response.body) {",
  "      const reader = response.body.getReader();",
  "      while (true) {",
  "        const { done, value } = await reader.read();",
  "        if (done) break;",
  "        res.write(value);",
  "      }",
  "    }",
  "    res.end();",
  "  } catch (e) {",
  "    console.error('[qwik-node-adapter]', e);",
  "    if (!res.headersSent) {",
  "      res.statusCode = 500;",
  "      res.setHeader('Content-Type', 'text/plain');",
  "    }",
  "    res.end(e?.message || 'Internal Server Error');",
  "  }",
  "}",
].join("\n");

writeFileSync(join(funcDir, "entry.vercel-node.mjs"), adapterCode);

// ── Patch .vc-config.json ────────────────────────────────────────────────────
const config = {
  runtime: "nodejs20.x",
  handler: "entry.vercel-node.handler",
  maxDuration: 30,
};
writeFileSync(join(funcDir, ".vc-config.json"), JSON.stringify(config, null, 2) + "\n");

console.log("Wrote entry.vercel-node.mjs + patched .vc-config.json");
