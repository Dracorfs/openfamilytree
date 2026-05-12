import type { Node } from "@xyflow/react";

export type NavDirection = "next" | "prev";

export function getOrderedPersonIds(nodes: Node[]): string[] {
  return nodes
    .filter((n) => n.type === "person")
    .slice()
    .sort((a, b) => {
      const ay = a.position?.y ?? 0;
      const by = b.position?.y ?? 0;
      if (ay !== by) return ay - by;
      const ax = a.position?.x ?? 0;
      const bx = b.position?.x ?? 0;
      if (ax !== bx) return ax - bx;
      return a.id.localeCompare(b.id);
    })
    .map((n) => n.id);
}

export function nextPersonId(
  currentId: string | null,
  nodes: Node[],
  dir: NavDirection,
): string | null {
  const order = getOrderedPersonIds(nodes);
  if (order.length === 0) return null;
  if (!currentId) return dir === "next" ? order[0] : order[order.length - 1];
  const idx = order.indexOf(currentId);
  if (idx === -1) return dir === "next" ? order[0] : order[order.length - 1];
  const step = dir === "next" ? 1 : -1;
  const len = order.length;
  return order[(idx + step + len) % len];
}
