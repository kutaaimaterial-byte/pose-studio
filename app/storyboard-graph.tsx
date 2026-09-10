"use client";
import { useRef, useState } from "react";
import { connectNodes, nodeKinds, type StudioGraph, type StudioNode } from "./stage-studio";

type Props = { graph: StudioGraph; onChange: (graph: StudioGraph) => void; shots: { id: string; index: number; title: string }[]; activeShotId: string | null; onSelectShot: (id: string) => void; onRun: (kind: StudioNode["kind"], prompt: string) => void; onTimeline: () => void; onMessage: (text: string) => void };
export function StoryboardGraph(p: Props) {
  const [kind, setKind] = useState<StudioNode["kind"]>("shot");
  const [selected, setSelected] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const drag = useRef<{ id: string; x: number; y: number; left: number; top: number } | null>(null);
  const patch = (id: string, update: Partial<StudioNode>) => p.onChange({ ...p.graph, nodes: p.graph.nodes.map((n) => n.id === id ? { ...n, ...update } : n) });
  const select = (node: StudioNode) => { setSelected(node.id); if (node.shotId) p.onSelectShot(node.shotId); };
  const sourcePrompt = (id: string) => {
    const queue = [id], visited = new Set<string>();
    while (queue.length) { const current = queue.shift()!; if (visited.has(current)) continue; visited.add(current); const node = p.graph.nodes.find((n) => n.id === current); if (node?.kind === "prompt" && node.text?.trim()) return node.text; queue.push(...p.graph.edges.filter((e) => e.to === current).map((e) => e.from)); }
    return "";
  };
  const loadGraph = async (file: File) => {
    try {
      if (file.size > 1000000) throw new Error("节点文件过大");
      const raw = JSON.parse(await file.text()) as StudioGraph;
      if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges) || raw.nodes.length > 300 || raw.nodes.some((n) => !n.id || !(n.kind in nodeKinds) || !Number.isFinite(n.x) || !Number.isFinite(n.y))) throw new Error("无效节点文件");
      if (new Set(raw.nodes.map((n) => n.id)).size !== raw.nodes.length) throw new Error("节点 ID 重复");
      let validated: StudioGraph = { nodes: raw.nodes.map((n) => ({ ...n, x: Math.max(0, Math.min(10000, n.x)), y: Math.max(0, Math.min(10000, n.y)) })), edges: [] };
      for (const e of raw.edges) { const next = connectNodes(validated, e.from, e.to); if (next === validated) throw new Error("连接包含循环或无效节点"); validated = next; }
      if (p.graph.nodes.length && !window.confirm("用文件中的节点替换当前节点结构？时间轴不会被替换。")) return;
      p.onChange(validated); setSelected(null); setSource(null); p.onMessage("节点结构已读取");
    } catch (error) { p.onMessage(error instanceof Error ? error.message : "读取失败"); }
  };
  const exportGraph = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(p.graph, null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = "PoseBoard_Storyboard_Nodes.json"; a.click(); URL.revokeObjectURL(url); };
  const autoGraph = () => {
    if (p.graph.nodes.length && !window.confirm("按当前时间轴重新建立节点？将替换当前节点布局和连线。")) return;
    const nodes: StudioNode[] = (Object.keys(nodeKinds) as StudioNode["kind"][]).filter((k) => k !== "shot").map((kind, i) => ({ id: `pipeline-${kind}`, kind, x: 30 + (i % 5) * 280, y: 30 + Math.floor(i / 5) * 230, text: kind === "prompt" ? "角色中景站立，平视镜头" : undefined }));
    const shots = p.shots.length ? p.shots : [{ id: "", index: 1, title: "未绑定镜头" }];
    shots.forEach((shot, i) => nodes.push({ id: `node-shot-${i}`, kind: "shot", shotId: shot.id || undefined, x: 30 + (i % 5) * 280, y: 500 + Math.floor(i / 5) * 180 }));
    const pipeline = ["prompt", "parse", "stage", "pose", "camera", "lighting", "timeline", "snapshot", "export"];
    const edges = pipeline.slice(1).map((k, i) => ({ from: `pipeline-${pipeline[i]}`, to: `pipeline-${k}` }));
    shots.forEach((_, i) => { edges.push({ from: "pipeline-parse", to: `node-shot-${i}` }); edges.push({ from: `node-shot-${i}`, to: "pipeline-timeline" }); });
    p.onChange({ nodes, edges });
  };
  return <section className="studio-graph" aria-label="分镜节点视图"><div className="studio-graph-header"><strong>分镜节点</strong><select aria-label="新节点类型" value={kind} onChange={(e) => setKind(e.target.value as StudioNode["kind"])}>{Object.entries(nodeKinds).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select><button onClick={() => p.onChange({ ...p.graph, nodes: [...p.graph.nodes, { id: crypto.randomUUID(), kind, x: 30 + p.graph.nodes.length % 5 * 260, y: 30 + Math.floor(p.graph.nodes.length / 5) * 230, shotId: p.activeShotId ?? undefined }] })}>添加节点</button><button onClick={autoGraph}>从时间轴建图</button><button onClick={exportGraph}>保存节点</button><label className="studio-file">读取节点<input type="file" accept=".json" onChange={(e) => { if (e.target.files?.[0]) void loadGraph(e.target.files[0]); e.target.value = ""; }} /></label><button onClick={p.onTimeline}>返回时间轴</button></div>
    <p className="studio-graph-help">拖动标题移动节点；点击“输出”后点击另一节点的“输入”连接。点击 Shot 同步右侧参数；执行解析会读取上游 Prompt。{source && <button onClick={() => setSource(null)}>取消连接</button>}</p>
    <div className="studio-graph-scroll"><div className="studio-graph-world" style={{ width: Math.max(1600, ...p.graph.nodes.map((n) => n.x + 250)), height: Math.max(680, ...p.graph.nodes.map((n) => n.y + 280)) }}>
      <svg width="100%" height="100%" aria-hidden="true">{p.graph.edges.map((edge) => { const a = p.graph.nodes.find((n) => n.id === edge.from), b = p.graph.nodes.find((n) => n.id === edge.to); return a && b ? <path key={`${edge.from}-${edge.to}`} d={`M${a.x + 218},${a.y + 65} C${a.x + 265},${a.y + 65} ${b.x - 45},${b.y + 65} ${b.x},${b.y + 65}`} fill="none" stroke="#7b9bd3" strokeWidth="2" /> : null; })}</svg>
      {!p.graph.nodes.length && <button style={{ margin: 30 }} onClick={autoGraph}>从现有分镜创建完整节点结构</button>}
      {p.graph.nodes.map((node) => <article className={`studio-graph-node ${selected === node.id ? "selected" : ""}`} key={node.id} style={{ left: node.x, top: node.y }}>
        <button className="node-handle" onClick={() => select(node)} onPointerDown={(e) => { if (e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = { id: node.id, x: e.clientX, y: e.clientY, left: node.x, top: node.y }; }} onPointerMove={(e) => { const d = drag.current; if (d?.id === node.id && e.buttons) patch(node.id, { x: Math.max(0, d.left + e.clientX - d.x), y: Math.max(0, d.top + e.clientY - d.y) }); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>{nodeKinds[node.kind]}</button>
        {node.kind === "prompt" ? <textarea aria-label="节点提示词" value={node.text ?? ""} onChange={(e) => patch(node.id, { text: e.target.value })} /> : <select aria-label="绑定分镜" value={node.shotId ?? ""} onChange={(e) => { patch(node.id, { shotId: e.target.value }); if (e.target.value) p.onSelectShot(e.target.value); }}><option value="">当前工作区</option>{p.shots.map((shot) => <option key={shot.id} value={shot.id}>Shot {shot.index} · {shot.title}</option>)}</select>}
        <div className="studio-node-ports"><button onClick={() => { if (!source) { p.onMessage("请先选择一个节点的输出"); return; } const next = connectNodes(p.graph, source, node.id); if (next === p.graph) p.onMessage("不能重复连接、自连接或形成循环"); else p.onChange(next); setSource(null); }}>○ 输入</button><button aria-pressed={source === node.id} onClick={() => setSource(node.id)}>输出 ●</button></div>
        <button onClick={() => { select(node); p.onRun(node.kind, sourcePrompt(node.id)); }}>{node.kind === "parse" ? "读取上游并解析" : node.kind === "snapshot" ? "保存当前快照" : node.kind === "export" ? "导出项目" : "打开参数"}</button>
        {selected === node.id && <div className="studio-node-ports"><button onClick={() => p.onChange({ ...p.graph, edges: p.graph.edges.filter((e) => e.from !== node.id && e.to !== node.id) })}>断开连线</button><button onClick={() => { p.onChange({ nodes: p.graph.nodes.filter((n) => n.id !== node.id), edges: p.graph.edges.filter((e) => e.from !== node.id && e.to !== node.id) }); setSelected(null); }}>删除节点</button></div>}
      </article>)}
    </div></div>
  </section>;
}
