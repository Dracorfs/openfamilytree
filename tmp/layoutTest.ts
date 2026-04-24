import { applyAutoLayout, PERSON_W, PERSON_H, UNION_W } from "../src/lib/treeLayout";

type N = { id: string; type: "person" | "union"; position: { x: number; y: number }; data: any };
type E = { id: string; source: string; target: string };

const mkPerson = (id: string, name: string): N => ({
  id,
  type: "person",
  position: { x: 0, y: 0 },
  data: { name },
});
const mkUnion = (id: string): N => ({ id, type: "union", position: { x: 0, y: 0 }, data: {} });
const edge = (id: string, s: string, t: string): E => ({ id, source: s, target: t });

function dump(label: string, nodes: N[], edges: E[]) {
  const laid = applyAutoLayout(nodes as any, edges as any);
  console.log(`\n=== ${label} ===`);
  const sorted = [...laid.nodes].sort((a, b) => {
    if (Math.abs(a.position.y - b.position.y) > 4) return a.position.y - b.position.y;
    return a.position.x - b.position.x;
  });
  for (const n of sorted) {
    const w = n.type === "union" ? UNION_W : PERSON_W;
    const h = n.type === "union" ? 8 : PERSON_H;
    const name = n.type === "person" ? (n.data as any).name : "◯";
    console.log(
      `  ${n.id.padEnd(15)} (${n.type.padEnd(6)}) x=${String(Math.round(n.position.x)).padStart(4)} y=${String(Math.round(n.position.y)).padStart(4)}  w=${w} h=${h}  ${name}`,
    );
  }
  for (const e of laid.edges) {
    console.log(`  edge ${e.id}: ${e.source}(${(e as any).sourceHandle}) → ${e.target}(${(e as any).targetHandle})`);
  }
  return laid;
}

function checkNoOverlap(label: string, laid: any) {
  const boxes = laid.nodes.map((n: any) => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
    w: n.type === "union" ? UNION_W : PERSON_W,
    h: n.type === "union" ? 8 : PERSON_H,
  }));
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.x + a.w > b.x && b.x + b.w > a.x && a.y + a.h > b.y && b.y + b.h > a.y) {
        console.log(`  ⚠ OVERLAP ${label}: ${a.id} & ${b.id}`);
      }
    }
  }
}

// Scenario 1: Initial family (Dad+Mom+Me)
{
  const nodes = [mkPerson("dad", "Dad"), mkPerson("mom", "Mom"), mkUnion("u1"), mkPerson("me", "Me")];
  const edges = [edge("e1", "dad", "u1"), edge("e2", "mom", "u1"), edge("e3", "u1", "me")];
  const laid = dump("1. Dad+Mom+Me", nodes, edges);
  checkNoOverlap("1", laid);
}

// Scenario 2: Add a sibling (two kids under Dad+Mom)
{
  const nodes = [
    mkPerson("dad", "Dad"),
    mkPerson("mom", "Mom"),
    mkUnion("u1"),
    mkPerson("me", "Me"),
    mkPerson("sib", "Sib"),
  ];
  const edges = [
    edge("e1", "dad", "u1"),
    edge("e2", "mom", "u1"),
    edge("e3", "u1", "me"),
    edge("e4", "u1", "sib"),
  ];
  const laid = dump("2. Dad+Mom+Me+Sibling", nodes, edges);
  checkNoOverlap("2", laid);
}

// Scenario 3: Add grandparents above Dad
{
  const nodes = [
    mkPerson("gp", "Grandpa"),
    mkPerson("gm", "Grandma"),
    mkUnion("u0"),
    mkPerson("dad", "Dad"),
    mkPerson("mom", "Mom"),
    mkUnion("u1"),
    mkPerson("me", "Me"),
  ];
  const edges = [
    edge("e0a", "gp", "u0"),
    edge("e0b", "gm", "u0"),
    edge("e0c", "u0", "dad"),
    edge("e1", "dad", "u1"),
    edge("e2", "mom", "u1"),
    edge("e3", "u1", "me"),
  ];
  const laid = dump("3. Grandparents+Dad+Mom+Me", nodes, edges);
  checkNoOverlap("3", laid);
}

// Scenario 4: Full target-image shape (approximation):
//  Gen0: GP+GM
//  Gen1: Uncle+Aunt (with partner), Auntie2, Parent (with partner Spouse)
//  Gen2: 2 kids of Uncle side, 3 kids of Parent side
//  Gen3: 2 grandkids on left, 2 grandkids on right
{
  const nodes = [
    mkPerson("gp", "GP"),
    mkPerson("gm", "GM"),
    mkUnion("u0"),
    // gen1 children of u0: uncle, auntie2 (middle, single), parent
    mkPerson("uncle", "Uncle"),
    mkPerson("uw", "UW"),
    mkUnion("u-uncle"),
    mkPerson("auntie2", "Auntie2"),
    mkPerson("parent", "Parent"),
    mkPerson("spouse", "Spouse"),
    mkUnion("u-parent"),
    // uncle's kids
    mkPerson("c1", "C1"),
    mkPerson("c1sp", "C1sp"),
    mkUnion("u-c1"),
    mkPerson("c2", "C2"),
    // parent's kids
    mkPerson("k1", "K1"),
    mkPerson("k2", "K2"),
    mkPerson("k2sp", "K2sp"),
    mkUnion("u-k2"),
    mkPerson("k3", "K3"),
    // c1's grandkids
    mkPerson("gk1", "Gk1"),
    mkPerson("gk2", "Gk2"),
    // k2's grandkids
    mkPerson("gk3", "Gk3"),
    mkPerson("gk4", "Gk4"),
  ];
  const edges = [
    edge("e1", "gp", "u0"),
    edge("e2", "gm", "u0"),
    edge("e3", "u0", "uncle"),
    edge("e4", "u0", "auntie2"),
    edge("e5", "u0", "parent"),
    edge("e6", "uncle", "u-uncle"),
    edge("e7", "uw", "u-uncle"),
    edge("e8", "u-uncle", "c1"),
    edge("e9", "u-uncle", "c2"),
    edge("e10", "parent", "u-parent"),
    edge("e11", "spouse", "u-parent"),
    edge("e12", "u-parent", "k1"),
    edge("e13", "u-parent", "k2"),
    edge("e14", "u-parent", "k3"),
    edge("e15", "c1", "u-c1"),
    edge("e16", "c1sp", "u-c1"),
    edge("e17", "u-c1", "gk1"),
    edge("e18", "u-c1", "gk2"),
    edge("e19", "k2", "u-k2"),
    edge("e20", "k2sp", "u-k2"),
    edge("e21", "u-k2", "gk3"),
    edge("e22", "u-k2", "gk4"),
  ];
  const laid = dump("4. Full target-image tree", nodes, edges);
  checkNoOverlap("4", laid);
}

// Scenario 5: Single parent with child (user adds child to a person with no partner)
{
  const nodes = [mkPerson("solo", "Solo"), mkUnion("u1"), mkPerson("kid", "Kid")];
  const edges = [edge("e1", "solo", "u1"), edge("e2", "u1", "kid")];
  const laid = dump("5. Single parent + child", nodes, edges);
  checkNoOverlap("5", laid);
}

// Scenario 6: Two disconnected people
{
  const nodes = [mkPerson("a", "A"), mkPerson("b", "B")];
  const edges: E[] = [];
  const laid = dump("6. Two disconnected", nodes, edges);
  checkNoOverlap("6", laid);
}

// Scenario 7: Widow with 2 kids (one parent gone, kids still linked)
{
  const nodes = [
    mkPerson("widow", "Widow"),
    mkUnion("u1"),
    mkPerson("k1", "K1"),
    mkPerson("k2", "K2"),
  ];
  const edges = [edge("e1", "widow", "u1"), edge("e2", "u1", "k1"), edge("e3", "u1", "k2")];
  const laid = dump("7. Widow + 2 kids", nodes, edges);
  checkNoOverlap("7", laid);
}

// Scenario 8: Person re-married — two partner unions, one with kids
{
  const nodes = [
    mkPerson("p", "P"),
    mkPerson("ex", "Ex"),
    mkUnion("u1"),
    mkPerson("new", "NewPartner"),
    mkUnion("u2"),
    mkPerson("k1", "K1"),
    mkPerson("k2", "K2"),
  ];
  const edges = [
    edge("e1", "p", "u1"),
    edge("e2", "ex", "u1"),
    edge("e3", "u1", "k1"),
    edge("e4", "p", "u2"),
    edge("e5", "new", "u2"),
    edge("e6", "u2", "k2"),
  ];
  const laid = dump("8. Remarriage: P + Ex (k1) + NewPartner (k2)", nodes, edges);
  checkNoOverlap("8", laid);
}

// Scenario 10: Both Dad and Mom have a set of parents (the buggy case)
{
  const nodes = [
    mkPerson("gpA", "GpA"),
    mkPerson("gmA", "GmA"),
    mkUnion("uA"),
    mkPerson("gpB", "GpB"),
    mkPerson("gmB", "GmB"),
    mkUnion("uB"),
    mkPerson("dad", "Dad"),
    mkPerson("mom", "Mom"),
    mkUnion("u1"),
    mkPerson("me", "Me"),
  ];
  const edges = [
    edge("eA1", "gpA", "uA"),
    edge("eA2", "gmA", "uA"),
    edge("eA3", "uA", "dad"),
    edge("eB1", "gpB", "uB"),
    edge("eB2", "gmB", "uB"),
    edge("eB3", "uB", "mom"),
    edge("e1", "dad", "u1"),
    edge("e2", "mom", "u1"),
    edge("e3", "u1", "me"),
  ];
  const laid = dump("10. Both Dad and Mom have parents", nodes, edges);
  checkNoOverlap("10", laid);

  const byId: Record<string, { x: number; y: number }> = {};
  for (const n of laid.nodes) byId[n.id] = n.position;
  const dadCenter = byId.dad.x + PERSON_W / 2;
  const momCenter = byId.mom.x + PERSON_W / 2;
  const uACenter = byId.uA.x + UNION_W / 2;
  const uBCenter = byId.uB.x + UNION_W / 2;
  const meCenter = byId.me.x + PERSON_W / 2;
  const u1Center = byId.u1.x + UNION_W / 2;
  const dadOffset = Math.abs(uACenter - dadCenter);
  const momOffset = Math.abs(uBCenter - momCenter);
  const meOffset = Math.abs(u1Center - meCenter);
  console.log(`  dad→uA offset: ${dadOffset}  mom→uB offset: ${momOffset}  me→u1 offset: ${meOffset}`);
  if (dadOffset > 2) console.log(`  ⚠ Dad not centered under GpA+GmA union (${dadOffset})`);
  if (momOffset > 2) console.log(`  ⚠ Mom not centered under GpB+GmB union (${momOffset})`);
  if (meOffset > 2) console.log(`  ⚠ Me not centered under Dad+Mom union (${meOffset})`);
  // symmetry: the two grandparent sets should be equidistant from Me
  const uA_to_me = Math.abs(uACenter - meCenter);
  const uB_to_me = Math.abs(uBCenter - meCenter);
  const asym = Math.abs(uA_to_me - uB_to_me);
  console.log(`  uA→me: ${uA_to_me}  uB→me: ${uB_to_me}  asymmetry: ${asym}`);
  if (asym > 4) console.log(`  ⚠ Asymmetric grandparent placement (diff ${asym})`);
}

// Scenario 11: Only Mom has parents (Dad floating, no grandparents on his side)
{
  const nodes = [
    mkPerson("gpB", "GpB"),
    mkPerson("gmB", "GmB"),
    mkUnion("uB"),
    mkPerson("dad", "Dad"),
    mkPerson("mom", "Mom"),
    mkUnion("u1"),
    mkPerson("me", "Me"),
  ];
  const edges = [
    edge("eB1", "gpB", "uB"),
    edge("eB2", "gmB", "uB"),
    edge("eB3", "uB", "mom"),
    edge("e1", "dad", "u1"),
    edge("e2", "mom", "u1"),
    edge("e3", "u1", "me"),
  ];
  const laid = dump("11. Only Mom has parents", nodes, edges);
  checkNoOverlap("11", laid);
}

// Scenario 12: Both Dad and Mom have parents AND a sibling for Me
{
  const nodes = [
    mkPerson("gpA", "GpA"),
    mkPerson("gmA", "GmA"),
    mkUnion("uA"),
    mkPerson("gpB", "GpB"),
    mkPerson("gmB", "GmB"),
    mkUnion("uB"),
    mkPerson("dad", "Dad"),
    mkPerson("mom", "Mom"),
    mkUnion("u1"),
    mkPerson("me", "Me"),
    mkPerson("sib", "Sib"),
  ];
  const edges = [
    edge("eA1", "gpA", "uA"),
    edge("eA2", "gmA", "uA"),
    edge("eA3", "uA", "dad"),
    edge("eB1", "gpB", "uB"),
    edge("eB2", "gmB", "uB"),
    edge("eB3", "uB", "mom"),
    edge("e1", "dad", "u1"),
    edge("e2", "mom", "u1"),
    edge("e3", "u1", "me"),
    edge("e4", "u1", "sib"),
  ];
  const laid = dump("12. Both have parents + sibling", nodes, edges);
  checkNoOverlap("12", laid);
  const byId: Record<string, { x: number; y: number }> = {};
  for (const n of laid.nodes) byId[n.id] = n.position;
  const u1Center = byId.u1.x + UNION_W / 2;
  const meCenter = byId.me.x + PERSON_W / 2;
  const sibCenter = byId.sib.x + PERSON_W / 2;
  const kidMid = (meCenter + sibCenter) / 2;
  if (Math.abs(kidMid - u1Center) > 2) console.log(`  ⚠ Kids not centered under u1 (mid=${kidMid}, u1=${u1Center})`);
}

// Scenario 13: Both have parents, Dad also has a sibling — asymmetric grandparent subtree widths
{
  const nodes = [
    mkPerson("gpA", "GpA"),
    mkPerson("gmA", "GmA"),
    mkUnion("uA"),
    mkPerson("dad", "Dad"),
    mkPerson("uncle", "Uncle"),
    mkPerson("gpB", "GpB"),
    mkPerson("gmB", "GmB"),
    mkUnion("uB"),
    mkPerson("mom", "Mom"),
    mkUnion("u1"),
    mkPerson("me", "Me"),
  ];
  const edges = [
    edge("eA1", "gpA", "uA"),
    edge("eA2", "gmA", "uA"),
    edge("eA3", "uA", "dad"),
    edge("eA4", "uA", "uncle"),
    edge("eB1", "gpB", "uB"),
    edge("eB2", "gmB", "uB"),
    edge("eB3", "uB", "mom"),
    edge("e1", "dad", "u1"),
    edge("e2", "mom", "u1"),
    edge("e3", "u1", "me"),
  ];
  const laid = dump("13. Asymmetric grandparent widths", nodes, edges);
  checkNoOverlap("13", laid);
}

// Scenario 9: Delete-simulated — middle child of GP removed (no longer in edges)
{
  const nodes = [
    mkPerson("gp", "GP"),
    mkPerson("gm", "GM"),
    mkUnion("u0"),
    mkPerson("c1", "C1"),
    mkPerson("c3", "C3"),
  ];
  const edges = [edge("e1", "gp", "u0"), edge("e2", "gm", "u0"), edge("e3", "u0", "c1"), edge("e4", "u0", "c3")];
  const laid = dump("9. After deletion of middle child", nodes, edges);
  checkNoOverlap("9", laid);
}
