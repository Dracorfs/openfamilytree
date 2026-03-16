/** @jsxImportSource react */
import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  BackgroundVariant,
} from "@xyflow/react";
import type { Node, NodeMouseHandler } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PersonData {
  name: string;
  birthYear?: string;
  gender?: string;
  surname?: string;
  birthSurname?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  email?: string;
  phone?: string;
  address?: string;
  biography?: string;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  Initial data                                                       */
/* ------------------------------------------------------------------ */

const initialNodes: Node[] = [
  {
    id: "me",
    type: "person",
    position: { x: 250, y: 200 },
    data: { name: "Me", birthYear: "1990", gender: "m" },
  },
  {
    id: "partner",
    type: "person",
    position: { x: 550, y: 200 },
    data: { name: "Partner", birthYear: "1992", gender: "f" },
  },
  {
    id: "union-1",
    type: "union",
    position: { x: 456, y: 220 },
    data: {},
  },
  {
    id: "child",
    type: "person",
    position: { x: 400, y: 350 },
    data: { name: "Child", birthYear: "2020", gender: "o" },
  },
];

const initialEdges = [
  {
    id: "e-me-union",
    source: "me",
    sourceHandle: "right",
    target: "union-1",
    targetHandle: "left",
    type: "smoothstep",
    style: { strokeWidth: 2, stroke: "#8D8376" },
  },
  {
    id: "e-partner-union",
    source: "partner",
    sourceHandle: "left",
    target: "union-1",
    targetHandle: "right",
    type: "smoothstep",
    style: { strokeWidth: 2, stroke: "#8D8376" },
  },
  {
    id: "e-union-child",
    source: "union-1",
    sourceHandle: "bottom",
    target: "child",
    targetHandle: "top",
    type: "smoothstep",
    style: { strokeWidth: 2, stroke: "#8D8376" },
  },
];

const edgeDefaults = { type: "smoothstep" as const, style: { strokeWidth: 2, stroke: "#8D8376" } };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let idCounter = 100;
const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

/* ------------------------------------------------------------------ */
/*  Node components                                                    */
/* ------------------------------------------------------------------ */

const PersonNode = ({ data, selected }: any) => {
  const borderColor =
    data.gender === "f"
      ? "border-pink-300"
      : data.gender === "m"
      ? "border-blue-300"
      : "border-slate-300";

  return (
    <div
      className={`relative px-4 py-2 shadow-md rounded-md bg-white border-2 ${borderColor} min-w-[120px] text-center cursor-pointer hover:shadow-lg transition-shadow ${
        selected ? "ring-2 ring-brand-link ring-offset-1" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
      <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
      <Handle type="source" position={Position.Left} id="left" className="opacity-0" />
      <Handle type="target" position={Position.Left} id="target-left" className="opacity-0" />
      <Handle type="target" position={Position.Right} id="target-right" className="opacity-0" />

      <div className="font-bold text-slate-800">{data.name}</div>
      {data.birthYear && <div className="text-xs text-slate-500">{data.birthYear}</div>}
    </div>
  );
};

const UnionNode = () => {
  return (
    <div className="w-2 h-2 bg-slate-400 rounded-full shadow-sm relative">
      <Handle type="target" position={Position.Left} id="left" className="opacity-0 absolute -left-1" />
      <Handle type="target" position={Position.Right} id="right" className="opacity-0 absolute -right-1" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 absolute -bottom-1" />
      <Handle type="target" position={Position.Top} id="top" className="opacity-0 absolute -top-1" />
    </div>
  );
};

const nodeTypes = {
  person: PersonNode,
  union: UnionNode,
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function FamilyTreeCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as any);
  const selectedNodeIdRef = useRef<string | null>(null);

  /* ---------- dispatch helper ---------- */
  const dispatchNodeSelected = useCallback((node: Node | null) => {
    document.dispatchEvent(
      new CustomEvent("node-selected", { detail: node ? { ...node.data, id: node.id } : null })
    );
  }, []);

  /* ---------- node click → tell sidebar ---------- */
  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type !== "person") return;
      selectedNodeIdRef.current = node.id;
      dispatchNodeSelected(node);
    },
    [dispatchNodeSelected]
  );

  /* ---------- click on pane (deselect) ---------- */
  const onPaneClick = useCallback(() => {
    selectedNodeIdRef.current = null;
    dispatchNodeSelected(null);
  }, [dispatchNodeSelected]);

  /* ---------- auto-select first node on mount ---------- */
  useEffect(() => {
    const firstPerson = initialNodes.find((n) => n.type === "person");
    if (firstPerson) {
      selectedNodeIdRef.current = firstPerson.id;
      // Small delay so Qwik sidebar is hydrated
      setTimeout(() => dispatchNodeSelected(firstPerson), 200);
    }
  }, [dispatchNodeSelected]);

  /* ---------- listen: update-node (sidebar edits) ---------- */
  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId, data } = (e as CustomEvent).detail;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          return { ...n, data: { ...n.data, ...data } };
        })
      );
    };
    document.addEventListener("update-node", handler);
    return () => document.removeEventListener("update-node", handler);
  }, [setNodes]);

  /* ---------- listen: add-person (sidebar buttons) ---------- */
  useEffect(() => {
    const handler = (e: Event) => {
      const { relation, targetNodeId } = (e as CustomEvent).detail as {
        relation: "partner" | "parent" | "child";
        targetNodeId: string;
      };

      setNodes((prevNodes) => {
        const target = prevNodes.find((n) => n.id === targetNodeId);
        if (!target) return prevNodes;

        const newPersonId = nextId("person");
        const newPerson: Node = {
          id: newPersonId,
          type: "person",
          position: { x: 0, y: 0 },
          data: { name: "New Person", gender: "o" } as PersonData,
        };

        let newNodes = [...prevNodes];
        const newEdges: typeof initialEdges = [];

        if (relation === "partner") {
          // Place to the right
          newPerson.position = { x: target.position.x + 300, y: target.position.y };

          // Create union node between them
          const unionId = nextId("union");
          const unionNode: Node = {
            id: unionId,
            type: "union",
            position: { x: target.position.x + 206, y: target.position.y + 20 },
            data: {},
          };
          newNodes = [...newNodes, newPerson, unionNode];

          newEdges.push(
            { id: nextId("e"), source: targetNodeId, sourceHandle: "right", target: unionId, targetHandle: "left", ...edgeDefaults },
            { id: nextId("e"), source: newPersonId, sourceHandle: "left", target: unionId, targetHandle: "right", ...edgeDefaults }
          );
        } else if (relation === "child") {
          // Find the union connected to this person (as source → union target)
          // or create one if there's no partner
          newPerson.position = { x: target.position.x, y: target.position.y + 150 };

          // Look for an existing union node connected to the target
          setEdges((prevEdges) => {
            const unionEdge = prevEdges.find(
              (edge) => edge.source === targetNodeId && prevNodes.find((n) => n.id === edge.target && n.type === "union")
            );

            if (unionEdge) {
              // Connect child to existing union
              const childEdge = {
                id: nextId("e"),
                source: unionEdge.target,
                sourceHandle: "bottom",
                target: newPersonId,
                targetHandle: "top",
                ...edgeDefaults,
              };
              return [...prevEdges, childEdge, ...newEdges];
            } else {
              // No union — create a solo union above the child
              const unionId = nextId("union");
              const unionNode: Node = {
                id: unionId,
                type: "union",
                position: { x: target.position.x + 56, y: target.position.y + 20 },
                data: {},
              };
              newNodes.push(unionNode);

              return [
                ...prevEdges,
                { id: nextId("e"), source: targetNodeId, sourceHandle: "right", target: unionId, targetHandle: "left", ...edgeDefaults },
                { id: nextId("e"), source: unionId, sourceHandle: "bottom", target: newPersonId, targetHandle: "top", ...edgeDefaults },
                ...newEdges,
              ];
            }
          });

          newNodes = [...newNodes, newPerson];
        } else if (relation === "parent") {
          newPerson.position = { x: target.position.x, y: target.position.y - 150 };

          // Create union above and connect down to child
          const unionId = nextId("union");
          const unionNode: Node = {
            id: unionId,
            type: "union",
            position: { x: target.position.x + 56, y: target.position.y - 80 },
            data: {},
          };
          newNodes = [...newNodes, newPerson, unionNode];

          newEdges.push(
            { id: nextId("e"), source: newPersonId, sourceHandle: "right", target: unionId, targetHandle: "left", ...edgeDefaults },
            { id: nextId("e"), source: unionId, sourceHandle: "bottom", target: targetNodeId, targetHandle: "top", ...edgeDefaults }
          );
        }

        // Add edges for partner/parent cases (child case handled inside setEdges above)
        if (relation !== "child") {
          setEdges((prev) => [...prev, ...newEdges]);
        }

        // Auto-select the new person
        selectedNodeIdRef.current = newPersonId;
        setTimeout(() => {
          const createdNode = { ...newPerson };
          document.dispatchEvent(
            new CustomEvent("node-selected", {
              detail: { ...createdNode.data, id: createdNode.id },
            })
          );
        }, 50);

        return newNodes;
      });
    };

    document.addEventListener("add-person", handler);
    return () => document.removeEventListener("add-person", handler);
  }, [setNodes, setEdges, dispatchNodeSelected]);

  /* ---------- listen: save-family-tree ---------- */
  useEffect(() => {
    const handleSave = async () => {
      try {
        const response = await fetch("/api/tree", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        });
        const result = await response.json();
        if (result.success) {
          alert("Family tree saved successfully!");
        } else {
          alert("Failed to save family tree: " + result.error);
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred while saving.");
      }
    };

    document.addEventListener("save-family-tree", handleSave);
    return () => document.removeEventListener("save-family-tree", handleSave);
  }, [nodes, edges]);

  return (
    <div className="w-full h-full bg-[#FEFDFC]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        defaultEdgeOptions={{ zIndex: 0 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <MiniMap
          nodeColor={(n: any) => {
            if (n.data?.gender === "f") return "#F8D4D9";
            if (n.data?.gender === "m") return "#D2E3F5";
            return "#EDE6E2";
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
