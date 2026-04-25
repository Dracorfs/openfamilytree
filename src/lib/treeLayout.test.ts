import test from "node:test";
import assert from "node:assert/strict";
import type { Node, Edge } from "@xyflow/react";
import { computeAutoLayout, PERSON_W } from "./treeLayout";

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
