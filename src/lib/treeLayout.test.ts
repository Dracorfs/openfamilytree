import test from "node:test";
import assert from "node:assert/strict";
import type { Node, Edge } from "@xyflow/react";
import { computeAutoLayout, PERSON_W, PERSON_H, UNION_W, UNION_H } from "./treeLayout";

function person(id: string): Node {
  return { id, type: "person", position: { x: 0, y: 0 }, data: {} };
}
function union(id: string): Node {
  return { id, type: "union", position: { x: 0, y: 0 }, data: {} };
}
function partnerEdge(p: string, u: string): Edge {
  return { id: `${p}->${u}`, source: p, target: u };
}
function childEdge(u: string, c: string): Edge {
  return { id: `${u}->${c}`, source: u, target: c };
}

const centerX = (pos: { x: number; y: number }) => pos.x + PERSON_W / 2;

test("partner of first-born sibling sits on left (away from in-laws)", () => {
  const nodes: Node[] = [
    person("dad"),
    person("mom"),
    person("me"),
    person("sibling"),
    person("partner"),
    union("u_parents"),
    union("u_me"),
  ];
  const edges: Edge[] = [
    partnerEdge("dad", "u_parents"),
    partnerEdge("mom", "u_parents"),
    childEdge("u_parents", "me"),
    childEdge("u_parents", "sibling"),
    partnerEdge("me", "u_me"),
    partnerEdge("partner", "u_me"),
  ];

  const pos = computeAutoLayout(nodes, edges);
  const me = pos.get("me")!;
  const sibling = pos.get("sibling")!;
  const partner = pos.get("partner")!;

  assert.ok(partner.x < me.x, "partner must be left of me");
  assert.ok(me.x < sibling.x, "me must be left of sibling");
  assert.ok(
    Math.abs(centerX(sibling) - centerX(me)) <
      Math.abs(centerX(sibling) - centerX(partner)),
    "sibling must be closer to me than to partner",
  );
});

test("partner of last-born sibling sits on right", () => {
  const nodes: Node[] = [
    person("dad"),
    person("mom"),
    person("sibling"),
    person("me"),
    person("partner"),
    union("u_parents"),
    union("u_me"),
  ];
  const edges: Edge[] = [
    partnerEdge("dad", "u_parents"),
    partnerEdge("mom", "u_parents"),
    childEdge("u_parents", "sibling"),
    childEdge("u_parents", "me"),
    partnerEdge("me", "u_me"),
    partnerEdge("partner", "u_me"),
  ];

  const pos = computeAutoLayout(nodes, edges);
  const me = pos.get("me")!;
  const sibling = pos.get("sibling")!;
  const partner = pos.get("partner")!;

  assert.ok(sibling.x < me.x, "sibling must be left of me");
  assert.ok(me.x < partner.x, "me must be left of partner");
  assert.ok(
    Math.abs(centerX(sibling) - centerX(me)) <
      Math.abs(centerX(sibling) - centerX(partner)),
    "sibling must be closer to me than to partner",
  );
});

test("single child with partner keeps insertion-order placement", () => {
  // Only child. No in-law to avoid. Partner added after child => stays right.
  const nodes: Node[] = [
    person("dad"),
    person("mom"),
    person("me"),
    person("partner"),
    union("u_parents"),
    union("u_me"),
  ];
  const edges: Edge[] = [
    partnerEdge("dad", "u_parents"),
    partnerEdge("mom", "u_parents"),
    childEdge("u_parents", "me"),
    partnerEdge("me", "u_me"),
    partnerEdge("partner", "u_me"),
  ];

  const pos = computeAutoLayout(nodes, edges);
  const me = pos.get("me")!;
  const partner = pos.get("partner")!;
  assert.ok(me.x < partner.x, "partner follows me (auto side, insertion order)");
});

test("three siblings: outer partners pushed outward, middle stays auto", () => {
  const nodes: Node[] = [
    person("dad"),
    person("mom"),
    person("a"),
    person("b"),
    person("c"),
    person("pa"),
    person("pc"),
    union("u_parents"),
    union("u_a"),
    union("u_c"),
  ];
  const edges: Edge[] = [
    partnerEdge("dad", "u_parents"),
    partnerEdge("mom", "u_parents"),
    childEdge("u_parents", "a"),
    childEdge("u_parents", "b"),
    childEdge("u_parents", "c"),
    partnerEdge("a", "u_a"),
    partnerEdge("pa", "u_a"),
    partnerEdge("c", "u_c"),
    partnerEdge("pc", "u_c"),
  ];

  const pos = computeAutoLayout(nodes, edges);
  const a = pos.get("a")!;
  const b = pos.get("b")!;
  const c = pos.get("c")!;
  const pa = pos.get("pa")!;
  const pc = pos.get("pc")!;

  assert.ok(pa.x < a.x, "a's partner pushed left of a");
  assert.ok(a.x < b.x, "a left of b");
  assert.ok(b.x < c.x, "b left of c");
  assert.ok(c.x < pc.x, "c's partner pushed right of c");
});

test("partner with own parents keeps same side as before parents were added", () => {
  // First-born Me's partner gets parents: partner tree must stay LEFT of me.
  const nodes: Node[] = [
    person("meDad"),
    person("meMom"),
    person("me"),
    person("sibling"),
    person("partner"),
    person("pDad"),
    person("pMom"),
    union("u_meParents"),
    union("u_couple"),
    union("u_pParents"),
  ];
  const edges: Edge[] = [
    partnerEdge("meDad", "u_meParents"),
    partnerEdge("meMom", "u_meParents"),
    childEdge("u_meParents", "me"),
    childEdge("u_meParents", "sibling"),
    partnerEdge("me", "u_couple"),
    partnerEdge("partner", "u_couple"),
    partnerEdge("pDad", "u_pParents"),
    partnerEdge("pMom", "u_pParents"),
    childEdge("u_pParents", "partner"),
  ];

  const pos = computeAutoLayout(nodes, edges);
  assert.ok(pos.get("partner")!.x < pos.get("me")!.x, "partner left of me");
  assert.ok(pos.get("me")!.x < pos.get("sibling")!.x, "me left of sibling");
  assert.ok(
    pos.get("pDad")!.x < pos.get("meDad")!.x,
    "partner's parents tree placed left of me's parents tree",
  );
});

test("last-born's partner with own parents stays on right", () => {
  const nodes: Node[] = [
    person("meDad"),
    person("meMom"),
    person("sibling"),
    person("me"),
    person("partner"),
    person("pDad"),
    person("pMom"),
    union("u_meParents"),
    union("u_couple"),
    union("u_pParents"),
  ];
  const edges: Edge[] = [
    partnerEdge("meDad", "u_meParents"),
    partnerEdge("meMom", "u_meParents"),
    childEdge("u_meParents", "sibling"),
    childEdge("u_meParents", "me"),
    partnerEdge("me", "u_couple"),
    partnerEdge("partner", "u_couple"),
    partnerEdge("pDad", "u_pParents"),
    partnerEdge("pMom", "u_pParents"),
    childEdge("u_pParents", "partner"),
  ];

  const pos = computeAutoLayout(nodes, edges);
  assert.ok(pos.get("sibling")!.x < pos.get("me")!.x, "sibling left of me");
  assert.ok(pos.get("me")!.x < pos.get("partner")!.x, "me left of partner");
  assert.ok(
    pos.get("meDad")!.x < pos.get("pDad")!.x,
    "me's parents tree placed left of partner's parents tree",
  );
});

test("partner shares row with spouse (same y)", () => {
  const nodes: Node[] = [
    person("dad"),
    person("mom"),
    person("me"),
    person("sibling"),
    person("partner"),
    union("u_parents"),
    union("u_me"),
  ];
  const edges: Edge[] = [
    partnerEdge("dad", "u_parents"),
    partnerEdge("mom", "u_parents"),
    childEdge("u_parents", "me"),
    childEdge("u_parents", "sibling"),
    partnerEdge("me", "u_me"),
    partnerEdge("partner", "u_me"),
  ];

  const pos = computeAutoLayout(nodes, edges);
  assert.equal(pos.get("me")!.y, pos.get("partner")!.y);
  assert.equal(pos.get("me")!.y, pos.get("sibling")!.y);
});

function assertNoOverlaps(pos: Map<string, { x: number; y: number }>, nodes: Node[]) {
  const typeById = new Map(nodes.map((n) => [n.id, n.type]));
  const rects: { id: string; x: number; y: number; w: number; h: number }[] = [];
  for (const [id, p] of pos) {
    const isPerson = typeById.get(id) === "person";
    rects.push({
      id,
      x: p.x,
      y: p.y,
      w: isPerson ? PERSON_W : UNION_W,
      h: isPerson ? PERSON_H : UNION_H,
    });
  }
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
        assert.fail(
          `Overlap: ${a.id} (${a.x},${a.y},${a.w}x${a.h}) and ${b.id} (${b.x},${b.y},${b.w}x${b.h})`,
        );
      }
    }
  }
}

test("large tree: grandparents with many children and grandchildren have no overlaps", () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push(person("gpa"), person("gma"), union("u_gp"));
  edges.push(partnerEdge("gpa", "u_gp"), partnerEdge("gma", "u_gp"));

  const childCount = 8;
  for (let i = 0; i < childCount; i++) {
    const childId = `child_${i}`;
    nodes.push(person(childId));
    edges.push(childEdge("u_gp", childId));

    const spouseId = `spouse_${i}`;
    const uId = `u_couple_${i}`;
    nodes.push(person(spouseId), union(uId));
    edges.push(partnerEdge(childId, uId), partnerEdge(spouseId, uId));

    const gcCount = 3;
    for (let j = 0; j < gcCount; j++) {
      const gcId = `gc_${i}_${j}`;
      nodes.push(person(gcId));
      edges.push(childEdge(uId, gcId));
    }
  }

  const pos = computeAutoLayout(nodes, edges);
  assertNoOverlaps(pos, nodes);
});

test("cross-tree couple with children: no overlaps", () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push(person("dadA"), person("momA"), union("uA"));
  edges.push(partnerEdge("dadA", "uA"), partnerEdge("momA", "uA"));
  nodes.push(person("childA1"), person("childA2"));
  edges.push(childEdge("uA", "childA1"), childEdge("uA", "childA2"));

  nodes.push(person("dadB"), person("momB"), union("uB"));
  edges.push(partnerEdge("dadB", "uB"), partnerEdge("momB", "uB"));
  nodes.push(person("childB1"), person("childB2"));
  edges.push(childEdge("uB", "childB1"), childEdge("uB", "childB2"));

  nodes.push(union("u_cross"));
  edges.push(partnerEdge("childA1", "u_cross"), partnerEdge("childB1", "u_cross"));

  for (let i = 0; i < 4; i++) {
    const gcId = `gc_cross_${i}`;
    nodes.push(person(gcId));
    edges.push(childEdge("u_cross", gcId));
  }

  const pos = computeAutoLayout(nodes, edges);
  assertNoOverlaps(pos, nodes);
});

test("multiple cross-tree marriages at different generations, no overlaps", () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Tree A: great-grandparents with deep lineage
  nodes.push(person("a_ggp"), person("a_ggm"), union("u_a_gg"));
  edges.push(partnerEdge("a_ggp", "u_a_gg"), partnerEdge("a_ggm", "u_a_gg"));

  for (let i = 0; i < 5; i++) {
    const gp = `a_gp_${i}`;
    nodes.push(person(gp));
    edges.push(childEdge("u_a_gg", gp));
    if (i < 3) {
      const gs = `a_gs_${i}`;
      const gu = `u_a_g_${i}`;
      nodes.push(person(gs), union(gu));
      edges.push(partnerEdge(gp, gu), partnerEdge(gs, gu));
      for (let j = 0; j < 3; j++) {
        const kid = `a_kid_${i}_${j}`;
        nodes.push(person(kid));
        edges.push(childEdge(gu, kid));
      }
    }
  }

  // Tree B: another family
  nodes.push(person("b_ggp"), person("b_ggm"), union("u_b_gg"));
  edges.push(partnerEdge("b_ggp", "u_b_gg"), partnerEdge("b_ggm", "u_b_gg"));

  for (let i = 0; i < 4; i++) {
    const gp = `b_gp_${i}`;
    nodes.push(person(gp));
    edges.push(childEdge("u_b_gg", gp));
    if (i < 2) {
      const gs = `b_gs_${i}`;
      const gu = `u_b_g_${i}`;
      nodes.push(person(gs), union(gu));
      edges.push(partnerEdge(gp, gu), partnerEdge(gs, gu));
      for (let j = 0; j < 3; j++) {
        const kid = `b_kid_${i}_${j}`;
        nodes.push(person(kid));
        edges.push(childEdge(gu, kid));
      }
    }
  }

  // Cross-tree marriage: a_gp_0 marries b_gp_0's child
  // But a_gp_0 already has a spouse within tree A...
  // Instead: a_kid_0_0 marries b_kid_0_0
  nodes.push(union("u_cross1"));
  edges.push(partnerEdge("a_kid_0_0", "u_cross1"), partnerEdge("b_kid_0_0", "u_cross1"));
  for (let i = 0; i < 3; i++) {
    const gc = `cross1_gc_${i}`;
    nodes.push(person(gc));
    edges.push(childEdge("u_cross1", gc));
  }

  // Second cross-tree marriage at same generation
  nodes.push(union("u_cross2"));
  edges.push(partnerEdge("a_kid_1_0", "u_cross2"), partnerEdge("b_kid_1_0", "u_cross2"));
  for (let i = 0; i < 2; i++) {
    const gc = `cross2_gc_${i}`;
    nodes.push(person(gc));
    edges.push(childEdge("u_cross2", gc));
  }

  const pos = computeAutoLayout(nodes, edges);
  assertNoOverlaps(pos, nodes);
});

test("86+ node tree: 5 generations Italian family style, no overlaps", () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let uid = 0;
  const u = () => `u_${uid++}`;

  // Gen 1: great-great-grandparents
  nodes.push(person("ggp"), person("ggm"));
  const ugg = u();
  nodes.push(union(ugg));
  edges.push(partnerEdge("ggp", ugg), partnerEdge("ggm", ugg));

  // Gen 2: 6 children of ggp, each with spouse and 3-5 kids
  const gen2kids: string[] = [];
  for (let i = 0; i < 6; i++) {
    const c = `g2_${i}`;
    const s = `g2s_${i}`;
    const cu = u();
    gen2kids.push(c);
    nodes.push(person(c), person(s), union(cu));
    edges.push(childEdge(ugg, c), partnerEdge(c, cu), partnerEdge(s, cu));

    const nKids = 3 + (i % 3);
    for (let j = 0; j < nKids; j++) {
      const gc = `g3_${i}_${j}`;
      nodes.push(person(gc));
      edges.push(childEdge(cu, gc));

      // Some gen3 kids also have spouses and children
      if (j < 2) {
        const gs = `g3s_${i}_${j}`;
        const gu = u();
        nodes.push(person(gs), union(gu));
        edges.push(partnerEdge(gc, gu), partnerEdge(gs, gu));
        for (let k = 0; k < 2; k++) {
          const ggc = `g4_${i}_${j}_${k}`;
          nodes.push(person(ggc));
          edges.push(childEdge(gu, ggc));
        }
      }
    }
  }

  const pos = computeAutoLayout(nodes, edges);
  assert.ok(nodes.length >= 80, `Expected 80+ nodes, got ${nodes.length}`);
  assertNoOverlaps(pos, nodes);
});

test("deep cross-tree marriage: children of deferred union don't overlap parent trees", () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let uid = 0;
  const u = () => `u_${uid++}`;

  // Tree A: 3 generations deep, wide bottom
  nodes.push(person("a_gp"), person("a_gm"));
  const uAg = u();
  nodes.push(union(uAg));
  edges.push(partnerEdge("a_gp", uAg), partnerEdge("a_gm", uAg));

  for (let i = 0; i < 4; i++) {
    const p = `a_p_${i}`;
    nodes.push(person(p));
    edges.push(childEdge(uAg, p));
    const sp = `a_sp_${i}`;
    const pu = u();
    nodes.push(person(sp), union(pu));
    edges.push(partnerEdge(p, pu), partnerEdge(sp, pu));
    for (let j = 0; j < 3; j++) {
      const kid = `a_kid_${i}_${j}`;
      nodes.push(person(kid));
      edges.push(childEdge(pu, kid));
    }
  }

  // Tree B: 3 generations deep, wide bottom
  nodes.push(person("b_gp"), person("b_gm"));
  const uBg = u();
  nodes.push(union(uBg));
  edges.push(partnerEdge("b_gp", uBg), partnerEdge("b_gm", uBg));

  for (let i = 0; i < 4; i++) {
    const p = `b_p_${i}`;
    nodes.push(person(p));
    edges.push(childEdge(uBg, p));
    const sp = `b_sp_${i}`;
    const pu = u();
    nodes.push(person(sp), union(pu));
    edges.push(partnerEdge(p, pu), partnerEdge(sp, pu));
    for (let j = 0; j < 3; j++) {
      const kid = `b_kid_${i}_${j}`;
      nodes.push(person(kid));
      edges.push(childEdge(pu, kid));
    }
  }

  // Cross-tree marriage at the child level with own children
  const uCross = u();
  nodes.push(union(uCross));
  edges.push(partnerEdge("a_kid_1_0", uCross), partnerEdge("b_kid_1_0", uCross));
  for (let i = 0; i < 4; i++) {
    const gc = `cross_gc_${i}`;
    nodes.push(person(gc));
    edges.push(childEdge(uCross, gc));
  }

  const pos = computeAutoLayout(nodes, edges);
  assertNoOverlaps(pos, nodes);
});

test("chained deferred unions: grandchild of cross-tree couple marries into yet another tree", () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Tree 1: greatGP1 → GP1, GP1 has child P1
  nodes.push(person("ggp1"), person("ggm1"), union("u_gg1"));
  edges.push(partnerEdge("ggp1", "u_gg1"), partnerEdge("ggm1", "u_gg1"));
  nodes.push(person("gp1"));
  edges.push(childEdge("u_gg1", "gp1"));
  nodes.push(person("gs1"), union("u_g1"));
  edges.push(partnerEdge("gp1", "u_g1"), partnerEdge("gs1", "u_g1"));
  nodes.push(person("p1"));
  edges.push(childEdge("u_g1", "p1"));

  // Tree 2: greatGP2 → GP2, GP2 has child P2
  nodes.push(person("ggp2"), person("ggm2"), union("u_gg2"));
  edges.push(partnerEdge("ggp2", "u_gg2"), partnerEdge("ggm2", "u_gg2"));
  nodes.push(person("gp2"));
  edges.push(childEdge("u_gg2", "gp2"));
  nodes.push(person("gs2"), union("u_g2"));
  edges.push(partnerEdge("gp2", "u_g2"), partnerEdge("gs2", "u_g2"));
  nodes.push(person("p2"));
  edges.push(childEdge("u_g2", "p2"));

  // Tree 3: root3 → child3
  nodes.push(person("root3a"), person("root3b"), union("u_root3"));
  edges.push(partnerEdge("root3a", "u_root3"), partnerEdge("root3b", "u_root3"));
  nodes.push(person("child3"));
  edges.push(childEdge("u_root3", "child3"));

  // Cross-tree marriage 1: P1 (tree1) + P2 (tree2) → kid_cross
  nodes.push(union("u_cross1"));
  edges.push(partnerEdge("p1", "u_cross1"), partnerEdge("p2", "u_cross1"));
  nodes.push(person("kid_cross"));
  edges.push(childEdge("u_cross1", "kid_cross"));

  // Chained deferred: kid_cross (no position until u_cross1 resolves) + child3
  nodes.push(union("u_cross2"));
  edges.push(partnerEdge("kid_cross", "u_cross2"), partnerEdge("child3", "u_cross2"));
  nodes.push(person("grandkid"));
  edges.push(childEdge("u_cross2", "grandkid"));

  const pos = computeAutoLayout(nodes, edges);

  for (const n of nodes) {
    assert.ok(pos.has(n.id), `node ${n.id} has no position`);
  }

  const kidCrossPos = pos.get("kid_cross")!;
  assert.ok(kidCrossPos.x !== 0 || kidCrossPos.y !== 0, "kid_cross should have a real position");

  const grandkidPos = pos.get("grandkid")!;
  assert.ok(grandkidPos.y > kidCrossPos.y, "grandkid should be below kid_cross");

  assertNoOverlaps(pos, nodes);
});

test("cousins not interleaved between siblings", () => {
  const nodes: Node[] = [
    person("gpa"), person("gma"), union("ug"),
    person("dad"), person("mom"), union("up"),
    person("unc"), person("aun"), union("uu"),
    person("me"), person("ser"), union("um"),
    person("sib"), person("cou"),
  ];
  const edges: Edge[] = [
    partnerEdge("gpa", "ug"), partnerEdge("gma", "ug"),
    childEdge("ug", "dad"), childEdge("ug", "unc"),
    partnerEdge("dad", "up"), partnerEdge("mom", "up"),
    partnerEdge("unc", "uu"), partnerEdge("aun", "uu"),
    childEdge("up", "me"), childEdge("up", "sib"),
    childEdge("uu", "cou"),
    partnerEdge("me", "um"), partnerEdge("ser", "um"),
  ];
  const pos = computeAutoLayout(nodes, edges);
  const meX = centerX(pos.get("me")!);
  const sibX = centerX(pos.get("sib")!);
  const couX = centerX(pos.get("cou")!);
  const lo = Math.min(meX, sibX);
  const hi = Math.max(meX, sibX);
  assert.ok(couX < lo || couX > hi, `cousin between siblings`);
  assertNoOverlaps(pos, nodes);
});

test("cousins not interleaved - scrambled node order", () => {
  const nodes: Node[] = [
    person("cou"), person("ser"), person("sib"),
    person("unc"), person("me"), person("aun"),
    person("mom"), person("dad"), person("gma"), person("gpa"),
    union("ug"), union("up"), union("uu"), union("um"),
  ];
  const edges: Edge[] = [
    partnerEdge("gpa", "ug"), partnerEdge("gma", "ug"),
    childEdge("ug", "dad"), childEdge("ug", "unc"),
    partnerEdge("dad", "up"), partnerEdge("mom", "up"),
    partnerEdge("unc", "uu"), partnerEdge("aun", "uu"),
    childEdge("up", "me"), childEdge("up", "sib"),
    childEdge("uu", "cou"),
    partnerEdge("me", "um"), partnerEdge("ser", "um"),
  ];
  const pos = computeAutoLayout(nodes, edges);
  const meX = centerX(pos.get("me")!);
  const sibX = centerX(pos.get("sib")!);
  const couX = centerX(pos.get("cou")!);
  const lo = Math.min(meX, sibX);
  const hi = Math.max(meX, sibX);
  assert.ok(couX < lo || couX > hi, `cousin between siblings [scrambled]`);
  assertNoOverlaps(pos, nodes);
});

test("cross-tree couple: cousin not between their children", () => {
  // Tree1: gp1+gm1 → alejandro, omar. Omar+wife → alexis (cousin)
  // Tree2: gp2+gm2 → liliana
  // Cross-tree: alejandro+liliana → francisco, luisiana
  // francisco+serena (partner)
  // Alexis must NOT be between francisco and luisiana
  const nodes: Node[] = [
    person("gp1"), person("gm1"), union("u_gp1"),
    person("gp2"), person("gm2"), union("u_gp2"),
    person("alejandro"), person("omar"),
    person("liliana"),
    person("omarwife"), union("u_omar"),
    union("u_couple"),
    person("francisco"), person("luisiana"),
    person("serena"), union("u_fran"),
    person("alexis"),
  ];
  const edges: Edge[] = [
    partnerEdge("gp1", "u_gp1"), partnerEdge("gm1", "u_gp1"),
    childEdge("u_gp1", "alejandro"), childEdge("u_gp1", "omar"),
    partnerEdge("gp2", "u_gp2"), partnerEdge("gm2", "u_gp2"),
    childEdge("u_gp2", "liliana"),
    partnerEdge("alejandro", "u_couple"), partnerEdge("liliana", "u_couple"),
    childEdge("u_couple", "francisco"), childEdge("u_couple", "luisiana"),
    partnerEdge("omar", "u_omar"), partnerEdge("omarwife", "u_omar"),
    childEdge("u_omar", "alexis"),
    partnerEdge("francisco", "u_fran"), partnerEdge("serena", "u_fran"),
  ];
  const pos = computeAutoLayout(nodes, edges);
  const franX = centerX(pos.get("francisco")!);
  const luiX = centerX(pos.get("luisiana")!);
  const alexX = centerX(pos.get("alexis")!);
  const serX = centerX(pos.get("serena")!);
  const franLuiMin = Math.min(franX, luiX);
  const franLuiMax = Math.max(franX, luiX);
  assert.ok(
    alexX < franLuiMin || alexX > franLuiMax,
    `alexis (x=${alexX}) between francisco (x=${franX}) and luisiana (x=${luiX})`,
  );
  const franSerMin = Math.min(franX, serX);
  const franSerMax = Math.max(franX, serX);
  assert.ok(
    alexX < franSerMin || alexX > franSerMax,
    `alexis (x=${alexX}) between francisco (x=${franX}) and serena (x=${serX})`,
  );
  assertNoOverlaps(pos, nodes);
});

test("cross-tree couple: cousin placement - scrambled DB order", () => {
  // Same structure, nodes in scrambled order as DB might return
  const nodes: Node[] = [
    person("alexis"), person("serena"), person("luisiana"),
    person("francisco"), person("omarwife"), person("liliana"),
    person("omar"), person("alejandro"),
    person("gm2"), person("gp2"), person("gm1"), person("gp1"),
    union("u_fran"), union("u_couple"), union("u_omar"),
    union("u_gp2"), union("u_gp1"),
  ];
  const edges: Edge[] = [
    partnerEdge("gp1", "u_gp1"), partnerEdge("gm1", "u_gp1"),
    childEdge("u_gp1", "alejandro"), childEdge("u_gp1", "omar"),
    partnerEdge("gp2", "u_gp2"), partnerEdge("gm2", "u_gp2"),
    childEdge("u_gp2", "liliana"),
    partnerEdge("alejandro", "u_couple"), partnerEdge("liliana", "u_couple"),
    childEdge("u_couple", "francisco"), childEdge("u_couple", "luisiana"),
    partnerEdge("omar", "u_omar"), partnerEdge("omarwife", "u_omar"),
    childEdge("u_omar", "alexis"),
    partnerEdge("francisco", "u_fran"), partnerEdge("serena", "u_fran"),
  ];
  const pos = computeAutoLayout(nodes, edges);
  const franX = centerX(pos.get("francisco")!);
  const luiX = centerX(pos.get("luisiana")!);
  const alexX = centerX(pos.get("alexis")!);
  const franLuiMin = Math.min(franX, luiX);
  const franLuiMax = Math.max(franX, luiX);
  assert.ok(
    alexX < franLuiMin || alexX > franLuiMax,
    `alexis (x=${alexX}) between francisco (x=${franX}) and luisiana (x=${luiX}) [scrambled]`,
  );
  assertNoOverlaps(pos, nodes);
});

test("deferred union children don't land among uncle's children", () => {
  // Tree1: carlos+elsa → alejandro, omar
  // omar+mirta → daniel, barbara, ulises, daniela, alexis (5 kids)
  // Tree2: ruben+maria → liliana
  // Deferred: alejandro+liliana → francisco, luisiana
  // francisco+serena
  // Francisco/Luisiana must not overlap or interleave with Omar's children
  const nodes: Node[] = [
    person("carlos"), person("elsa"), union("u_ce"),
    person("alejandro"), person("omar"),
    person("mirta"), union("u_om"),
    person("daniel"), person("barbara"), person("ulises"),
    person("daniela"), person("alexis"),
    person("ruben"), person("maria"), union("u_rm"),
    person("liliana"),
    union("u_al"),
    person("francisco"), person("luisiana"),
    person("serena"), union("u_fs"),
  ];
  const edges: Edge[] = [
    partnerEdge("carlos", "u_ce"), partnerEdge("elsa", "u_ce"),
    childEdge("u_ce", "alejandro"), childEdge("u_ce", "omar"),
    partnerEdge("omar", "u_om"), partnerEdge("mirta", "u_om"),
    childEdge("u_om", "daniel"), childEdge("u_om", "barbara"),
    childEdge("u_om", "ulises"), childEdge("u_om", "daniela"),
    childEdge("u_om", "alexis"),
    partnerEdge("ruben", "u_rm"), partnerEdge("maria", "u_rm"),
    childEdge("u_rm", "liliana"),
    partnerEdge("alejandro", "u_al"), partnerEdge("liliana", "u_al"),
    childEdge("u_al", "francisco"), childEdge("u_al", "luisiana"),
    partnerEdge("francisco", "u_fs"), partnerEdge("serena", "u_fs"),
  ];
  const pos = computeAutoLayout(nodes, edges);

  // Omar's children should form a contiguous block
  const omarKids = ["daniel", "barbara", "ulises", "daniela", "alexis"];
  const omarXs = omarKids.map(k => centerX(pos.get(k)!));
  const omarMin = Math.min(...omarXs);
  const omarMax = Math.max(...omarXs);

  // Francisco and Luisiana must not be inside Omar's children block
  const franX = centerX(pos.get("francisco")!);
  const luiX = centerX(pos.get("luisiana")!);
  const serX = centerX(pos.get("serena")!);
  assert.ok(
    franX < omarMin || franX > omarMax,
    `francisco (x=${franX}) inside omar's kids block [${omarMin}, ${omarMax}]`,
  );
  assert.ok(
    luiX < omarMin || luiX > omarMax,
    `luisiana (x=${luiX}) inside omar's kids block [${omarMin}, ${omarMax}]`,
  );
  assert.ok(
    serX < omarMin || serX > omarMax,
    `serena (x=${serX}) inside omar's kids block [${omarMin}, ${omarMax}]`,
  );

  assertNoOverlaps(pos, nodes);
});

test("deferred couple trees adjacent despite intervening unrelated tree", () => {
  // Tree 1 (personIndex 0-1): gp1+gp1w → child1
  // Unrelated tree (personIndex 2-4): alien_gp+alien_gpw → alien_kid
  // Tree 2 (personIndex 5-6): gp2+gp2w → child2
  // Without adjacency enforcement, sort by treeKey puts unrelated between.
  const nodes: Node[] = [
    person("gp1"), person("gp1w"), union("u_gp1"),
    person("alien_gp"), person("alien_gpw"), union("u_alien"),
    person("alien_kid"),
    person("gp2"), person("gp2w"), union("u_gp2"),
    person("child1"), person("child2"),
    union("u_couple"),
  ];
  const edges: Edge[] = [
    partnerEdge("gp1", "u_gp1"), partnerEdge("gp1w", "u_gp1"),
    childEdge("u_gp1", "child1"),
    partnerEdge("gp2", "u_gp2"), partnerEdge("gp2w", "u_gp2"),
    childEdge("u_gp2", "child2"),
    partnerEdge("child1", "u_couple"), partnerEdge("child2", "u_couple"),
    partnerEdge("alien_gp", "u_alien"), partnerEdge("alien_gpw", "u_alien"),
    childEdge("u_alien", "alien_kid"),
  ];
  const pos = computeAutoLayout(nodes, edges);
  const c1 = centerX(pos.get("child1")!);
  const c2 = centerX(pos.get("child2")!);
  const alien = centerX(pos.get("alien_kid")!);
  const coupleMin = Math.min(c1, c2);
  const coupleMax = Math.max(c1, c2);
  assert.ok(
    alien < coupleMin || alien > coupleMax,
    `unrelated (x=${alien}) between couple (${coupleMin}..${coupleMax})`,
  );
  // Partners must be close together
  const gap = Math.abs(c1 - c2);
  assert.ok(
    gap < PERSON_W * 3,
    `partners too far apart: gap=${gap}, expected < ${PERSON_W * 3}`,
  );
  assertNoOverlaps(pos, nodes);
});

test("deep tree: 4 generations with branching, no overlaps", () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push(person("ggpa"), person("ggma"), union("u_gg"));
  edges.push(partnerEdge("ggpa", "u_gg"), partnerEdge("ggma", "u_gg"));

  for (let a = 0; a < 3; a++) {
    const gp = `gp_${a}`;
    const gs = `gs_${a}`;
    const gu = `u_g_${a}`;
    nodes.push(person(gp), person(gs), union(gu));
    edges.push(childEdge("u_gg", gp), partnerEdge(gp, gu), partnerEdge(gs, gu));

    for (let b = 0; b < 4; b++) {
      const p = `p_${a}_${b}`;
      const s = `s_${a}_${b}`;
      const pu = `u_p_${a}_${b}`;
      nodes.push(person(p), person(s), union(pu));
      edges.push(childEdge(gu, p), partnerEdge(p, pu), partnerEdge(s, pu));

      for (let c = 0; c < 2; c++) {
        const kid = `kid_${a}_${b}_${c}`;
        nodes.push(person(kid));
        edges.push(childEdge(pu, kid));
      }
    }
  }

  const pos = computeAutoLayout(nodes, edges);
  assertNoOverlaps(pos, nodes);
});
