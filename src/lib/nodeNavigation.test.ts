import { describe, it, expect } from "vitest";
import type { Node } from "@xyflow/react";
import { getOrderedPersonIds, nextPersonId } from "./nodeNavigation";

const person = (id: string, x: number, y: number): Node => ({
  id,
  type: "person",
  position: { x, y },
  data: { name: id },
});

const union = (id: string, x: number, y: number): Node => ({
  id,
  type: "union",
  position: { x, y },
  data: {},
});

describe("getOrderedPersonIds", () => {
  it("sorts by y then x, ignores unions", () => {
    const nodes: Node[] = [
      person("c", 200, 100),
      union("u1", 0, 50),
      person("a", 0, 0),
      person("b", 100, 0),
    ];
    expect(getOrderedPersonIds(nodes)).toEqual(["a", "b", "c"]);
  });

  it("returns empty for no persons", () => {
    expect(getOrderedPersonIds([union("u", 0, 0)])).toEqual([]);
  });
});

describe("nextPersonId", () => {
  const nodes: Node[] = [
    person("a", 0, 0),
    person("b", 100, 0),
    union("u", 50, 50),
    person("c", 0, 100),
  ];

  it("advances forward", () => {
    expect(nextPersonId("a", nodes, "next")).toBe("b");
    expect(nextPersonId("b", nodes, "next")).toBe("c");
  });

  it("wraps forward", () => {
    expect(nextPersonId("c", nodes, "next")).toBe("a");
  });

  it("advances backward", () => {
    expect(nextPersonId("b", nodes, "prev")).toBe("a");
    expect(nextPersonId("c", nodes, "prev")).toBe("b");
  });

  it("wraps backward", () => {
    expect(nextPersonId("a", nodes, "prev")).toBe("c");
  });

  it("null selection picks first on next", () => {
    expect(nextPersonId(null, nodes, "next")).toBe("a");
  });

  it("null selection picks last on prev", () => {
    expect(nextPersonId(null, nodes, "prev")).toBe("c");
  });

  it("unknown id falls back to first/last", () => {
    expect(nextPersonId("ghost", nodes, "next")).toBe("a");
    expect(nextPersonId("ghost", nodes, "prev")).toBe("c");
  });

  it("returns null when no persons", () => {
    expect(nextPersonId("a", [union("u", 0, 0)], "next")).toBeNull();
  });

  it("skips union nodes in cycle", () => {
    const result: string[] = [];
    let curr: string | null = "a";
    for (let i = 0; i < 6; i++) {
      curr = nextPersonId(curr, nodes, "next");
      result.push(curr!);
    }
    expect(result).toEqual(["b", "c", "a", "b", "c", "a"]);
  });
});
