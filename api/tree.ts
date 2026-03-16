import http from 'node:http';
import { getPrismaClient } from '../src/db/client';

const sendJson = (res: http.ServerResponse, status: number, payload: Record<string, unknown>) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const parseBody = async (req: http.IncomingMessage) => {
  if ((req as any).body) {
    const body = (req as any).body;
    return typeof body === 'string' ? JSON.parse(body) : body;
  }

  const rawBody = await new Promise<string>((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
};

const handleSaveTree = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      sendJson(res, 500, { success: false, error: 'Database URL not configured in environment' });
      return;
    }

    const prisma = getPrismaClient(dbUrl);
    const { nodes = [], edges = [] } = await parseBody(req);

    let family = await prisma.family.findFirst();
    if (!family) {
      family = await prisma.family.create({
        data: { name: 'My Family Tree' },
      });
    }

    await prisma.$transaction(async (tx: any) => {
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

      const personNodes = nodes.filter((n: any) => n.type === 'person');
      const personIdMap = new Map<string, string>();

      for (const node of personNodes) {
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
            birthDate: node.data.birthYear,
            posX: node.position.x,
            posY: node.position.y,
          },
        });
        personIdMap.set(node.id, person.id);
      }

      const unionNodes = nodes.filter((n: any) => n.type === 'union');

      for (const union of unionNodes) {
        const partnerEdges = edges.filter((e: any) => e.target === union.id);
        const partnerIds = partnerEdges
          .map((e: any) => personIdMap.get(e.source))
          .filter(Boolean) as string[];

        if (partnerIds.length >= 2) {
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

        const childEdges = edges.filter((e: any) => e.source === union.id);
        const childIds = childEdges
          .map((e: any) => personIdMap.get(e.target))
          .filter(Boolean) as string[];

        for (const parentId of partnerIds) {
          for (const childId of childIds) {
            await tx.relationship.create({
              data: {
                type: 'parent-child',
                personAId: parentId,
                personBId: childId,
              },
            });
          }
        }
      }
    });

    sendJson(res, 200, { success: true, message: 'Tree saved successfully' });
  } catch (error: any) {
    console.error('Failed to save tree:', error);
    sendJson(res, 500, { success: false, error: error.message });
  }
};

export default handleSaveTree;
