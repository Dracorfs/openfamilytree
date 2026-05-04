import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  BaseEdge,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import type { Node, Edge, NodeMouseHandler, EdgeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "./ThemeProvider";
import { useTranslation } from "./LanguageProvider";
import { applyAutoLayout } from "../lib/treeLayout";

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
  biography?: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  Initial data                                                       */
/* ------------------------------------------------------------------ */

const partnerEdgeStyle = { strokeWidth: 2, stroke: "#8D8376" };
const childEdgeStyle = { strokeWidth: 2, stroke: "#8D8376" };

function buildInitialGraph(names: { dad: string; mom: string; me: string }) {
  const rawInitialNodes: Node[] = [
    { id: "dad", type: "person", position: { x: 0, y: 0 }, data: { name: names.dad, gender: "m" } },
    { id: "mom", type: "person", position: { x: 0, y: 0 }, data: { name: names.mom, gender: "f" } },
    { id: "union-1", type: "union", position: { x: 0, y: 0 }, data: {} },
    { id: "me", type: "person", position: { x: 0, y: 0 }, data: { name: names.me, gender: "o" } },
  ];
  const rawInitialEdges: Edge[] = [
    { id: "e-dad-union", source: "dad", target: "union-1", type: "partner", style: partnerEdgeStyle },
    { id: "e-mom-union", source: "mom", target: "union-1", type: "partner", style: partnerEdgeStyle },
    { id: "e-union-me", source: "union-1", target: "me", type: "smoothstep", style: childEdgeStyle },
  ];
  return applyAutoLayout(rawInitialNodes, rawInitialEdges);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let idCounter = 100;
const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

function makePartnerEdge(personId: string, unionId: string): Edge {
  return {
    id: nextId("e"),
    source: personId,
    target: unionId,
    type: "partner",
    style: partnerEdgeStyle,
  };
}

function makeChildEdge(unionId: string, personId: string): Edge {
  return {
    id: nextId("e"),
    source: unionId,
    target: personId,
    type: "smoothstep",
    style: childEdgeStyle,
  };
}

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

  const [imgBroken, setImgBroken] = useState(false);
  useEffect(() => {
    setImgBroken(false);
  }, [data.avatarUrl]);
  const showImg = !!data.avatarUrl && !imgBroken;

  return (
    <div
      className={`relative px-4 py-2 shadow-md rounded-md bg-white dark:bg-gray-800 border-2 ${borderColor} w-[152px] text-center cursor-pointer hover:shadow-lg transition-shadow ${
        selected ? "ring-2 ring-brand-link dark:ring-blue-400 ring-offset-1 dark:ring-offset-gray-900" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
      <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
      <Handle type="source" position={Position.Left} id="left" className="opacity-0" />
      <Handle type="target" position={Position.Left} id="target-left" className="opacity-0" />
      <Handle type="target" position={Position.Right} id="target-right" className="opacity-0" />

      <div className="flex justify-center mb-1">
        <div
          className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border ${
            data.gender === "f"
              ? "bg-pink-50 border-pink-300 text-pink-400"
              : data.gender === "m"
                ? "bg-blue-50 border-blue-300 text-blue-400"
                : "bg-slate-100 border-slate-300 text-slate-400"
          }`}
        >
          {showImg ? (
            <img
              src={data.avatarUrl}
              alt=""
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              onError={() => setImgBroken(true)}
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
      </div>
      <div className="font-bold text-slate-800 dark:text-gray-100 truncate">{data.name}</div>
      {data.birthYear && <div className="text-xs text-slate-500 dark:text-gray-400">{data.birthYear}</div>}
    </div>
  );
}

function UnionNode() {
  return (
    <div className="w-2 h-2 bg-slate-400 dark:bg-gray-500 rounded-full shadow-sm relative pointer-events-none cursor-default">
      <Handle type="target" position={Position.Left} id="left" className="opacity-0 absolute -left-1 !pointer-events-none" />
      <Handle type="target" position={Position.Right} id="right" className="opacity-0 absolute -right-1 !pointer-events-none" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 absolute -bottom-1 !pointer-events-none" />
      <Handle type="target" position={Position.Top} id="top" className="opacity-0 absolute -top-1 !pointer-events-none" />
    </div>
  );
}

// L-shaped partner edge: vertical drop from parent bottom to the dot's Y,
// then horizontal to the dot. Keeps the crossbar flush with the union dot
// (standard smoothstep puts the bar at the midpoint, leaving a visible drop).
function PartnerEdge({ sourceX, sourceY, targetX, targetY, style }: EdgeProps) {
  const path = `M ${sourceX},${sourceY} L ${sourceX},${targetY} L ${targetX},${targetY}`;
  return <BaseEdge path={path} style={style} />;
}

const nodeTypes = {
  person: PersonNode,
  union: UnionNode,
};

const edgeTypes = {
  partner: PartnerEdge,
};

/* ------------------------------------------------------------------ */
/*  Relations                                                          */
/* ------------------------------------------------------------------ */

type RelPerson = { id: string; name?: string; surname?: string; gender?: string };
type RelationsMap = Record<string, RelPerson[]>;

function computeRelations(personId: string, nodes: Node[], edges: Edge[]): RelationsMap {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const isUnion = (id: string) => byId.get(id)?.type === "union";
  const isPerson = (id: string) => byId.get(id)?.type === "person";

  const partnerUnionsOf = (pid: string) =>
    edges.filter((e) => e.source === pid && isUnion(e.target)).map((e) => e.target);
  const childrenViaUnions = (unions: string[]) => {
    const out = new Set<string>();
    unions.forEach((u) =>
      edges
        .filter((e) => e.source === u && isPerson(e.target))
        .forEach((e) => out.add(e.target)),
    );
    return out;
  };
  const parentUnionOf = (pid: string) =>
    edges.find((e) => e.target === pid && isUnion(e.source))?.source as string | undefined;
  const membersOfUnion = (u: string) =>
    edges.filter((e) => e.target === u && isPerson(e.source)).map((e) => e.source as string);

  const partnerUnions = partnerUnionsOf(personId);
  const partners = new Set<string>();
  partnerUnions.forEach((u) =>
    membersOfUnion(u).filter((id) => id !== personId).forEach((id) => partners.add(id)),
  );
  const children = childrenViaUnions(partnerUnions);

  const parentUnion = parentUnionOf(personId);
  const parents = new Set<string>();
  const siblings = new Set<string>();
  if (parentUnion) {
    membersOfUnion(parentUnion).forEach((id) => parents.add(id));
    edges
      .filter((e) => e.source === parentUnion && isPerson(e.target) && e.target !== personId)
      .forEach((e) => siblings.add(e.target));
  }

  const grandparents = new Set<string>();
  const auntsUncles = new Set<string>();
  parents.forEach((p) => {
    const pu = parentUnionOf(p);
    if (!pu) return;
    membersOfUnion(pu).forEach((id) => grandparents.add(id));
    edges
      .filter((e) => e.source === pu && isPerson(e.target) && e.target !== p)
      .forEach((e) => auntsUncles.add(e.target));
  });

  const grandchildren = childrenViaUnions(Array.from(children).flatMap((c) => partnerUnionsOf(c)));
  const cousins = childrenViaUnions(Array.from(auntsUncles).flatMap((au) => partnerUnionsOf(au)));
  const nephewsNieces = childrenViaUnions(Array.from(siblings).flatMap((s) => partnerUnionsOf(s)));

  const toList = (ids: Set<string>): RelPerson[] =>
    Array.from(ids).map((id) => {
      const d = byId.get(id)?.data as PersonData | undefined;
      return { id, name: d?.name, surname: d?.surname, gender: d?.gender };
    });

  return {
    Partners: toList(partners),
    Parents: toList(parents),
    Children: toList(children),
    Siblings: toList(siblings),
    Grandparents: toList(grandparents),
    Grandchildren: toList(grandchildren),
    "Aunts & Uncles": toList(auntsUncles),
    Cousins: toList(cousins),
    "Nephews & Nieces": toList(nephewsNieces),
  };
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function FamilyTreeCanvas() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const initial = useMemo(
    () => buildInitialGraph({ dad: t("canvas.dad"), mom: t("canvas.mom"), me: t("canvas.me") }),
    // build initial graph once with first-render language; ignore later lang changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const selectedNodeIdRef = useRef<string | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const dispatchNodeSelected = useCallback((node: Node | null) => {
    document.dispatchEvent(
      new CustomEvent("node-selected", {
        detail: node
          ? {
              ...node.data,
              id: node.id,
              relations: computeRelations(node.id, nodesRef.current, edgesRef.current),
            }
          : null,
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

  useEffect(() => {
    const id = selectedNodeIdRef.current;
    if (!id) return;
    const node = nodes.find((n) => n.id === id);
    if (node) dispatchNodeSelected(node);
  }, [nodes, edges, dispatchNodeSelected]);

  useEffect(() => {
    const persons = nodes
      .filter((n) => n.type === "person")
      .map((n) => ({ id: n.id, ...(n.data as PersonData) }));
    document.dispatchEvent(new CustomEvent("nodes-updated", { detail: persons }));
  }, [nodes]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent).detail as { id: string };
      const node = nodesRef.current.find((n) => n.id === id);
      if (!node) return;
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === id })));
      selectedNodeIdRef.current = id;
      dispatchNodeSelected(node);
    };
    document.addEventListener("select-person-by-id", handler);
    return () => document.removeEventListener("select-person-by-id", handler);
  }, [setNodes, dispatchNodeSelected]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId, data } = (e as CustomEvent).detail;
      setNodes((nds) =>
        nds.map((n) => (n.id !== nodeId ? n : { ...n, data: { ...n.data, ...data } })),
      );
    };
    document.addEventListener("update-node", handler);
    return () => document.removeEventListener("update-node", handler);
  }, [setNodes]);

  /* -------- Add person -------- */
  useEffect(() => {
    const handler = (e: Event) => {
      const { relation, targetNodeId } = (e as CustomEvent).detail as {
        relation: "partner" | "parent" | "child";
        targetNodeId: string;
      };

      const prevNodes = nodesRef.current;
      const prevEdges = edgesRef.current;
      const target = prevNodes.find((n) => n.id === targetNodeId);
      if (!target) return;

      const newPersonId = nextId("person");
      const newPerson: Node = {
        id: newPersonId,
        type: "person",
        position: { x: 0, y: 0 },
        data: { name: tRef.current("canvas.newPerson"), gender: "o" } as PersonData,
      };

      let workingNodes: Node[] = [...prevNodes];
      let workingEdges: Edge[] = [...prevEdges];

      if (relation === "partner") {
        // If target is the sole partner of an existing union (e.g. union was
        // created when target had a child alone), attach the new partner to
        // that union so they share the children. Otherwise create a new union.
        const targetUnions = prevEdges
          .filter(
            (ed) =>
              ed.source === targetNodeId &&
              prevNodes.find((n) => n.id === ed.target)?.type === "union",
          )
          .map((ed) => ed.target as string);
        const soloUnion = targetUnions.find((uid) => {
          const partners = prevEdges.filter(
            (ed) =>
              ed.target === uid &&
              prevNodes.find((n) => n.id === ed.source)?.type === "person",
          );
          return partners.length === 1;
        });

        if (soloUnion) {
          workingNodes.push(newPerson);
          workingEdges.push(makePartnerEdge(newPersonId, soloUnion));
        } else {
          const unionId = nextId("union");
          const unionNode: Node = {
            id: unionId,
            type: "union",
            position: { x: 0, y: 0 },
            data: {},
          };
          workingNodes.push(newPerson, unionNode);
          workingEdges.push(
            makePartnerEdge(targetNodeId, unionId),
            makePartnerEdge(newPersonId, unionId),
          );
        }
      } else if (relation === "child") {
        let unionId = prevEdges.find(
          (ed) => ed.source === targetNodeId && prevNodes.find((n) => n.id === ed.target)?.type === "union",
        )?.target as string | undefined;

        if (!unionId) {
          unionId = nextId("union");
          const unionNode: Node = {
            id: unionId,
            type: "union",
            position: { x: 0, y: 0 },
            data: {},
          };
          workingNodes.push(unionNode);
          workingEdges.push(makePartnerEdge(targetNodeId, unionId));
        }
        workingNodes.push(newPerson);
        workingEdges.push(makeChildEdge(unionId, newPersonId));
      } else if (relation === "parent") {
        const hasParentAlready = prevEdges.some(
          (ed) => ed.target === targetNodeId && prevNodes.find((n) => n.id === ed.source)?.type === "union",
        );
        if (hasParentAlready) return;

        const dadId = newPersonId;
        const momId = nextId("person");
        const unionId = nextId("union");

        newPerson.data = { name: tRef.current("canvas.dad"), gender: "m" } as PersonData;
        const momNode: Node = {
          id: momId,
          type: "person",
          position: { x: 0, y: 0 },
          data: { name: tRef.current("canvas.mom"), gender: "f" } as PersonData,
        };
        const unionNode: Node = {
          id: unionId,
          type: "union",
          position: { x: 0, y: 0 },
          data: {},
        };
        workingNodes.push(newPerson, momNode, unionNode);
        workingEdges.push(
          makePartnerEdge(dadId, unionId),
          makePartnerEdge(momId, unionId),
          makeChildEdge(unionId, targetNodeId),
        );
      }

      const laid = applyAutoLayout(workingNodes, workingEdges);
      const finalNodes = laid.nodes.map((n) => ({ ...n, selected: n.id === newPersonId }));
      selectedNodeIdRef.current = newPersonId;
      setNodes(finalNodes);
      setEdges(laid.edges);

      setTimeout(() => {
        document.dispatchEvent(
          new CustomEvent("select-person-by-id", { detail: { id: newPersonId } }),
        );
      }, 50);
    };

    document.addEventListener("add-person", handler);
    return () => document.removeEventListener("add-person", handler);
  }, [setNodes, setEdges]);

  /* -------- Delete person -------- */
  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent).detail as { id: string };
      const prevNodes = nodesRef.current;
      const prevEdges = edgesRef.current;

      const isPerson = (nid: string) => prevNodes.find((n) => n.id === nid)?.type === "person";

      let remainingEdges = prevEdges.filter((ed) => ed.source !== id && ed.target !== id);
      const unionsToRemove = new Set<string>();

      while (true) {
        const newlyOrphan = prevNodes
          .filter((n) => n.type === "union" && !unionsToRemove.has(n.id))
          .filter((n) => {
            const cnt = remainingEdges.filter(
              (ed) =>
                (ed.source === n.id && isPerson(ed.target)) ||
                (ed.target === n.id && isPerson(ed.source)),
            ).length;
            return cnt < 2;
          })
          .map((n) => n.id);
        if (newlyOrphan.length === 0) break;
        newlyOrphan.forEach((u) => unionsToRemove.add(u));
        remainingEdges = remainingEdges.filter(
          (ed) => !unionsToRemove.has(ed.source) && !unionsToRemove.has(ed.target),
        );
      }

      const remainingNodes = prevNodes.filter(
        (n) => n.id !== id && !unionsToRemove.has(n.id),
      );

      const laid = applyAutoLayout(remainingNodes, remainingEdges);
      setNodes(laid.nodes);
      setEdges(laid.edges);

      if (selectedNodeIdRef.current === id) {
        selectedNodeIdRef.current = null;
        dispatchNodeSelected(null);
      }
    };
    document.addEventListener("delete-person", handler);
    return () => document.removeEventListener("delete-person", handler);
  }, [setNodes, setEdges, dispatchNodeSelected]);

  useEffect(() => {
    const handleSave = async () => {
      try {
        const response = await fetch("/api/tree", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        });
        const result = await response.json();
        if (result.success) alert(tRef.current("canvas.savedSuccess"));
        else alert(tRef.current("canvas.saveFailed", { error: result.error }));
      } catch (err) {
        console.error(err);
        alert(tRef.current("canvas.saveError"));
      }
    };
    document.addEventListener("save-family-tree", handleSave);
    return () => document.removeEventListener("save-family-tree", handleSave);
  }, [nodes, edges]);

  useEffect(() => {
    const handleDownloadPdf = async () => {
      try {
        const viewport = document.querySelector(
          ".react-flow__viewport",
        ) as HTMLElement | null;
        if (!viewport || nodes.length === 0) return;

        const padding = 40;
        const bounds = getNodesBounds(nodes);
        const imageWidth = Math.max(800, Math.ceil(bounds.width + padding * 2));
        const imageHeight = Math.max(600, Math.ceil(bounds.height + padding * 2));
        const transform = getViewportForBounds(
          bounds,
          imageWidth,
          imageHeight,
          0.5,
          2,
          0.1,
        );

        const bgColor =
          theme === "dark" ? "#030712" : "#FEFDFC";
        const dataUrl = await toPng(viewport, {
          backgroundColor: bgColor,
          width: imageWidth,
          height: imageHeight,
          style: {
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
          },
        });

        const orientation = imageWidth >= imageHeight ? "landscape" : "portrait";
        const pdf = new jsPDF({
          orientation,
          unit: "px",
          format: [imageWidth, imageHeight],
        });
        pdf.addImage(dataUrl, "PNG", 0, 0, imageWidth, imageHeight);
        pdf.save("family-tree.pdf");
      } catch (err) {
        console.error(err);
        alert(tRef.current("canvas.pdfError"));
      }
    };
    document.addEventListener("download-family-tree-pdf", handleDownloadPdf);
    return () =>
      document.removeEventListener("download-family-tree-pdf", handleDownloadPdf);
  }, [nodes, theme]);

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
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        minZoom={0.2}
        defaultEdgeOptions={{ zIndex: 0 }}
        colorMode={theme}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color={theme === "dark" ? "#374151" : undefined}
        />
        <MiniMap
          nodeColor={(n: any) => {
            if (n.data?.gender === "f") return "#F8D4D9";
            if (n.data?.gender === "m") return "#D2E3F5";
            return theme === "dark" ? "#4B5563" : "#EDE6E2";
          }}
          nodeStrokeWidth={3}
          maskColor={theme === "dark" ? "rgba(0,0,0,0.6)" : "rgba(240,240,240,0.6)"}
          style={{ backgroundColor: theme === "dark" ? "#1F2937" : undefined }}
          zoomable
          pannable
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
