// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prisma 7 config has no `directUrl`. CLI commands (db push, migrate) need a
  // non-pooled connection — prefer DIRECT_URL, fall back to DATABASE_URL.
  // App runtime uses DATABASE_URL via the Neon adapter (see src/db/client.ts).
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
