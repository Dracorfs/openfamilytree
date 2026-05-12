import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";
import { UndoHistory } from "./undoHistory";

const makeNodes = (names: string[]): Node[] =>
  names.map((name, i) => ({
    id: `p-${i}`,
    type: "person",
    position: { x: i * 100, y: 0 },
    data: { name },
  }));

const makeEdges = (pairs: [string, string][]): Edge[] =>
  pairs.map(([s, t], i) => ({
    id: `e-${i}`,
    source: s,
    target: t,
  }));

describe("UndoHistory", () => {
  it("push and pop restore previous state", () => {
    const history = new UndoHistory();
    const nodes1 = makeNodes(["Alice"]);
    const edges1 = makeEdges([]);

    history.push(nodes1, edges1);

    const nodes2 = makeNodes(["Alice", "Bob"]);
    const edges2 = makeEdges([["p-0", "p-1"]]);
    history.push(nodes2, edges2);

    const restored = history.pop();
    expect(restored).toBeDefined();
    expect(restored!.nodes).toHaveLength(2);
    expect(restored!.nodes[1].data.name).toBe("Bob");

    const restored2 = history.pop();
    expect(restored2).toBeDefined();
    expect(restored2!.nodes).toHaveLength(1);
    expect(restored2!.nodes[0].data.name).toBe("Alice");
  });

  it("pop returns undefined when empty", () => {
    const history = new UndoHistory();
    expect(history.pop()).toBeUndefined();
  });

  it("respects max size limit", () => {
    const history = new UndoHistory(3);

    for (let i = 0; i < 5; i++) {
      history.push(makeNodes([`Person-${i}`]), makeEdges([]));
    }

    expect(history.length).toBe(3);

    // Oldest entries (0, 1) should be gone; first pop gives Person-4
    const last = history.pop();
    expect(last!.nodes[0].data.name).toBe("Person-4");

    const prev = history.pop();
    expect(prev!.nodes[0].data.name).toBe("Person-3");
  });

  it("creates deep copies of node data (mutations don't affect history)", () => {
    const history = new UndoHistory();
    const nodes = makeNodes(["Alice"]);
    history.push(nodes, []);

    // Mutate original after push
    nodes[0].data.name = "MUTATED";

    const restored = history.pop();
    expect(restored!.nodes[0].data.name).toBe("Alice");
  });

  it("clear empties stack", () => {
    const history = new UndoHistory();
    history.push(makeNodes(["A"]), []);
    history.push(makeNodes(["B"]), []);
    expect(history.length).toBe(2);

    history.clear();
    expect(history.length).toBe(0);
    expect(history.pop()).toBeUndefined();
  });

  it("handles undo after create → edit → delete sequence", () => {
    const history = new UndoHistory();

    // Initial state: one person
    const state0Nodes = makeNodes(["Alice"]);
    const state0Edges: Edge[] = [];

    // Action 1: Add Bob (push state before add)
    history.push(state0Nodes, state0Edges);
    const state1Nodes = makeNodes(["Alice", "Bob"]);
    const state1Edges = makeEdges([["p-0", "p-1"]]);

    // Action 2: Edit Alice → "Alicia" (push state before edit)
    history.push(state1Nodes, state1Edges);
    const state2Nodes = state1Nodes.map((n) =>
      n.id === "p-0" ? { ...n, data: { ...n.data, name: "Alicia" } } : n,
    );

    // Action 3: Delete Bob (push state before delete)
    history.push(state2Nodes, state1Edges);

    // Undo delete → get state with Alicia + Bob
    const afterUndoDelete = history.pop();
    expect(afterUndoDelete!.nodes).toHaveLength(2);
    expect(afterUndoDelete!.nodes[0].data.name).toBe("Alicia");
    expect(afterUndoDelete!.nodes[1].data.name).toBe("Bob");

    // Undo edit → get state with Alice + Bob
    const afterUndoEdit = history.pop();
    expect(afterUndoEdit!.nodes).toHaveLength(2);
    expect(afterUndoEdit!.nodes[0].data.name).toBe("Alice");

    // Undo add → get state with only Alice
    const afterUndoAdd = history.pop();
    expect(afterUndoAdd!.nodes).toHaveLength(1);
    expect(afterUndoAdd!.nodes[0].data.name).toBe("Alice");

    // No more history
    expect(history.pop()).toBeUndefined();
  });
});
