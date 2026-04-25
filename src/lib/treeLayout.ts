import type { Node, Edge } from "@xyflow/react";

export const PERSON_W = 152;
export const PERSON_H = 56;
export const UNION_W = 8;
export const UNION_H = 8;

const H_GAP = 32;
const PARTNER_GAP = 24;
const V_GAP = 110;
const ROOT_GAP = 80;
const UNION_DROP = 20;

type GraphMaps = {
  isPerson: (id: string) => boolean;
  isUnion: (id: string) => boolean;
  partnerUnionsOf: Map<string, string[]>;
  unionMembers: Map<string, string[]>;
  unionChildren: Map<string, string[]>;
  parentUnionOf: Map<string, string>;
  personIndex: Map<string, number>;
};

function buildMaps(nodes: Node[], edges: Edge[]): GraphMaps {
  const typeById = new Map(nodes.map((n) => [n.id, n.type]));
  const isPerson = (id: string) => typeById.get(id) === "person";
  const isUnion = (id: string) => typeById.get(id) === "union";

  const partnerUnionsOf = new Map<string, string[]>();
  const unionMembers = new Map<string, string[]>();
  const unionChildren = new Map<string, string[]>();
  const parentUnionOf = new Map<string, string>();
  const personIndex = new Map<string, number>();
  nodes.forEach((n, i) => {
    if (n.type === "person") personIndex.set(n.id, i);
  });

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

  return { isPerson, isUnion, partnerUnionsOf, unionMembers, unionChildren, parentUnionOf, personIndex };
}

type Positions = Map<string, { x: number; y: number }>;

type SubtreeResult = {
  positions: Positions;
  width: number;
  anchorCenterX: number;
};

type NodeKind = "person" | "union";

type DeferredUnion = { unionId: string };

type PartnerSide = "left" | "right" | "auto";

function layoutSubtree(
  anchorId: string,
  g: GraphMaps,
  claimed: Set<string>,
  kinds: Map<string, NodeKind>,
  deferred: Map<string, DeferredUnion>,
  partnerSide: PartnerSide = "auto",
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
    // Hint each child which side its partner should sit on, so an in-law never
    // lands between two blood siblings. First-born keeps its partner to the
    // left, last-born to the right; middle children fall back to insertion
    // order. One-child subtrees have no in-law to avoid, so leave as "auto".
    const kidSubtrees = kids.map((k, idx) => {
      let side: PartnerSide = "auto";
      if (kids.length > 1) {
        if (idx === 0) side = "left";
        else if (idx === kids.length - 1) side = "right";
      }
      return layoutSubtree(k, g, claimed, kinds, deferred, side);
    });

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

  // Decide which side the partner sits on. Caller-supplied hint wins (lets a
  // parent push in-laws to the outside of a sibling row). Without a hint, keep
  // the original horizontal order: partner added before the anchor in the node
  // list stays on the left, so adding parents to the right-hand partner of a
  // couple doesn't cause a swap.
  const singlePartnerBlock =
    blocks.length === 1 && blocks[0].partnerId != null ? blocks[0] : null;
  let partnerOnLeft = false;
  if (singlePartnerBlock != null) {
    if (partnerSide === "left") partnerOnLeft = true;
    else if (partnerSide === "right") partnerOnLeft = false;
    else
      partnerOnLeft =
        (g.personIndex.get(singlePartnerBlock.partnerId!) ?? Infinity) <
        (g.personIndex.get(anchorId) ?? -Infinity);
  }

  if (soloBlock) {
    const anchorCenter = PERSON_W / 2;
    const unionLeft = anchorCenter - UNION_W / 2;
    positions.set(soloBlock.unionId, { x: unionLeft, y: PERSON_H + UNION_DROP });
    kinds.set(soloBlock.unionId, "union");
    unionCenters.push(anchorCenter);
  } else if (partnerOnLeft && singlePartnerBlock) {
    const b = singlePartnerBlock;
    const partnerLeft = 0;
    positions.set(b.partnerId!, { x: partnerLeft, y: 0 });
    kinds.set(b.partnerId!, "person");
    const unionLeft = PERSON_W + PARTNER_GAP;
    positions.set(b.unionId, { x: unionLeft, y: PERSON_H + UNION_DROP });
    kinds.set(b.unionId, "union");
    unionCenters.push(unionLeft + UNION_W / 2);
    const anchorLeft = unionLeft + UNION_W + PARTNER_GAP;
    positions.set(anchorId, { x: anchorLeft, y: 0 });
    cursorRight = anchorLeft + PERSON_W;
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

  // Collect every person downstream of a root: their partners (when those
  // partners don't come from another tree), their children, and recursively
  // all descendants — including descendants reached by crossing a deferred
  // partner union, since that child lineage still flows from THIS root. Lets
  // us order root trees by the original index of their deepest descendant,
  // so the tree containing the earliest-added ego-side ancestor goes left.
  const collectTreePersons = (rootId: string): Set<string> => {
    const out = new Set<string>();
    const stack = [rootId];
    while (stack.length) {
      const pid = stack.pop()!;
      if (out.has(pid)) continue;
      if (!g.isPerson(pid)) continue;
      out.add(pid);
      for (const u of g.partnerUnionsOf.get(pid) ?? []) {
        const others = (g.unionMembers.get(u) ?? []).filter((m) => m !== pid);
        const partner = others[0];
        if (partner && !g.parentUnionOf.has(partner)) stack.push(partner);
        for (const c of g.unionChildren.get(u) ?? []) stack.push(c);
      }
    }
    return out;
  };

  // Two partner-free roots (spouses at the top of a tree) both qualify as
  // trueRoots — dedupe so each tree has exactly one canonical root. Keeps
  // the cross-tree ordering constraints below from slipping past a duplicate.
  const seenInTree = new Set<string>();
  const dedupedRoots: Node[] = [];
  for (const r of trueRoots) {
    if (seenInTree.has(r.id)) continue;
    dedupedRoots.push(r);
    for (const id of collectTreePersons(r.id)) seenInTree.add(id);
  }
  trueRoots.length = 0;
  trueRoots.push(...dedupedRoots);

  const treeKey = new Map<string, number>();
  const personToRoot = new Map<string, string>();
  for (const p of trueRoots) {
    let min = Infinity;
    for (const id of collectTreePersons(p.id)) {
      personToRoot.set(id, p.id);
      const idx = g.personIndex.get(id);
      if (idx != null && idx < min) min = idx;
    }
    treeKey.set(p.id, min);
  }

  // Cross-tree couple constraint: when a person with siblings marries someone
  // who also has ancestors (so their union gets deferred and the partner lives
  // in a separate root tree), keep the same outer-side placement we use for
  // in-tree partners. First-born's partner-tree sorts LEFT of the first-born's
  // tree; last-born's partner-tree sorts RIGHT. Without this, partner-tree
  // ordering falls back to personIndex and can flip the partner to the wrong
  // side of the couple once parents are added to them.
  const rootBefore = new Map<string, Set<string>>();
  const addRootBefore = (a: string, b: string) => {
    if (a === b) return;
    let s = rootBefore.get(a);
    if (!s) {
      s = new Set();
      rootBefore.set(a, s);
    }
    s.add(b);
  };
  for (const person of persons) {
    const parentU = g.parentUnionOf.get(person.id);
    if (!parentU) continue;
    const siblings = g.unionChildren.get(parentU) ?? [];
    if (siblings.length < 2) continue;
    const idx = siblings.indexOf(person.id);
    let hint: PartnerSide = "auto";
    if (idx === 0) hint = "left";
    else if (idx === siblings.length - 1) hint = "right";
    if (hint === "auto") continue;
    for (const u of g.partnerUnionsOf.get(person.id) ?? []) {
      const others = (g.unionMembers.get(u) ?? []).filter((m) => m !== person.id);
      const partner = others[0];
      if (!partner || !g.parentUnionOf.has(partner)) continue;
      const myTree = personToRoot.get(person.id);
      const partnerTree = personToRoot.get(partner);
      if (!myTree || !partnerTree || myTree === partnerTree) continue;
      if (hint === "left") addRootBefore(partnerTree, myTree);
      else addRootBefore(myTree, partnerTree);
    }
  }

  // Kahn's algorithm ordered by treeKey for ties. Falls back to pure treeKey
  // sort if constraints form a cycle (shouldn't happen, but don't hang layout).
  const keyCmp = (a: string, b: string) =>
    (treeKey.get(a) ?? 0) - (treeKey.get(b) ?? 0);
  const indeg = new Map<string, number>();
  for (const r of trueRoots) indeg.set(r.id, 0);
  for (const [, targets] of rootBefore) {
    for (const t of targets) {
      if (!indeg.has(t)) continue;
      indeg.set(t, (indeg.get(t) ?? 0) + 1);
    }
  }
  const ready: string[] = [];
  for (const [id, d] of indeg) if (d === 0) ready.push(id);
  ready.sort(keyCmp);
  const topo: string[] = [];
  while (ready.length) {
    const next = ready.shift()!;
    topo.push(next);
    for (const nb of rootBefore.get(next) ?? []) {
      if (!indeg.has(nb)) continue;
      const d = (indeg.get(nb) ?? 0) - 1;
      indeg.set(nb, d);
      if (d === 0) {
        let i = 0;
        while (i < ready.length && keyCmp(ready[i], nb) <= 0) i++;
        ready.splice(i, 0, nb);
      }
    }
  }
  if (topo.length === trueRoots.length) {
    const order = new Map(topo.map((id, i) => [id, i]));
    trueRoots.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  } else {
    trueRoots.sort((a, b) => keyCmp(a.id, b.id));
  }

  const finalPositions = new Map<string, { x: number; y: number }>();
  let rootCursor = 0;
  const treeByNode = new Map<string, string>();
  const placeTree = (subtree: SubtreeResult, isFirst: boolean, rootId: string) => {
    if (!isFirst) rootCursor += ROOT_GAP;
    for (const [id, pos] of subtree.positions) {
      finalPositions.set(id, { x: pos.x + rootCursor, y: pos.y });
      treeByNode.set(id, rootId);
    }
    rootCursor += subtree.width;
  };

  let placedAny = false;
  for (const p of trueRoots) {
    if (claimed.has(p.id)) continue;
    const subtree = layoutSubtree(p.id, g, claimed, kinds, deferred);
    placeTree(subtree, !placedAny, p.id);
    placedAny = true;
  }

  // Shift every node owned by `treeId` down by `delta` pixels.
  const shiftTree = (treeId: string, delta: number) => {
    if (delta === 0) return;
    for (const [id, tree] of treeByNode) {
      if (tree !== treeId) continue;
      const pos = finalPositions.get(id);
      if (pos) finalPositions.set(id, { x: pos.x, y: pos.y + delta });
    }
  };

  // Process deferred unions (couple unions whose two partners each belong to
  // separate root trees). Place each union at the midpoint of its partners and
  // lay out its children subtree centered below. Before placing, vertically
  // align the two partners by shifting the shallower tree down so both sit on
  // the same generational row.
  const pending = [...deferred.keys()];
  deferred.clear();
  while (pending.length > 0) {
    const uId = pending.shift()!;
    const members = g.unionMembers.get(uId) ?? [];
    if (members.length < 2) continue;
    const a = members[0];
    const b = members[1];
    let ap = finalPositions.get(a);
    let bp = finalPositions.get(b);
    if (!ap || !bp) continue;

    if (ap.y !== bp.y) {
      const shallowId = ap.y < bp.y ? a : b;
      const shallowTree = treeByNode.get(shallowId);
      if (shallowTree != null) {
        shiftTree(shallowTree, Math.abs(ap.y - bp.y));
        ap = finalPositions.get(a)!;
        bp = finalPositions.get(b)!;
      }
    }

    const aCenter = ap.x + PERSON_W / 2;
    const bCenter = bp.x + PERSON_W / 2;
    const uCenter = (aCenter + bCenter) / 2;
    const uY = ap.y + PERSON_H + UNION_DROP;
    finalPositions.set(uId, { x: uCenter - UNION_W / 2, y: uY });
    kinds.set(uId, "union");
    claimed.add(uId);
    // Union and its descendants join the anchor-a's tree so later alignment
    // passes can shift them together.
    const mergedTree = treeByNode.get(a) ?? a;
    treeByNode.set(uId, mergedTree);

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
        treeByNode.set(nid, mergedTree);
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
      return { ...e, sourceHandle: "bottom", targetHandle: "top", type: "partner" };
    }
    if (isUnion(e.source) && isPerson(e.target)) {
      return { ...e, sourceHandle: "bottom", targetHandle: "top", type: "smoothstep" };
    }
    return e;
  });

  return { nodes: newNodes, edges: newEdges };
}
