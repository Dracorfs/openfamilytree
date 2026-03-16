import type { RequestHandler } from '@builder.io/qwik-city';
import { getPrismaClient } from '../../../db/client';

export const onPost: RequestHandler = async ({ request, json, env }) => {
  try {
    const dbUrl = env.get('DATABASE_URL') || process.env.DATABASE_URL;
    if (!dbUrl) {
      json(500, { success: false, error: 'Database URL not configured in environment' });
      return;
    }
    const prisma = getPrismaClient(dbUrl);

    const { nodes, edges } = await request.json();

    // 1. Ensure a default family exists
    let family = await prisma.family.findFirst();
    if (!family) {
      family = await prisma.family.create({
        data: { name: 'My Family Tree' },
      });
    }

    // Wrap in a transaction to ensure atomic updates
    await prisma.$transaction(async (tx: any) => {
      // 2. Clear existing data for this family (simple replace strategy for now)
      await tx.relationship.deleteMany({
        where: {
          OR: [
            { personA: { familyId: family!.id } },
            { personB: { familyId: family!.id } },
          ],
        },
      });
      await tx.person.deleteMany({
        where: { familyId: family!.id },
      });

      // 3. Create persons
      const personNodes = nodes.filter((n: any) => n.type === 'person');
      const personIdMap = new Map<string, string>(); // ui_id -> db_id

      for (const node of personNodes) {
        // Split name into given/surname simplistically
        const names = (node.data.name || '').split(' ');
        const surname = names.length > 1 ? names.pop() : '';
        const givenNames = names.join(' ');

        const person = await tx.person.create({
          data: {
            familyId: family!.id,
            givenNames,
            surname,
            nickname: node.data.name,
            gender: node.data.gender || 'o',
            birthDate: node.data.birthYear, // simplistically mapped
            posX: node.position.x,
            posY: node.position.y,
          },
        });
        personIdMap.set(node.id, person.id);
      }

      // 4. Create relationships based on 'union' nodes
      const unionNodes = nodes.filter((n: any) => n.type === 'union');
      
      for (const union of unionNodes) {
        // Find partners (edges where target === union.id)
        const partnerEdges = edges.filter((e: any) => e.target === union.id);
        const partnerIds = partnerEdges
          .map((e: any) => personIdMap.get(e.source))
          .filter(Boolean) as string[];

        // Create partner relationships (pairwise)
        if (partnerIds.length >= 2) {
          // Simplistic pairwise partner logic
          for (let i = 0; i < partnerIds.length; i++) {
            for (let j = i + 1; j < partnerIds.length; j++) {
              await tx.relationship.create({
                data: {
                  type: 'partner',
                  personAId: partnerIds[i],
                  personBId: partnerIds[j],
                },
              });
            }
          }
        }

        // Find children (edges where source === union.id)
        const childEdges = edges.filter((e: any) => e.source === union.id);
        const childIds = childEdges
          .map((e: any) => personIdMap.get(e.target))
          .filter(Boolean) as string[];

        // Link each partner as parent to each child
        for (const parentId of partnerIds) {
          for (const childId of childIds) {
            await tx.relationship.create({
              data: {
                type: 'parent-child',
                personAId: parentId, // Parent
                personBId: childId,  // Child
              },
            });
          }
        }
      }
    });

    json(200, { success: true, message: 'Tree saved successfully' });
  } catch (error: any) {
    console.error('Failed to save tree:', error);
    json(500, { success: false, error: error.message });
  }
};
