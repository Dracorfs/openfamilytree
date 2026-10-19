import { createId } from "@paralleldrive/cuid2";

export interface ReactFlowNode {
  id: string;
  type: "person" | "union";
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface PersonRow {
  id: string;
  familyId: string;
  name: string | null;
  surname: string | null;
  birthSurname: string | null;
  gender: string | null;
  otherGender: string | null;
  birthYear: string | null;
  birthPlace: string | null;
  deathDate: string | null;
  email: string | null;
  biography: string | null;
  avatarUrl: string | null;
  colorLabel: string | null;
  posX: number;
  posY: number;
}

export interface UnionRow {
  id: string;
  familyId: string;
  posX: number;
  posY: number;
}

export interface RelationshipRow {
  id: string;
  familyId: string;
  type: "partner" | "parent-child";
  nodeAType: "person" | "union";
  nodeAId: string;
  nodeBType: "person" | "union";
  nodeBId: string;
}

const isCuid = (s: string) => /^[a-z0-9]{20,}$/i.test(s) && !s.includes("-");

const PERSON_FIELDS = [
  "name",
  "surname",
  "birthSurname",
  "gender",
  "otherGender",
  "birthYear",
  "birthPlace",
  "deathDate",
  "email",
  "biography",
  "avatarUrl",
  "colorLabel",
] as const;

export function serializeForDb(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  familyId: string,
): {
  persons: PersonRow[];
  unions: UnionRow[];
  relationships: RelationshipRow[];
  idMap: Record<string, string>;
} {
  const idMap: Record<string, string> = {};
  const persons: PersonRow[] = [];
  const unions: UnionRow[] = [];
  const nodeType = new Map<string, "person" | "union">();

  for (const n of nodes) {
    const dbId = isCuid(n.id) ? n.id : createId();
    idMap[n.id] = dbId;
    nodeType.set(dbId, n.type);

    if (n.type === "person") {
      const d = n.data ?? {};
      const row: PersonRow = {
        id: dbId,
        familyId,
        name: null,
        surname: null,
        birthSurname: null,
        gender: null,
        otherGender: null,
        birthYear: null,
        birthPlace: null,
        deathDate: null,
        email: null,
        biography: null,
        avatarUrl: null,
        colorLabel: null,
        posX: n.position.x,
        posY: n.position.y,
      };
      for (const f of PERSON_FIELDS) {
        const v = (d as Record<string, unknown>)[f];
        if (typeof v === "string") (row as unknown as Record<string, unknown>)[f] = v;
      }
      persons.push(row);
    } else if (n.type === "union") {
      unions.push({ id: dbId, familyId, posX: n.position.x, posY: n.position.y });
    }
  }

  const relationships: RelationshipRow[] = [];
  for (const e of edges) {
    const a = idMap[e.source];
    const b = idMap[e.target];
    if (!a || !b) continue;
    const aType = nodeType.get(a);
    const bType = nodeType.get(b);
    if (!aType || !bType) continue;

    if (e.type === "partner") {
      const [x, xT, y, yT] = a < b ? [a, aType, b, bType] : [b, bType, a, aType];
      relationships.push({
        id: createId(),
        familyId,
        type: "partner",
        nodeAType: xT,
        nodeAId: x,
        nodeBType: yT,
        nodeBId: y,
      });
    } else {
      relationships.push({
        id: createId(),
        familyId,
        type: "parent-child",
        nodeAType: aType,
        nodeAId: a,
        nodeBType: bType,
        nodeBId: b,
      });
    }
  }

  return { persons, unions, relationships, idMap };
}

export function deserializeFromDb(
  persons: PersonRow[],
  unions: UnionRow[],
  relationships: RelationshipRow[],
): { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] } {
  const nodes: ReactFlowNode[] = [];

  for (const p of persons) {
    const data: Record<string, unknown> = {};
    for (const f of PERSON_FIELDS) {
      const v = (p as unknown as Record<string, unknown>)[f];
      if (v != null) data[f] = v;
    }
    nodes.push({
      id: p.id,
      type: "person",
      position: { x: p.posX, y: p.posY },
      data,
    });
  }

  for (const u of unions) {
    nodes.push({
      id: u.id,
      type: "union",
      position: { x: u.posX, y: u.posY },
      data: {},
    });
  }

  const repaired = repairCorruptedPartners(relationships);

  const edges: ReactFlowEdge[] = repaired.map((r) => {
    if (r.type === "partner") {
      const personIsA = r.nodeAType === "person";
      return {
        id: r.id,
        source: personIsA ? r.nodeAId : r.nodeBId,
        target: personIsA ? r.nodeBId : r.nodeAId,
        type: "partner",
      };
    }
    return {
      id: r.id,
      source: r.nodeAId,
      target: r.nodeBId,
      type: "smoothstep",
    };
  });

  return { nodes, edges };
}

function repairCorruptedPartners(
  relationships: RelationshipRow[],
): RelationshipRow[] {
  const partnerCount = new Map<string, number>();
  const childEdgesOf = new Map<string, RelationshipRow[]>();
  const parentUnionsOf = new Map<string, string[]>();

  for (const r of relationships) {
    const unionId =
      r.nodeAType === "union" ? r.nodeAId : r.nodeBType === "union" ? r.nodeBId : null;
    const personId =
      r.nodeAType === "person" ? r.nodeAId : r.nodeBType === "person" ? r.nodeBId : null;
    if (!unionId || !personId) continue;

    if (r.type === "partner") {
      partnerCount.set(unionId, (partnerCount.get(unionId) ?? 0) + 1);
    } else {
      const arr = childEdgesOf.get(unionId) ?? [];
      arr.push(r);
      childEdgesOf.set(unionId, arr);

      const parents = parentUnionsOf.get(personId) ?? [];
      parents.push(unionId);
      parentUnionsOf.set(personId, parents);
    }
  }

  const toPromote = new Set<string>();

  for (const [personId, unions] of parentUnionsOf) {
    if (unions.length < 2) continue;
    for (const unionId of unions) {
      if ((partnerCount.get(unionId) ?? 0) >= 2) continue;
      const childEdge = relationships.find(
        (r) =>
          r.type === "parent-child" &&
          ((r.nodeAType === "union" && r.nodeAId === unionId && r.nodeBId === personId) ||
            (r.nodeBType === "union" && r.nodeBId === unionId && r.nodeAId === personId)),
      );
      if (childEdge) {
        toPromote.add(childEdge.id);
        partnerCount.set(unionId, (partnerCount.get(unionId) ?? 0) + 1);
      }
    }
  }

  for (const [unionId, count] of partnerCount) {
    if (count >= 2) continue;
    const children = childEdgesOf.get(unionId) ?? [];
    for (const r of children) {
      if (count + toPromote.size >= 2) break;
      if (toPromote.has(r.id)) continue;
      toPromote.add(r.id);
      partnerCount.set(unionId, (partnerCount.get(unionId) ?? 0) + 1);
    }
  }

  if (toPromote.size === 0) return relationships;

  return relationships.map((r) =>
    toPromote.has(r.id) ? { ...r, type: "partner" as const } : r,
  );
}
