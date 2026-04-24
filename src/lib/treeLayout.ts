import type { Node, Edge } from "@xyflow/react";

export const PERSON_W = 152;
export const PERSON_H = 56;
export const UNION_W = 8;
export const UNION_H = 8;

const H_GAP = 32;
const PARTNER_GAP = 24;
const V_GAP = 110;
const ROOT_GAP = 80;
const UNION_DROP = 40;

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

type DeferredUnion = { unionId: string };

function layoutSubtree(
  anchorId: string,
  g: GraphMaps,
  claimed: Set<string>,
  kinds: Map<string, NodeKind>,
  deferred: Map<string, DeferredUnion>,
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
    const allOthers = (g.unionMembers.get(u) ?? []).filter((p) => p !== anchorId);
    const rawPartner = allOthers[0] ?? null;
    // Defer the union if the partner has their own ancestors: they belong to a
    // separate root tree and will be positioned there. We place the union
    // between the two partners after both root trees are laid out.
    if (rawPartner && g.parentUnionOf.has(rawPartner)) {
      if (!deferred.has(u)) deferred.set(u, { unionId: u });
      continue;
    }
    const partner = allOthers.find((p) => !claimed.has(p)) ?? null;
    if (partner) claimed.add(partner);
    const kids = (g.unionChildren.get(u) ?? []).filter((c) => !claimed.has(c));
    const kidSubtrees = kids.map((k) => layoutSubtree(k, g, claimed, kinds, deferred));

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
    positions.set(soloBlock.unionId, { x: unionLeft, y: PERSON_H + UNION_DROP });
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

      positions.set(b.unionId, { x: unionLeft, y: PERSON_H + UNION_DROP });
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
    if (b.childSubtrees.length === 0) return;
    let cursor = 0;
    const subtreeLefts: number[] = [];
    const anchors: number[] = [];
    b.childSubtrees.forEach((st, k) => {
      if (k > 0) cursor += H_GAP;
      subtreeLefts.push(cursor);
      anchors.push(cursor + st.anchorCenterX);
      cursor += st.width;
    });
    const n = anchors.length;
    const median =
      n % 2 === 1
        ? anchors[(n - 1) / 2]
        : (anchors[n / 2 - 1] + anchors[n / 2]) / 2;
    const shift = unionCenters[i] - median;
    b.childSubtrees.forEach((st, k) => {
      const childCursor = subtreeLefts[k] + shift;
      for (const [nid, pos] of st.positions) {
        positions.set(nid, { x: pos.x + childCursor, y: pos.y + childYBase });
      }
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
  const deferred = new Map<string, DeferredUnion>();

  const persons = nodes.filter((n) => n.type === "person");

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

  const finalPositions = new Map<string, { x: number; y: number }>();
  let rootCursor = 0;
  const placeTree = (subtree: SubtreeResult, isFirst: boolean) => {
    if (!isFirst) rootCursor += ROOT_GAP;
    for (const [id, pos] of subtree.positions) {
      finalPositions.set(id, { x: pos.x + rootCursor, y: pos.y });
    }
    rootCursor += subtree.width;
  };

  let placedAny = false;
  for (const p of trueRoots) {
    if (claimed.has(p.id)) continue;
    const subtree = layoutSubtree(p.id, g, claimed, kinds, deferred);
    placeTree(subtree, !placedAny);
    placedAny = true;
  }

  // Process deferred unions (couple unions whose two partners each belong to
  // separate root trees). Place each union at the midpoint of its partners and
  // lay out its children subtree centered below.
  const pending = [...deferred.keys()];
  deferred.clear();
  while (pending.length > 0) {
    const uId = pending.shift()!;
    const members = g.unionMembers.get(uId) ?? [];
    if (members.length < 2) continue;
    const a = members[0];
    const b = members[1];
    const ap = finalPositions.get(a);
    const bp = finalPositions.get(b);
    if (!ap || !bp) continue;
    const aCenter = ap.x + PERSON_W / 2;
    const bCenter = bp.x + PERSON_W / 2;
    const uCenter = (aCenter + bCenter) / 2;
    const uY = ap.y + PERSON_H + UNION_DROP;
    finalPositions.set(uId, { x: uCenter - UNION_W / 2, y: uY });
    kinds.set(uId, "union");
    claimed.add(uId);

    const kidIds = (g.unionChildren.get(uId) ?? []).filter((k) => !claimed.has(k));
    if (kidIds.length === 0) continue;
    const kidSubtrees = kidIds.map((k) => layoutSubtree(k, g, claimed, kinds, deferred));
    for (const newU of deferred.keys()) pending.push(newU);
    deferred.clear();

    let cursor = 0;
    const lefts: number[] = [];
    const anchors: number[] = [];
    kidSubtrees.forEach((st, k) => {
      if (k > 0) cursor += H_GAP;
      lefts.push(cursor);
      anchors.push(cursor + st.anchorCenterX);
      cursor += st.width;
    });
    const n = anchors.length;
    const median =
      n % 2 === 1
        ? anchors[(n - 1) / 2]
        : (anchors[n / 2 - 1] + anchors[n / 2]) / 2;
    const shift = uCenter - median;
    const childY = ap.y + PERSON_H + V_GAP;
    kidSubtrees.forEach((st, k) => {
      const left = lefts[k] + shift;
      for (const [nid, pos] of st.positions) {
        finalPositions.set(nid, { x: pos.x + left, y: pos.y + childY });
      }
    });
  }

  for (const n of persons) {
    if (claimed.has(n.id)) continue;
    const subtree = layoutSubtree(n.id, g, claimed, kinds, deferred);
    placeTree(subtree, !placedAny);
    placedAny = true;
  }

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

  const newEdges = edges.map((e) => {
    if (isPerson(e.source) && isUnion(e.target)) {
      return { ...e, sourceHandle: "bottom", targetHandle: "top", type: "smoothstep" };
    }
    if (isUnion(e.source) && isPerson(e.target)) {
      return { ...e, sourceHandle: "bottom", targetHandle: "top", type: "smoothstep" };
    }
    return e;
  });

  return { nodes: newNodes, edges: newEdges };
}
