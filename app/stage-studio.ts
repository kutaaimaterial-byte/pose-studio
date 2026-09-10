import { parseTimelinePrompt } from "./video-timeline";

export const shotSizes = { ECU: "超特写", CU: "特写", MCU: "近景", MS: "中景", MLS: "中全景", FS: "全景", LS: "远景", ELS: "大远景" } as const;
export const shotAngles = { eye_level: "平视", low: "低机位", high: "高机位", up: "仰拍", down: "俯拍", side: "侧拍", back: "背拍", top: "顶视角", dutch: "荷兰角" } as const;
export const compositions = { center: "居中", thirds: "三分法", left: "左侧", right: "右侧", diagonal: "对角线", symmetry: "对称", negative: "留白", full_body: "单人全身", dialogue: "双人对话" } as const;
export const stageTypes = { blank: "空白舞台", interior: "室内", street: "街道", room: "房间", rooftop: "天台", grass: "草地", studio: "摄影棚" } as const;
export type StudioRatio = "9:16" | "16:9" | "1:1" | "4:5" | "3:4" | "21:9" | "4:3" | "3:2" | "2:3";
export type ShotPreset = {
  size: keyof typeof shotSizes; angle: keyof typeof shotAngles; composition: keyof typeof compositions;
  ratio: StudioRatio; focalLength: number; occupancy: number; horizon: number;
  offsetX: number; offsetY: number; safeFrame: boolean; guides: boolean;
  gridEnabled: boolean; gridMode: string; negativeSpace: "none" | "sky" | "foreground" | "side";
};
export type StageSettings = { id: string; name: string; type: keyof typeof stageTypes; width: number; depth: number };
export type StageRecord<T> = { settings: StageSettings; snapshot: T; shotId: string | null; savedAt: number };
export type CustomShotPreset<T> = { id: string; name: string; framing: ShotPreset; camera: T };
export const defaultShotPreset: ShotPreset = { size: "FS", angle: "eye_level", composition: "center", ratio: "9:16", focalLength: 50, occupancy: .82, horizon: .5, offsetX: 0, offsetY: 0, safeFrame: false, guides: false, gridEnabled: true, gridMode: "ground", negativeSpace: "none" };
export const defaultStage: StageSettings = { id: "stage-default", name: "舞台 01", type: "blank", width: 16, depth: 16 };
export const studioRatios: StudioRatio[] = ["9:16", "16:9", "1:1", "4:5", "3:4", "21:9", "4:3", "2:3"];

export function normalizeShotPreset(value: Partial<ShotPreset> = {}): ShotPreset {
  const next = { ...defaultShotPreset, ...value };
  const bounded = (n: number, fallback: number, min: number, max: number) => Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  return { ...next, size: next.size in shotSizes ? next.size : "FS", angle: next.angle in shotAngles ? next.angle : "eye_level", composition: next.composition in compositions ? next.composition : "center", ratio: /^(9:16|16:9|1:1|4:5|3:4|21:9|4:3|3:2|2:3)$/.test(next.ratio) ? next.ratio : "9:16", focalLength: bounded(next.focalLength, 50, 14, 200), occupancy: bounded(next.occupancy, .82, .2, .95), horizon: bounded(next.horizon, .5, .1, .9), offsetX: bounded(next.offsetX, 0, -.45, .45), offsetY: bounded(next.offsetY, 0, -.45, .45) };
}

// Camera-space framing independent of the pose solver; changing it never edits bones.
export function framingGeometry(preset: ShotPreset, height = 3.45) {
  const regions = { ECU: [.12, .95], CU: [.25, .88], MCU: [.4, .8], MS: [.56, .7], MLS: [.78, .59], FS: [1, .5], LS: [1.8, .5], ELS: [3.3, .5] };
  const [fraction, center] = regions[preset.size];
  const [w, h] = preset.ratio.split(":").map(Number);
  const aspect = w / h;
  // Three.js film gauge uses the smaller dimension for horizontal/vertical fitting.
  const filmHeight = 35 / Math.max(aspect, 1);
  const fov = 2 * Math.atan(filmHeight / (2 * preset.focalLength));
  const region = height * (preset.composition === "full_body" ? Math.max(1, fraction) : fraction);
  const distance = region / (2 * Math.tan(fov / 2) * preset.occupancy);
  const xBias = preset.composition === "left" ? -.23 : preset.composition === "right" ? .23 : preset.composition === "thirds" ? -.1667 : preset.composition === "negative" ? .25 : 0;
  const yBias = preset.negativeSpace === "sky" ? .2 : preset.negativeSpace === "foreground" ? -.16 : 0;
  return { distance, targetHeight: height * center, halfHeight: distance * Math.tan(fov / 2), aspect, xBias: xBias + preset.offsetX, yBias: yBias + preset.offsetY + (preset.horizon - .5) * .4 };
}

export type ShotDraft = { start: number; end: number; duration: number; promptText: string; shotPreset: ShotPreset; stageType: StageSettings["type"]; camera: { fov: number; lookAt: "character"; framingBias: string }; poseHint: { category: string }; motion: string };
export function parseShotPrompt(text: string, ratio: StudioRatio = "9:16"): ShotDraft {
  const t = text.toLowerCase();
  const pick = <T extends string>(rules: [RegExp, T][], fallback: T): T => rules.find(([regex]) => regex.test(t))?.[1] ?? fallback;
  const size = pick<ShotPreset["size"]>([[/超特写|极近景|脸部特写|\becu\b/, "ECU"], [/大远景|\bels\b|extreme long/, "ELS"], [/中全景|\bmls\b/, "MLS"], [/中近景|近景|\bmcu\b/, "MCU"], [/特写|\bcu\b|close.?up/, "CU"], [/中景|半身|\bms\b|medium shot/, "MS"], [/远景|\bls\b|long shot/, "LS"], [/全景|全身|\bfs\b|full.?body/, "FS"]], "FS");
  const angle = pick<ShotPreset["angle"]>([[/荷兰|倾斜|dutch/, "dutch"], [/顶视|鸟瞰|top.?down/, "top"], [/低机位|low angle/, "low"], [/高机位|high angle/, "high"], [/仰拍|worm/, "up"], [/俯拍/, "down"], [/侧拍|侧面镜头|side view/, "side"], [/背拍|背面镜头|rear view/, "back"]], "eye_level");
  const composition = pick<ShotPreset["composition"]>([[/右侧|右构图|on the right/, "right"], [/左侧|左构图|on the left/, "left"], [/三分|thirds/, "thirds"], [/对称|symmetr/, "symmetry"], [/对角|diagonal/, "diagonal"], [/双人|对话|dialogue/, "dialogue"], [/居中|中央|center/, "center"], [/留白|negative space/, "negative"]], "center");
  const negativeSpace = pick<ShotPreset["negativeSpace"]>([[/大量天空|天空留白|large sky/, "sky"], [/大量前景|foreground/, "foreground"], [/留白|negative space/, "side"]], "none");
  const stageType = pick<StageSettings["type"]>([[/屋顶|天台|rooftop/, "rooftop"], [/街道|街头|street/, "street"], [/房间|卧室|room/, "room"], [/室内|interior/, "interior"], [/草地|草原|grass/, "grass"], [/摄影棚|棚拍|studio/, "studio"]], "blank");
  const shotPreset = normalizeShotPreset({ ...defaultShotPreset, size, angle, composition, negativeSpace, ratio: (t.match(/\b(9:16|16:9|1:1|4:5|3:4|21:9|4:3|2:3)\b/)?.[1] as StudioRatio) ?? ratio });
  const geometry = framingGeometry(shotPreset);
  return { start: 0, end: 3, duration: 3, promptText: text, shotPreset, stageType, camera: { fov: 2 * Math.atan(geometry.halfHeight / geometry.distance) * 180 / Math.PI, lookAt: "character", framingBias: composition }, poseHint: { category: pick([[/冲刺|跑|run|sprint/, "running"], [/走|walk/, "walking"], [/坐|sit/, "sitting"], [/跪|kneel/, "kneeling"], [/跳|jump/, "jumping"]], "standing") }, motion: pick([[/保持静止|固定镜头|still/, "static"], [/推近|推进|push/, "push"], [/拉远|拉开|pull/, "pull"], [/横移|truck/, "truck"], [/跟拍|follow/, "follow"], [/环绕|orbit/, "orbit"]], "static") };
}
export function parseShotSequence(text: string, ratio: StudioRatio = "9:16"): { drafts: ShotDraft[]; warnings: string[] } {
  if (!text.trim()) return { drafts: [], warnings: ["请输入分镜提示词"] };
  const timed = /\d\s*(?:秒|s)?\s*[-~～—–至到]\s*\d/.test(text);
  if (!timed) return { drafts: [parseShotPrompt(text, ratio)], warnings: [] };
  const parsed = parseTimelinePrompt(text);
  return { drafts: parsed.timeline.shots.map((shot) => ({ ...parseShotPrompt(shot.promptText, (text.match(/\b(9:16|16:9|1:1|4:5|3:4|21:9)\b/)?.[1] as StudioRatio) ?? ratio), start: shot.start, end: shot.end, duration: shot.duration })), warnings: [...parsed.issues.map((issue) => issue.message), ...parsed.unassigned.map((line) => `未分配：${line}`)] };
}

export const nodeKinds = { prompt: "Prompt · 提示词", parse: "Shot Parse · 解析", stage: "Stage · 舞台", pose: "Pose · 姿态", camera: "Camera · 相机", shot: "Shot · 景别", lighting: "Lighting · 灯光", timeline: "Timeline · 片段", snapshot: "Snapshot · 快照", export: "Export · 导出" } as const;
export type StudioNode = { id: string; kind: keyof typeof nodeKinds; x: number; y: number; shotId?: string; text?: string };
export type StudioGraph = { nodes: StudioNode[]; edges: { from: string; to: string }[] };
export function syncShotCards(graph: StudioGraph, shots: { id: string; title: string; duration: number }[]): StudioGraph {
  const ids = new Set(shots.map((s) => s.id));
  const internal = graph.nodes.filter((n) => (!n.shotId || ids.has(n.shotId)) && !(n.kind === "shot" && n.shotId));
  const cards = shots.map((shot, index): StudioNode => {
    const previous = graph.nodes.find((n) => n.kind === "shot" && n.shotId === shot.id);
    return { id: previous?.id ?? `card-${shot.id}`, kind: "shot", shotId: shot.id, x: previous?.x ?? index * 240 + 24, y: previous?.y ?? 24, text: previous && !previous.id.startsWith("card-") ? previous.text : `${shot.title} · ${shot.duration.toFixed(2)}s` };
  });
  const nodeIds = new Set([...internal, ...cards].map((n) => n.id)), cardIds = new Set(cards.map((n) => n.id));
  const edges = graph.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to) && !(cardIds.has(e.from) && cardIds.has(e.to)));
  cards.slice(1).forEach((card, index) => edges.push({ from: cards[index].id, to: card.id }));
  return { nodes: [...internal, ...cards], edges };
}
export function connectNodes(graph: StudioGraph, from: string, to: string): StudioGraph {
  if (from === to || !graph.nodes.some((n) => n.id === from) || !graph.nodes.some((n) => n.id === to) || graph.edges.some((e) => e.from === from && e.to === to)) return graph;
  const pending = [to], visited = new Set<string>();
  while (pending.length) { const id = pending.pop()!; if (id === from) return graph; if (visited.has(id)) continue; visited.add(id); pending.push(...graph.edges.filter((e) => e.from === id).map((e) => e.to)); }
  return { ...graph, edges: [...graph.edges, { from, to }] };
}
export function shotSnapshotFilename(project: string, index: number, preset: ShotPreset, mode = "clean") {
  const safeName = Array.from(project).map((c) => c.charCodeAt(0) < 32 ? "_" : c).join("").replace(/[\\/:*?"<>|]/g, "_").slice(0, 80);
  return `${safeName || "PoseBoard"}_Shot${String(index).padStart(2, "0")}_${preset.size}_${preset.ratio.replace(":", "x")}${mode === "clean" ? "" : `_${mode}`}.png`;
}
