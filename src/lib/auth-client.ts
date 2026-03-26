import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  // No baseURL needed — auth server runs on the same domain
});

export const { signIn, signOut } = authClient;
