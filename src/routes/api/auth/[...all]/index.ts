import type { RequestHandler } from "@builder.io/qwik-city";
import { auth } from "~/lib/auth";

// Catch-all handler: forwards every /api/auth/* request to Better Auth
const handleAuth: RequestHandler = async ({ request, send }) => {
  const response = await auth.handler(request);
  send(response);
};

export const onGet: RequestHandler = handleAuth;
export const onPost: RequestHandler = handleAuth;
