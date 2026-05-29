import { describe, it, expect } from "vitest";
import { serializeForDb, deserializeFromDb } from "./treeSerialization";

const FAMILY = "fam_test";

describe("serializeForDb", () => {
  it("maps person nodes to Person rows with cuids", () => {
    const { persons, idMap } = serializeForDb(
      [
        {
          id: "person-100",
          type: "person",
          position: { x: 10, y: 20 },
          data: { name: "Ada", surname: "Lovelace", birthYear: "1815", gender: "f" },
        },
      ],
      [],
      FAMILY,
    );
    expect(persons).toHaveLength(1);
    expect(persons[0].familyId).toBe(FAMILY);
    expect(persons[0].name).toBe("Ada");
    expect(persons[0].surname).toBe("Lovelace");
    expect(persons[0].birthYear).toBe("1815");
    expect(persons[0].posX).toBe(10);
    expect(persons[0].posY).toBe(20);
    expect(idMap["person-100"]).toBe(persons[0].id);
    expect(persons[0].id).not.toBe("person-100");
  });

  it("maps union nodes to Union rows", () => {
    const { unions, idMap } = serializeForDb(
      [{ id: "union-101", type: "union", position: { x: 50, y: 60 }, data: {} }],
      [],
      FAMILY,
    );
    expect(unions).toHaveLength(1);
    expect(unions[0].posX).toBe(50);
    expect(idMap["union-101"]).toBe(unions[0].id);
  });

  it("maps partner edges to partner relationships with sorted ids (symmetry)", () => {
    const { relationships, idMap } = serializeForDb(
      [
        { id: "person-1", type: "person", position: { x: 0, y: 0 }, data: { name: "A" } },
        { id: "union-2", type: "union", position: { x: 0, y: 0 }, data: {} },
      ],
      [{ id: "e-1", source: "person-1", target: "union-2", type: "partner" }],
      FAMILY,
    );
    expect(relationships).toHaveLength(1);
    const r = relationships[0];
    expect(r.type).toBe("partner");
    const sorted = [idMap["person-1"], idMap["union-2"]].sort();
    expect(r.nodeAId).toBe(sorted[0]);
    expect(r.nodeBId).toBe(sorted[1]);
  });

  it("partner edge is canonical regardless of source/target direction", () => {
    const fwd = serializeForDb(
      [
        { id: "person-1", type: "person", position: { x: 0, y: 0 }, data: {} },
        { id: "union-2", type: "union", position: { x: 0, y: 0 }, data: {} },
      ],
      [{ id: "e", source: "person-1", target: "union-2", type: "partner" }],
      FAMILY,
    );
    const rev = serializeForDb(
      [
        { id: "person-1", type: "person", position: { x: 0, y: 0 }, data: {} },
        { id: "union-2", type: "union", position: { x: 0, y: 0 }, data: {} },
      ],
      [{ id: "e", source: "union-2", target: "person-1", type: "partner" }],
      FAMILY,
    );
    // Different cuids generated but ordering rule identical
    const fwdOrder = fwd.relationships[0].nodeAId < fwd.relationships[0].nodeBId;
    const revOrder = rev.relationships[0].nodeAId < rev.relationships[0].nodeBId;
    expect(fwdOrder).toBe(true);
    expect(revOrder).toBe(true);
  });

  it("maps smoothstep edges to parent-child relationships (union->person, directional)", () => {
    const { relationships, idMap } = serializeForDb(
      [
        { id: "union-1", type: "union", position: { x: 0, y: 0 }, data: {} },
        { id: "person-2", type: "person", position: { x: 0, y: 0 }, data: { name: "Kid" } },
      ],
      [{ id: "e-1", source: "union-1", target: "person-2", type: "smoothstep" }],
      FAMILY,
    );
    expect(relationships[0].type).toBe("parent-child");
    expect(relationships[0].nodeAType).toBe("union");
    expect(relationships[0].nodeAId).toBe(idMap["union-1"]);
    expect(relationships[0].nodeBType).toBe("person");
    expect(relationships[0].nodeBId).toBe(idMap["person-2"]);
  });

  it("preserves already-cuid ids on re-save", () => {
    const cuid = "clh7z9k8x0000qz7z0q1q1q1q";
    const { persons, idMap } = serializeForDb(
      [{ id: cuid, type: "person", position: { x: 0, y: 0 }, data: { name: "X" } }],
      [],
      FAMILY,
    );
    expect(persons[0].id).toBe(cuid);
    expect(idMap[cuid]).toBe(cuid);
  });
});

describe("deserializeFromDb", () => {
  it("rebuilds person nodes with full data shape", () => {
    const { nodes } = deserializeFromDb(
      [
        {
          id: "p1",
          familyId: FAMILY,
          name: "Ada",
          surname: "L",
          birthSurname: null,
          gender: "f",
          otherGender: null,
          birthYear: "1815",
          birthPlace: null,
          deathDate: null,
          email: null,
          biography: null,
          avatarUrl: null,
          colorLabel: null,
          posX: 10,
          posY: 20,
        },
      ],
      [],
      [],
    );
    expect(nodes[0]).toMatchObject({
      id: "p1",
      type: "person",
      position: { x: 10, y: 20 },
      data: { name: "Ada", surname: "L", birthYear: "1815", gender: "f" },
    });
  });

  it("round-trips a full family graph", () => {
    const original = {
      nodes: [
        { id: "person-1", type: "person" as const, position: { x: 0, y: 0 }, data: { name: "Mom" } },
        { id: "person-2", type: "person" as const, position: { x: 100, y: 0 }, data: { name: "Dad" } },
        { id: "union-3", type: "union" as const, position: { x: 50, y: 50 }, data: {} },
        { id: "person-4", type: "person" as const, position: { x: 50, y: 150 }, data: { name: "Kid" } },
      ],
      edges: [
        { id: "e-1", source: "person-1", target: "union-3", type: "partner" },
        { id: "e-2", source: "person-2", target: "union-3", type: "partner" },
        { id: "e-3", source: "union-3", target: "person-4", type: "smoothstep" },
      ],
    };
    const { persons, unions, relationships, idMap } = serializeForDb(
      original.nodes,
      original.edges,
      FAMILY,
    );
    const { nodes, edges } = deserializeFromDb(persons, unions, relationships);

    expect(nodes).toHaveLength(4);
    expect(edges).toHaveLength(3);
    for (const n of original.nodes) {
      const dbId = idMap[n.id];
      const out = nodes.find((x) => x.id === dbId);
      expect(out).toBeDefined();
      expect(out!.type).toBe(n.type);
      expect(out!.position).toEqual(n.position);
    }
    expect(edges.filter((e) => e.type === "partner")).toHaveLength(2);
    expect(edges.filter((e) => e.type === "smoothstep")).toHaveLength(1);
  });

  it("partner relationships connect the right node pairs after round-trip", () => {
    const { persons, unions, relationships, idMap } = serializeForDb(
      [
        { id: "person-A", type: "person", position: { x: 0, y: 0 }, data: { name: "A" } },
        { id: "person-B", type: "person", position: { x: 0, y: 0 }, data: { name: "B" } },
        { id: "union-U", type: "union", position: { x: 0, y: 0 }, data: {} },
      ],
      [
        { id: "e1", source: "person-A", target: "union-U", type: "partner" },
        { id: "e2", source: "person-B", target: "union-U", type: "partner" },
      ],
      FAMILY,
    );
    const { edges } = deserializeFromDb(persons, unions, relationships);
    const A = idMap["person-A"], B = idMap["person-B"], U = idMap["union-U"];

    const connectsA = edges.some(
      (e) => (e.source === A && e.target === U) || (e.source === U && e.target === A),
    );
    const connectsB = edges.some(
      (e) => (e.source === B && e.target === U) || (e.source === U && e.target === B),
    );
    expect(connectsA).toBe(true);
    expect(connectsB).toBe(true);
  });
});
