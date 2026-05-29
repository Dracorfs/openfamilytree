import { createFileRoute } from "@tanstack/react-router";
import { getPrismaClient } from "../../db/client";
import { getAuth } from "../../lib/auth";
import {
  serializeForDb,
  deserializeFromDb,
  type PersonRow,
  type UnionRow,
  type RelationshipRow,
} from "../../lib/treeSerialization";

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

          const family = await (prisma as any).family.findUnique({
            where: { ownerId: session.user.id },
            include: { persons: true, unions: true, relationships: true },
          });

          if (!family) return Response.json({ success: true, tree: null });

          // One-shot migration: legacy blob + no structured rows yet
          if (
            family.persons.length === 0 &&
            family.unions.length === 0 &&
            family.treeData &&
            typeof family.treeData === "object"
          ) {
            const blob = family.treeData as { nodes?: any[]; edges?: any[] };
            if (Array.isArray(blob.nodes) && blob.nodes.length > 0) {
              const { persons, unions, relationships } = serializeForDb(
                blob.nodes,
                Array.isArray(blob.edges) ? blob.edges : [],
                family.id,
              );
              await (prisma as any).$transaction([
                (prisma as any).person.createMany({ data: persons }),
                (prisma as any).union.createMany({ data: unions }),
                (prisma as any).relationship.createMany({ data: relationships }),
                (prisma as any).family.update({
                  where: { id: family.id },
                  data: { treeData: null },
                }),
              ]);
              const tree = deserializeFromDb(persons, unions, relationships);
              return Response.json({ success: true, tree });
            }
          }

          const tree = deserializeFromDb(
            family.persons as PersonRow[],
            family.unions as UnionRow[],
            family.relationships as RelationshipRow[],
          );
          return Response.json({ success: true, tree });
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

          const family = await (prisma as any).family.upsert({
            where: { ownerId: session.user.id },
            create: {
              ownerId: session.user.id,
              members: { create: { userId: session.user.id, role: "owner" } },
            },
            update: {},
          });

          const { persons, unions, relationships, idMap } = serializeForDb(
            nodes,
            edges,
            family.id,
          );

          await (prisma as any).$transaction([
            (prisma as any).relationship.deleteMany({ where: { familyId: family.id } }),
            (prisma as any).person.deleteMany({ where: { familyId: family.id } }),
            (prisma as any).union.deleteMany({ where: { familyId: family.id } }),
            (prisma as any).person.createMany({ data: persons }),
            (prisma as any).union.createMany({ data: unions }),
            (prisma as any).relationship.createMany({ data: relationships }),
            (prisma as any).family.update({
              where: { id: family.id },
              data: { treeData: null },
            }),
          ]);

          return Response.json({ success: true, idMap });
        } catch (error: any) {
          console.error("Failed to save tree:", error);
          return Response.json({ success: false, error: error.message }, { status: 500 });
        }
      },
    },
  },
});
