/**
 * Patches the Vercel output to run as Node.js 20.x serverless.
 * Writes a CJS adapter that dynamically imports the ESM edge entry.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const funcDir = ".vercel/output/functions/_qwik-city.func";

// ── Remove the "type":"module" package.json so .js = CJS ─────────────────────
// Vercel's Node.js launcher reliably loads CJS; ESM loading is inconsistent.
writeFileSync(join(funcDir, "package.json"), '{"type":"commonjs"}\n');

// ── Write a CJS adapter that dynamic-imports the ESM edge entry ──────────────
const adapterCode = `"use strict";

let _qwikHandler;

async function loadHandler() {
  if (!_qwikHandler) {
    const mod = await import('./entry.vercel-edge.js');
    _qwikHandler = mod.default;
  }
  return _qwikHandler;
}

module.exports.handler = async function handler(req, res) {
  try {
    const qwikHandler = await loadHandler();

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host  = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost';
    const url   = new URL(req.url, proto + '://' + host);

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (val === undefined) continue;
      if (Array.isArray(val)) val.forEach(function(v) { headers.append(key, v); });
      else headers.set(key, val);
    }

    var hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    var body;
    if (hasBody) {
      body = await new Promise(function(resolve) {
        var chunks = [];
        req.on('data', function(c) { chunks.push(c); });
        req.on('end', function() { resolve(Buffer.concat(chunks)); });
      });
      if (!body.length) body = undefined;
    }

    var init = { method: req.method, headers: headers };
    if (body) { init.body = body; init.duplex = 'half'; }

    var response = await qwikHandler(new Request(url.href, init));

    res.statusCode = response.status;
    response.headers.forEach(function(value, key) {
      if (key === 'set-cookie') {
        var cookies = response.headers.getSetCookie
          ? response.headers.getSetCookie()
          : [value];
        res.setHeader('Set-Cookie', cookies);
      } else {
        res.setHeader(key, value);
      }
    });

    if (response.body) {
      var reader = response.body.getReader();
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        res.write(chunk.value);
      }
    }
    res.end();
  } catch (e) {
    console.error('[qwik-node-adapter]', e);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
    }
    res.end(String(e && e.message || 'Internal Server Error'));
  }
};
`;

writeFileSync(join(funcDir, "entry.vercel-node.js"), adapterCode);

// ── Patch .vc-config.json ────────────────────────────────────────────────────
const config = {
  runtime: "nodejs20.x",
  handler: "entry.vercel-node.handler",
  maxDuration: 30,
};
writeFileSync(join(funcDir, ".vc-config.json"), JSON.stringify(config, null, 2) + "\n");

console.log("Wrote entry.vercel-node.js (CJS) + patched .vc-config.json + package.json");
