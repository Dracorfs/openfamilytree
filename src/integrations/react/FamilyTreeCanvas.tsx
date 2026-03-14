/** @jsxImportSource react */
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
import "@xyflow/react/dist/style.css";

// Initial dummy data to resemble familyecho
const initialNodes = [
  {
    id: "me",
    type: "person",
    position: { x: 250, y: 200 },
    data: { name: "Me", birthYear: "1990", gender: "m" },
  },
  {
    id: "partner",
    type: "person",
    position: { x: 500, y: 200 },
    data: { name: "Partner", birthYear: "1992", gender: "f" },
  },
  {
    id: "child",
    type: "person",
    position: { x: 375, y: 350 },
    data: { name: "Child", birthYear: "2020", gender: "o" },
  },
];

const initialEdges = [
  { id: "e-me-partner", source: "me", target: "partner", type: "straight", style: { strokeWidth: 2, stroke: "#8D8376" } },
  { id: "e-me-child", source: "me", target: "child", type: "step", style: { strokeWidth: 2, stroke: "#8D8376" } },
];

const PersonNode = ({ data }: any) => {
  // Family Echo inspired colors
  const borderColor =
    data.gender === "f"
      ? "border-pink-300"
      : data.gender === "m"
      ? "border-blue-300"
      : "border-slate-300";

  return (
    <div
      className={`relative px-4 py-2 shadow-md rounded-md bg-white border-2 ${borderColor} min-w-[120px] text-center cursor-pointer hover:shadow-lg transition-shadow`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="font-bold text-slate-800">{data.name}</div>
      {data.birthYear && (
        <div className="text-xs text-slate-500">{data.birthYear}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes = {
  person: PersonNode,
};

export function FamilyTreeCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes as any);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges as any);

  return (
    <div className="w-full h-full bg-[#FEFDFC]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
