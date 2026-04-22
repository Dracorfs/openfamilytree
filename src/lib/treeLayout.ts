import type { Node, Edge } from "@xyflow/react";

export const PERSON_W = 152;
export const PERSON_H = 56;
export const UNION_W = 8;
export const UNION_H = 8;

const H_GAP = 32;
const PARTNER_GAP = 24;
const V_GAP = 110;
const ROOT_GAP = 80;

type GraphMaps = {
  isPerson: (id: string) => boolean;
  isUnion: (id: string) => boolean;
  partnerUnionsOf: Map<string, string[]>;
  unionMembers: Map<string, string[]>;
  unionChildren: Map<string, string[]>;
  parentUnionOf: Map<string, string>;
};

function buildMaps(nodes: Node[], edges: Edge[]): GraphMaps {
  const typeById = new Map(nodes.map((n) => [n.id, n.type]));
  const isPerson = (id: string) => typeById.get(id) === "person";
  const isUnion = (id: string) => typeById.get(id) === "union";

  const partnerUnionsOf = new Map<string, string[]>();
  const unionMembers = new Map<string, string[]>();
  const unionChildren = new Map<string, string[]>();
  const parentUnionOf = new Map<string, string>();

  const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => {
    const arr = m.get(k);
    if (arr) arr.push(v);
    else m.set(k, [v]);
  };

  for (const e of edges) {
    if (isPerson(e.source) && isUnion(e.target)) {
      push(partnerUnionsOf, e.source, e.target);
      push(unionMembers, e.target, e.source);
    } else if (isUnion(e.source) && isPerson(e.target)) {
      push(unionChildren, e.source, e.target);
      parentUnionOf.set(e.target, e.source);
    }
  }

  return { isPerson, isUnion, partnerUnionsOf, unionMembers, unionChildren, parentUnionOf };
}

type Positions = Map<string, { x: number; y: number }>;

type SubtreeResult = {
  positions: Positions;
  width: number;
  anchorCenterX: number;
};

type NodeKind = "person" | "union";

function layoutSubtree(
  anchorId: string,
  g: GraphMaps,
  claimed: Set<string>,
  kinds: Map<string, NodeKind>,
): SubtreeResult {
  claimed.add(anchorId);
  const positions: Positions = new Map();

  type UnionBlock = {
    unionId: string;
    partnerId: string | null;
    childSubtrees: SubtreeResult[];
    childrenWidth: number;
  };
  const blocks: UnionBlock[] = [];

  for (const u of g.partnerUnionsOf.get(anchorId) ?? []) {
    const others = (g.unionMembers.get(u) ?? []).filter(
      (p) => p !== anchorId && !claimed.has(p),
    );
    const partner = others[0] ?? null;
    if (partner) claimed.add(partner);
    const kids = (g.unionChildren.get(u) ?? []).filter((c) => !claimed.has(c));
    const kidSubtrees = kids.map((k) => layoutSubtree(k, g, claimed, kinds));

    let cw = 0;
    kidSubtrees.forEach((s, i) => {
      if (i > 0) cw += H_GAP;
      cw += s.width;
    });

    blocks.push({ unionId: u, partnerId: partner, childSubtrees: kidSubtrees, childrenWidth: cw });
  }

  positions.set(anchorId, { x: 0, y: 0 });
  kinds.set(anchorId, "person");
  let cursorRight = PERSON_W;
  const unionCenters: number[] = [];

  const soloBlock =
    blocks.length === 1 && blocks[0].partnerId === null ? blocks[0] : null;

  if (soloBlock) {
    const anchorCenter = PERSON_W / 2;
    const unionLeft = anchorCenter - UNION_W / 2;
    positions.set(soloBlock.unionId, { x: unionLeft, y: PERSON_H + 12 });
    kinds.set(soloBlock.unionId, "union");
    unionCenters.push(anchorCenter);
  } else {
    blocks.forEach((b, i) => {
      let unionLeft = cursorRight + PARTNER_GAP;

      if (i > 0) {
        const prevCenter = unionCenters[i - 1];
        const prevCw = blocks[i - 1].childrenWidth;
        const currCw = b.childrenWidth;
        if (prevCw > 0 || currCw > 0) {
          const minCenter = prevCenter + prevCw / 2 + H_GAP + currCw / 2;
          const naiveCenter = unionLeft + UNION_W / 2;
          if (naiveCenter < minCenter) {
            unionLeft = minCenter - UNION_W / 2;
          }
        }
      }

      positions.set(b.unionId, { x: unionLeft, y: (PERSON_H - UNION_H) / 2 });
      kinds.set(b.unionId, "union");
      unionCenters.push(unionLeft + UNION_W / 2);
      cursorRight = unionLeft + UNION_W;

      if (b.partnerId) {
        const partnerLeft = cursorRight + PARTNER_GAP;
        positions.set(b.partnerId, { x: partnerLeft, y: 0 });
        kinds.set(b.partnerId, "person");
        cursorRight = partnerLeft + PERSON_W;
      }
    });
  }

  const childYBase = PERSON_H + V_GAP;
  blocks.forEach((b, i) => {
    if (b.childrenWidth === 0) return;
    let childCursor = unionCenters[i] - b.childrenWidth / 2;
    b.childSubtrees.forEach((st, k) => {
      if (k > 0) childCursor += H_GAP;
      for (const [nid, pos] of st.positions) {
        positions.set(nid, { x: pos.x + childCursor, y: pos.y + childYBase });
      }
      childCursor += st.width;
    });
  });

  let minX = Infinity;
  for (const [, p] of positions) if (p.x < minX) minX = p.x;
  if (minX !== 0 && minX !== Infinity) {
    for (const [id, p] of positions) positions.set(id, { x: p.x - minX, y: p.y });
  }

  let maxRight = 0;
  for (const [id, p] of positions) {
    const w = kinds.get(id) === "union" ? UNION_W : PERSON_W;
    if (p.x + w > maxRight) maxRight = p.x + w;
  }

  const anchorPos = positions.get(anchorId)!;
  const anchorCenterX = anchorPos.x + PERSON_W / 2;

  return { positions, width: maxRight, anchorCenterX };
}

export function computeAutoLayout(
  nodes: Node[],
  edges: Edge[],
): Map<string, { x: number; y: number }> {
  const g = buildMaps(nodes, edges);
  const claimed = new Set<string>();
  const kinds = new Map<string, NodeKind>();

  const persons = nodes.filter((n) => n.type === "person");

  const rootTrees: SubtreeResult[] = [];

  const trueRoots = persons.filter((p) => {
    if (g.parentUnionOf.has(p.id)) return false;
    const partnerUs = g.partnerUnionsOf.get(p.id) ?? [];
    const partnerHasParents = partnerUs.some((u) =>
      (g.unionMembers.get(u) ?? []).some(
        (m) => m !== p.id && g.parentUnionOf.has(m),
      ),
    );
    return !partnerHasParents;
  });

  for (const p of trueRoots) {
    if (claimed.has(p.id)) continue;
    const subtree = layoutSubtree(p.id, g, claimed, kinds);
    rootTrees.push(subtree);
  }

  for (const n of persons) {
    if (claimed.has(n.id)) continue;
    const subtree = layoutSubtree(n.id, g, claimed, kinds);
    rootTrees.push(subtree);
  }

  const finalPositions = new Map<string, { x: number; y: number }>();
  let rootCursor = 0;
  rootTrees.forEach((rt, i) => {
    if (i > 0) rootCursor += ROOT_GAP;
    for (const [id, pos] of rt.positions) {
      finalPositions.set(id, { x: pos.x + rootCursor, y: pos.y });
    }
    rootCursor += rt.width;
  });

  for (const n of nodes) {
    if (!finalPositions.has(n.id)) {
      finalPositions.set(n.id, { x: 0, y: 0 });
    }
  }

  return finalPositions;
}

export function applyAutoLayout(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const positions = computeAutoLayout(nodes, edges);
  const typeById = new Map(nodes.map((n) => [n.id, n.type]));
  const isPerson = (id: string) => typeById.get(id) === "person";
  const isUnion = (id: string) => typeById.get(id) === "union";

  const newNodes = nodes.map((n) => {
    const p = positions.get(n.id);
    return p ? { ...n, position: p } : n;
  });

  const partnerEdgesByPerson = new Map<string, Edge[]>();
  for (const e of edges) {
    if (isPerson(e.source) && isUnion(e.target)) {
      const arr = partnerEdgesByPerson.get(e.source) ?? [];
      arr.push(e);
      partnerEdgesByPerson.set(e.source, arr);
    }
  }

  const sideConnectedEdgeIds = new Set<string>();
  for (const [pid, pedges] of partnerEdgesByPerson) {
    const pp = positions.get(pid);
    if (!pp) continue;
    const pCenter = pp.x + PERSON_W / 2;
    let nearestEdge: Edge | null = null;
    let nearestDist = Infinity;
    for (const e of pedges) {
      const up = positions.get(e.target);
      if (!up) continue;
      const uCenter = up.x + UNION_W / 2;
      const sameRow = Math.abs(pp.y - up.y) < 30;
      if (!sameRow) continue;
      const d = Math.abs(uCenter - pCenter);
      if (d < nearestDist) {
        nearestDist = d;
        nearestEdge = e;
      }
    }
    if (nearestEdge) sideConnectedEdgeIds.add(nearestEdge.id);
  }

  const newEdges = edges.map((e) => {
    if (isPerson(e.source) && isUnion(e.target)) {
      const pp = positions.get(e.source);
      const up = positions.get(e.target);
      if (!pp || !up) return e;
      const pCenter = pp.x + PERSON_W / 2;
      const uCenter = up.x + UNION_W / 2;
      const personAbove = pp.y + PERSON_H <= up.y;
      if (Math.abs(pCenter - uCenter) < 4 && personAbove) {
        return { ...e, sourceHandle: "bottom", targetHandle: "top", type: "smoothstep" };
      }
      if (sideConnectedEdgeIds.has(e.id)) {
        const personOnLeft = pCenter < uCenter;
        return {
          ...e,
          sourceHandle: personOnLeft ? "right" : "left",
          targetHandle: personOnLeft ? "left" : "right",
          type: "straight",
        };
      }
      return { ...e, sourceHandle: "bottom", targetHandle: "top", type: "smoothstep" };
    }
    if (isUnion(e.source) && isPerson(e.target)) {
      return { ...e, sourceHandle: "bottom", targetHandle: "top", type: "smoothstep" };
    }
    return e;
  });

  return { nodes: newNodes, edges: newEdges };
}
