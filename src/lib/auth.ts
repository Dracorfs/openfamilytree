import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

let _auth: any;

export function getAuth(): ReturnType<typeof betterAuth> {
  if (!_auth) {
    const neonAdapter = new PrismaNeon({
      connectionString: process.env.DATABASE_URL!,
    });
    const prisma = new PrismaClient({ adapter: neonAdapter } as any);

    _auth = betterAuth({
      database: prismaAdapter(prisma, {
        provider: "postgresql",
      }),
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: process.env.BETTER_AUTH_URL,
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      },
    });
  }
  return _auth;
}
