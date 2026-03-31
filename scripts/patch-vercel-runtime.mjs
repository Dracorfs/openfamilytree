/**
 * Patches .vc-config.json to run as Node.js 20.x with Web API handler format.
 *
 * The vercel-edge adapter exports a Web API handler (Request → Response).
 * By setting runtime=nodejs20.x + web=true, Vercel uses the Node.js runtime
 * (which supports node:fs, node:crypto, etc. that Prisma needs) but keeps
 * the Web API handler signature — no adapter wrapper needed.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const funcDir = ".vercel/output/functions/_qwik-city.func";
const configPath = join(funcDir, ".vc-config.json");

const patched = {
  runtime: "nodejs20.x",
  handler: "entry.vercel-edge.js",
  web: true,
  maxDuration: 30,
};

writeFileSync(configPath, JSON.stringify(patched, null, 2) + "\n");
console.log("Patched .vc-config.json →", patched);
