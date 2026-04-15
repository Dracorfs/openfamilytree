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
    id: "dad",
    type: "person",
    position: { x: 275, y: 200 },
    data: { name: "Dad", gender: "m" },
  },
  {
    id: "mom",
    type: "person",
    position: { x: 525, y: 200 },
    data: { name: "Mom", gender: "f" },
  },
  {
    id: "union-1",
    type: "union",
    position: { x: 471, y: 220 },
    data: {},
  },
  {
    id: "me",
    type: "person",
    position: { x: 400, y: 350 },
    data: { name: "Me", gender: "o" },
  },
];

const initialEdges = [
  {
    id: "e-dad-union",
    source: "dad",
    sourceHandle: "right",
    target: "union-1",
    targetHandle: "left",
    type: "straight",
    style: { strokeWidth: 2, stroke: "#8D8376" },
  },
  {
    id: "e-mom-union",
    source: "mom",
    sourceHandle: "left",
    target: "union-1",
    targetHandle: "right",
    type: "straight",
    style: { strokeWidth: 2, stroke: "#8D8376" },
  },
  {
    id: "e-union-me",
    source: "union-1",
    sourceHandle: "bottom",
    target: "me",
    targetHandle: "top",
    type: "straight",
    style: { strokeWidth: 2, stroke: "#8D8376" },
  },
];

const edgeDefaults = {
  type: "straight" as const,
  style: { strokeWidth: 2, stroke: "#8D8376" },
};

const partnerEdgeDefaults = {
  type: "straight" as const,
  style: { strokeWidth: 2, stroke: "#8D8376" },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let idCounter = 100;
const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

/* ------------------------------------------------------------------ */
/*  Node components                                                    */
/* ------------------------------------------------------------------ */

function PersonNode({ data, selected }: any) {
  const borderColor =
    data.gender === "f"
      ? "border-pink-300"
      : data.gender === "m"
        ? "border-blue-300"
        : "border-slate-300";

  return (
    <div
      className={`relative px-4 py-2 shadow-md rounded-md bg-white dark:bg-gray-800 border-2 ${borderColor} min-w-[120px] text-center cursor-pointer hover:shadow-lg transition-shadow ${
        selected ? "ring-2 ring-brand-link dark:ring-blue-400 ring-offset-1 dark:ring-offset-gray-900" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
      <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
      <Handle type="source" position={Position.Left} id="left" className="opacity-0" />
      <Handle type="target" position={Position.Left} id="target-left" className="opacity-0" />
      <Handle type="target" position={Position.Right} id="target-right" className="opacity-0" />

      <div className="font-bold text-slate-800 dark:text-gray-100">{data.name}</div>
      {data.birthYear && <div className="text-xs text-slate-500 dark:text-gray-400">{data.birthYear}</div>}
    </div>
  );
}

function UnionNode() {
  return (
    <div className="w-2 h-2 bg-slate-400 dark:bg-gray-500 rounded-full shadow-sm relative pointer-events-none cursor-default">
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="opacity-0 absolute -left-1 !pointer-events-none"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="opacity-0 absolute -right-1 !pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="opacity-0 absolute -bottom-1 !pointer-events-none"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="opacity-0 absolute -top-1 !pointer-events-none"
      />
    </div>
  );
}

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

  const dispatchNodeSelected = useCallback((node: Node | null) => {
    document.dispatchEvent(
      new CustomEvent("node-selected", {
        detail: node ? { ...node.data, id: node.id } : null,
      }),
    );
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type !== "person") return;
      selectedNodeIdRef.current = node.id;
      dispatchNodeSelected(node);
    },
    [dispatchNodeSelected],
  );

  const onPaneClick = useCallback(() => {
    selectedNodeIdRef.current = null;
    dispatchNodeSelected(null);
  }, [dispatchNodeSelected]);

  // Auto-select first node on mount
  useEffect(() => {
    const firstPerson = initialNodes.find((n) => n.type === "person");
    if (firstPerson) {
      selectedNodeIdRef.current = firstPerson.id;
      setTimeout(() => dispatchNodeSelected(firstPerson), 200);
    }
  }, [dispatchNodeSelected]);

  // Broadcast person list whenever nodes change
  useEffect(() => {
    const persons = nodes
      .filter((n) => n.type === "person")
      .map((n) => ({ id: n.id, ...(n.data as PersonData) }));
    document.dispatchEvent(
      new CustomEvent("nodes-updated", { detail: persons }),
    );
  }, [nodes]);

  // Listen: select-person-by-id (sidebar list click)
  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent).detail as { id: string };
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === id })));
      selectedNodeIdRef.current = id;
      dispatchNodeSelected(node);
    };
    document.addEventListener("select-person-by-id", handler);
    return () => document.removeEventListener("select-person-by-id", handler);
  }, [nodes, setNodes, dispatchNodeSelected]);

  // Listen: update-node (sidebar edits)
  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId, data } = (e as CustomEvent).detail;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          return { ...n, data: { ...n.data, ...data } };
        }),
      );
    };
    document.addEventListener("update-node", handler);
    return () => document.removeEventListener("update-node", handler);
  }, [setNodes]);

  // Listen: add-person (sidebar buttons)
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
          newPerson.position = { x: target.position.x + 300, y: target.position.y };
          const unionId = nextId("union");
          const unionNode: Node = {
            id: unionId,
            type: "union",
            position: { x: target.position.x + 206, y: target.position.y + 20 },
            data: {},
          };
          newNodes = [...newNodes, newPerson, unionNode];
          newEdges.push(
            {
              id: nextId("e"),
              source: targetNodeId,
              sourceHandle: "right",
              target: unionId,
              targetHandle: "left",
              ...partnerEdgeDefaults,
            },
            {
              id: nextId("e"),
              source: newPersonId,
              sourceHandle: "left",
              target: unionId,
              targetHandle: "right",
              ...partnerEdgeDefaults,
            },
          );
        } else if (relation === "child") {
          newPerson.position = { x: target.position.x, y: target.position.y + 150 };
          setEdges((prevEdges) => {
            const unionEdge = prevEdges.find(
              (edge) =>
                edge.source === targetNodeId &&
                prevNodes.find((n) => n.id === edge.target && n.type === "union"),
            );
            if (unionEdge) {
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
                {
                  id: nextId("e"),
                  source: targetNodeId,
                  sourceHandle: "right",
                  target: unionId,
                  targetHandle: "left",
                  ...edgeDefaults,
                },
                {
                  id: nextId("e"),
                  source: unionId,
                  sourceHandle: "bottom",
                  target: newPersonId,
                  targetHandle: "top",
                  ...edgeDefaults,
                },
                ...newEdges,
              ];
            }
          });
          newNodes = [...newNodes, newPerson];
        } else if (relation === "parent") {
          const dadId = newPersonId;
          const momId = nextId("person");
          const unionId = nextId("union");

          const childCenterX = target.position.x + 75;
          const gap = 100;
          const personW = 150;
          const unionW = 8;

          newPerson.position = { x: childCenterX - gap / 2 - personW, y: target.position.y - 150 };
          newPerson.data = { name: "Dad", gender: "m" } as PersonData;

          const momNode: Node = {
            id: momId,
            type: "person",
            position: { x: childCenterX + gap / 2, y: target.position.y - 150 },
            data: { name: "Mom", gender: "f" } as PersonData,
          };

          const unionNode: Node = {
            id: unionId,
            type: "union",
            position: { x: childCenterX - unionW / 2, y: target.position.y - 130 },
            data: {},
          };

          newNodes = [...newNodes, newPerson, momNode, unionNode];
          newEdges.push(
            {
              id: nextId("e"),
              source: dadId,
              sourceHandle: "right",
              target: unionId,
              targetHandle: "left",
              ...partnerEdgeDefaults,
            },
            {
              id: nextId("e"),
              source: momId,
              sourceHandle: "left",
              target: unionId,
              targetHandle: "right",
              ...partnerEdgeDefaults,
            },
            {
              id: nextId("e"),
              source: unionId,
              sourceHandle: "bottom",
              target: targetNodeId,
              targetHandle: "top",
              ...edgeDefaults,
            },
          );
        }

        if (relation !== "child") {
          setEdges((prev) => [...prev, ...newEdges]);
        }

        selectedNodeIdRef.current = newPersonId;
        setTimeout(() => {
          document.dispatchEvent(
            new CustomEvent("node-selected", {
              detail: { ...newPerson.data, id: newPerson.id },
            }),
          );
        }, 50);

        return newNodes;
      });
    };

    document.addEventListener("add-person", handler);
    return () => document.removeEventListener("add-person", handler);
  }, [setNodes, setEdges, dispatchNodeSelected]);

  // Listen: save-family-tree
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
    <div className="w-full h-full bg-[#FEFDFC] dark:bg-gray-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
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
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
