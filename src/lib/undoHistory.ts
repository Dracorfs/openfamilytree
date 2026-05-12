import type { Node, Edge } from "@xyflow/react";

export interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

export class UndoHistory {
  private stack: HistorySnapshot[] = [];
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  push(nodes: Node[], edges: Edge[]) {
    this.stack.push({
      nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
      edges: edges.map((e) => ({ ...e })),
    });
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
    }
  }

  pop(): HistorySnapshot | undefined {
    return this.stack.pop();
  }

  get length() {
    return this.stack.length;
  }

  clear() {
    this.stack = [];
  }
}
