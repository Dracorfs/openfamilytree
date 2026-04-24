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

function checkHandles(label: string, laid: any) {
  const typeById = new Map<string, string>(laid.nodes.map((n: any) => [n.id, n.type]));
  const posById = new Map<string, { x: number; y: number }>(
    laid.nodes.map((n: any) => [n.id, n.position]),
  );
  let bad = 0;
  for (const e of laid.edges) {
    const ss = (e as any).sourceHandle;
    const tt = (e as any).targetHandle;
    const sType = typeById.get(e.source);
    const tType = typeById.get(e.target);
    // partner edge: person → union — must be bottom→top, L-shape (custom
     // "partner" edge type), and union must be clearly below parent.
    if (sType === "person" && tType === "union") {
      if (ss !== "bottom" || tt !== "top") {
        console.log(`  ⚠ HANDLE ${label}: partner edge ${e.id} expected bottom→top, got ${ss}→${tt}`);
        bad++;
      }
      if ((e as any).type !== "partner") {
        console.log(`  ⚠ TYPE ${label}: partner edge ${e.id} expected type "partner", got ${(e as any).type}`);
        bad++;
      }
      const pp = posById.get(e.source)!;
      const up = posById.get(e.target)!;
      const drop = up.y - (pp.y + PERSON_H);
      if (drop <= 0) {
        console.log(`  ⚠ GEOM ${label}: edge ${e.id} union not below parent (drop ${drop}px)`);
        bad++;
      }
    }
    // child edge: union → person — must be bottom→top (line enters child from above)
    if (sType === "union" && tType === "person") {
      if (ss !== "bottom" || tt !== "top") {
        console.log(`  ⚠ HANDLE ${label}: child edge ${e.id} expected bottom→top, got ${ss}→${tt}`);
        bad++;
      }
    }
  }
  if (bad === 0) console.log(`  ✓ handles OK`);
}

// Scenario 1: Initial family (Dad+Mom+Me)
{
  const nodes = [mkPerson("dad", "Dad"), mkPerson("mom", "Mom"), mkUnion("u1"), mkPerson("me", "Me")];
  const edges = [edge("e1", "dad", "u1"), edge("e2", "mom", "u1"), edge("e3", "u1", "me")];
  const laid = dump("1. Dad+Mom+Me", nodes, edges);
  checkNoOverlap("1", laid);
  checkHandles("1", laid);
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
  checkHandles("2", laid);
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
  checkHandles("3", laid);
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
  checkHandles("4", laid);
}

// Scenario 5: Single parent with child (user adds child to a person with no partner)
{
  const nodes = [mkPerson("solo", "Solo"), mkUnion("u1"), mkPerson("kid", "Kid")];
  const edges = [edge("e1", "solo", "u1"), edge("e2", "u1", "kid")];
  const laid = dump("5. Single parent + child", nodes, edges);
  checkNoOverlap("5", laid);
  checkHandles("5", laid);
}

// Scenario 6: Two disconnected people
{
  const nodes = [mkPerson("a", "A"), mkPerson("b", "B")];
  const edges: E[] = [];
  const laid = dump("6. Two disconnected", nodes, edges);
  checkNoOverlap("6", laid);
  checkHandles("6", laid);
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
  checkHandles("7", laid);
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
  checkHandles("8", laid);
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
  checkHandles("10", laid);

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

// Scenario 10b: Both have parents, but Mom's grandparents were ADDED FIRST
// (so they come before Dad's in the nodes array). Dad must still stay on
// the LEFT because Dad was created before Mom in the original tree.
{
  const nodes = [
    mkPerson("dad", "Dad"),
    mkPerson("mom", "Mom"),
    mkUnion("u1"),
    mkPerson("me", "Me"),
    // Mom's parents added first
    mkPerson("gpB", "GpB"),
    mkPerson("gmB", "GmB"),
    mkUnion("uB"),
    // Dad's parents added after
    mkPerson("gpA", "GpA"),
    mkPerson("gmA", "GmA"),
    mkUnion("uA"),
  ];
  const edges = [
    edge("e1", "dad", "u1"),
    edge("e2", "mom", "u1"),
    edge("e3", "u1", "me"),
    edge("eB1", "gpB", "uB"),
    edge("eB2", "gmB", "uB"),
    edge("eB3", "uB", "mom"),
    edge("eA1", "gpA", "uA"),
    edge("eA2", "gmA", "uA"),
    edge("eA3", "uA", "dad"),
  ];
  const laid = dump("10b. Both have parents (Mom's added first)", nodes, edges);
  checkNoOverlap("10b", laid);
  checkHandles("10b", laid);
  const pos: Record<string, { x: number; y: number }> = {};
  for (const n of laid.nodes) pos[n.id] = n.position;
  if (pos.dad.x >= pos.mom.x) {
    console.log(`  ⚠ ORDER 10b: Dad (${pos.dad.x}) should be left of Mom (${pos.mom.x})`);
  } else {
    console.log(`  ✓ Dad stays left (Dad x=${pos.dad.x} < Mom x=${pos.mom.x})`);
  }
  if (pos.gpA.x >= pos.gpB.x) {
    console.log(`  ⚠ ORDER 10b: GpA (${pos.gpA.x}) should be left of GpB (${pos.gpB.x})`);
  } else {
    console.log(`  ✓ GpA tree stays left (GpA x=${pos.gpA.x} < GpB x=${pos.gpB.x})`);
  }
}

// Scenario 10c: Keep adding grandparents across generations. Dad must stay
// on the left at EVERY step. Simulates the actual UI flow where Dad/Mom are
// created first, then parents-of-Mom, then parents-of-Dad, then more layers.
{
  let pIdx = 0;
  const nextP = (id: string, name: string) => {
    pIdx++;
    return mkPerson(id, name);
  };
  const step = (label: string, nodes: N[], edges: E[]) => {
    const laid = dump(label, nodes, edges);
    checkNoOverlap(label, laid);
    checkHandles(label, laid);
    const pos: Record<string, { x: number; y: number }> = {};
    for (const n of laid.nodes) pos[n.id] = n.position;
    if (pos.dad && pos.mom && pos.dad.x >= pos.mom.x) {
      console.log(`  ⚠ ORDER ${label}: Dad (${pos.dad.x}) should stay left of Mom (${pos.mom.x})`);
    } else if (pos.dad && pos.mom) {
      console.log(`  ✓ Dad left of Mom (${pos.dad.x} < ${pos.mom.x})`);
    }
    return pos;
  };

  const nodes: N[] = [
    nextP("dad", "Dad"),
    nextP("mom", "Mom"),
    mkUnion("u1"),
    nextP("me", "Me"),
  ];
  const edges: E[] = [
    edge("e1", "dad", "u1"),
    edge("e2", "mom", "u1"),
    edge("e3", "u1", "me"),
  ];
  step("10c.0 initial", [...nodes], [...edges]);

  // add parents to Mom
  nodes.push(nextP("gpB", "GpB"), nextP("gmB", "GmB"), mkUnion("uB"));
  edges.push(edge("eB1", "gpB", "uB"), edge("eB2", "gmB", "uB"), edge("eB3", "uB", "mom"));
  step("10c.1 +Mom's parents", [...nodes], [...edges]);

  // add parents to Dad
  nodes.push(nextP("gpA", "GpA"), nextP("gmA", "GmA"), mkUnion("uA"));
  edges.push(edge("eA1", "gpA", "uA"), edge("eA2", "gmA", "uA"), edge("eA3", "uA", "dad"));
  step("10c.2 +Dad's parents", [...nodes], [...edges]);

  // add parents to GpB (great-grandparents on Mom's side)
  nodes.push(nextP("ggpB", "GgpB"), nextP("ggmB", "GgmB"), mkUnion("uGgb"));
  edges.push(edge("eGgb1", "ggpB", "uGgb"), edge("eGgb2", "ggmB", "uGgb"), edge("eGgb3", "uGgb", "gpB"));
  step("10c.3 +GpB's parents", [...nodes], [...edges]);

  // add parents to GpA (great-grandparents on Dad's side)
  nodes.push(nextP("ggpA", "GgpA"), nextP("ggmA", "GgmA"), mkUnion("uGga"));
  edges.push(edge("eGga1", "ggpA", "uGga"), edge("eGga2", "ggmA", "uGga"), edge("eGga3", "uGga", "gpA"));
  step("10c.4 +GpA's parents", [...nodes], [...edges]);
}

// Scenario 10d: Dad has parents AND grandparents on both sides of his parents;
// Mom has only parents (one generation up). Dad's chain is deeper. Both
// partners must still end up on the same row. Was dropping Mom below.
{
  const nodes = [
    mkPerson("dad", "Dad"),
    mkPerson("mom", "Mom"),
    mkUnion("u1"),
    mkPerson("me", "Me"),
    mkPerson("gpA", "GpA"),
    mkPerson("gmA", "GmA"),
    mkUnion("uA"),
    mkPerson("gpB", "GpB"),
    mkPerson("gmB", "GmB"),
    mkUnion("uB"),
    // gpA's parents
    mkPerson("ggpAa", "GgpAa"),
    mkPerson("ggmAa", "GgmAa"),
    mkUnion("uGga"),
    // gmA's parents
    mkPerson("ggpAb", "GgpAb"),
    mkPerson("ggmAb", "GgmAb"),
    mkUnion("uGgb"),
  ];
  const edges = [
    edge("e1", "dad", "u1"),
    edge("e2", "mom", "u1"),
    edge("e3", "u1", "me"),
    edge("eA1", "gpA", "uA"),
    edge("eA2", "gmA", "uA"),
    edge("eA3", "uA", "dad"),
    edge("eB1", "gpB", "uB"),
    edge("eB2", "gmB", "uB"),
    edge("eB3", "uB", "mom"),
    edge("eGa1", "ggpAa", "uGga"),
    edge("eGa2", "ggmAa", "uGga"),
    edge("eGa3", "uGga", "gpA"),
    edge("eGb1", "ggpAb", "uGgb"),
    edge("eGb2", "ggmAb", "uGgb"),
    edge("eGb3", "uGgb", "gmA"),
  ];
  const laid = dump("10d. Dad has grandparents (both sides), Mom has parents only", nodes, edges);
  checkNoOverlap("10d", laid);
  checkHandles("10d", laid);
  const pos: Record<string, { x: number; y: number }> = {};
  for (const n of laid.nodes) pos[n.id] = n.position;
  if (pos.dad.y !== pos.mom.y) {
    console.log(`  ⚠ GEN 10d: Dad y=${pos.dad.y} must equal Mom y=${pos.mom.y}`);
  } else {
    console.log(`  ✓ Dad and Mom on same row (y=${pos.dad.y})`);
  }
  if (pos.dad.x >= pos.mom.x) {
    console.log(`  ⚠ ORDER 10d: Dad (${pos.dad.x}) should stay left of Mom (${pos.mom.x})`);
  } else {
    console.log(`  ✓ Dad left of Mom (${pos.dad.x} < ${pos.mom.x})`);
  }
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
  checkHandles("11", laid);
  // Dad declared BEFORE Mom in the nodes array → Dad must stay on the LEFT.
  const pos: Record<string, { x: number; y: number }> = {};
  for (const n of laid.nodes) pos[n.id] = n.position;
  if (pos.dad.x >= pos.mom.x) {
    console.log(`  ⚠ ORDER 11: Dad (${pos.dad.x}) should be left of Mom (${pos.mom.x})`);
  } else {
    console.log(`  ✓ original order preserved (Dad x=${pos.dad.x} < Mom x=${pos.mom.x})`);
  }
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
  checkHandles("12", laid);
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
  checkHandles("13", laid);
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
  checkHandles("9", laid);
}
