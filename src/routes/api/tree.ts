import { createFileRoute } from "@tanstack/react-router";
import { getPrismaClient } from "../../db/client";
import { getAuth } from "../../lib/auth";

export const Route = createFileRoute("/api/tree")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const session = await getAuth().api.getSession({ headers: request.headers });
          if (!session?.user) {
            return Response.json({ success: true, tree: null });
          }
          const dbUrl = process.env.DATABASE_URL;
          if (!dbUrl) {
            return Response.json(
              { success: false, error: "Database URL not configured in environment" },
              { status: 500 },
            );
          }
          const prisma = getPrismaClient(dbUrl);
          const family = await (prisma.family as any).findUnique({
            where: { ownerId: session.user.id },
          });
          return Response.json({ success: true, tree: family?.treeData ?? null });
        } catch (error: any) {
          console.error("Failed to load tree:", error);
          return Response.json({ success: false, error: error.message }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        try {
          const session = await getAuth().api.getSession({ headers: request.headers });
          if (!session?.user) {
            return Response.json(
              { success: false, error: "Unauthenticated" },
              { status: 401 },
            );
          }
          const dbUrl = process.env.DATABASE_URL;
          if (!dbUrl) {
            return Response.json(
              { success: false, error: "Database URL not configured in environment" },
              { status: 500 },
            );
          }
          const prisma = getPrismaClient(dbUrl);
          const { nodes = [], edges = [] } = await request.json();
          await (prisma.family as any).upsert({
            where: { ownerId: session.user.id },
            create: {
              ownerId: session.user.id,
              name: "My Family Tree",
              treeData: { nodes, edges },
              members: {
                create: { userId: session.user.id, role: "owner" },
              },
            },
            update: { treeData: { nodes, edges } },
          });
          return Response.json({ success: true, message: "Tree saved successfully" });
        } catch (error: any) {
          console.error("Failed to save tree:", error);
          return Response.json({ success: false, error: error.message }, { status: 500 });
        }
      },
    },
  },
});
