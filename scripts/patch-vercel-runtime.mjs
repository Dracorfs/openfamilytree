/**
 * Patches .vc-config.json to run as Node.js 20.x serverless instead of Edge.
 * Prisma + Neon require Node.js built-ins unavailable in Vercel Edge Runtime.
 */
import { readFileSync, writeFileSync } from "node:fs";

const configPath =
  ".vercel/output/functions/_qwik-city.func/.vc-config.json";

const config = JSON.parse(readFileSync(configPath, "utf-8"));

const patched = {
  runtime: "nodejs20.x",
  handler: config.entrypoint ?? config.handler,
  maxDuration: 30,
};

writeFileSync(configPath, JSON.stringify(patched, null, 2) + "\n");
console.log("Patched .vc-config.json →", patched);
