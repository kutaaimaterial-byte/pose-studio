"use client";
import { useState } from "react";
import { compositions, parseShotSequence, shotAngles, shotSizes, stageTypes, studioRatios, type ShotDraft, type ShotPreset, type StageSettings } from "./stage-studio";

export type SnapshotMode = "clean" | "reference" | "with-grid" | "safe-frame" | "annotated";
export type ShotSummary = { id: string; index: number; title: string; duration: number; pose: string; camera: string; framing: string; thumbnail: string };
type Props = {
  initialPrompt?: string;
  cloudStatus: string; onCloudSave: () => void; onCloudRestore: () => void;
  stage: StageSettings; stages: { id: string; name: string }[]; framing: ShotPreset;
  presets: { id: string; name: string }[]; currentShot?: ShotSummary; ready: boolean; exporting: boolean;
  onStage: (patch: Partial<StageSettings>) => void; onStageAction: (action: "create" | "duplicate" | "delete" | "save" | "restore") => void;
  onSelectStage: (id: string) => void; onFraming: (patch: Partial<ShotPreset>) => void;
  onSavePreset: (name: string) => void; onPreset: (id: string) => void;
  onCreateShots: (drafts: ShotDraft[]) => void; onAddShot: () => void; onUpdateShot: () => void;
  onSnapshot: (mode: SnapshotMode) => void; onGraph: () => void; onExport: () => void; onImport: (file: File) => void;
};
const example = "0-2秒：角色中景站立，平视镜头。\n2-4秒：切换近景，角色回头。\n4-6秒：低机位全身，角色向前冲刺，天台，人物位于画面右侧，大量天空留白。";

export function StagePanel(p: Props) {
  const [section, setSection] = useState(p.initialPrompt ? "parse" : "framing");
  const [prompt, setPrompt] = useState(p.initialPrompt || example);
  const [drafts, setDrafts] = useState<ShotDraft[]>(() => p.initialPrompt ? parseShotSequence(p.initialPrompt, p.framing.ratio).drafts : []);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [presetName, setPresetName] = useState("");
  const [parsedText, setParsedText] = useState(p.initialPrompt || "");
  const patchDraft = (index: number, patch: Partial<ShotPreset>) => setDrafts((current) => current.map((d, i) => i === index ? { ...d, shotPreset: { ...d.shotPreset, ...patch } } : d));
  return <div className="stage-panel">
    <div className="studio-release">V3.4 <span>舞台分镜预演</span></div>
    <div className="studio-tabs" role="tablist" aria-label="舞台工具">{Object.entries({ stage: "舞台", framing: "景别", parse: "文字分镜", snapshot: "快照" }).map(([id, label]) => <button key={id} role="tab" aria-selected={section === id} onClick={() => setSection(id)}>{label}</button>)}</div>
    {section === "stage" && <div className="studio-section">
      <label>当前舞台<select value={p.stage.id} onChange={(e) => p.onSelectStage(e.target.value)}>{p.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>
      <label>舞台名称<input value={p.stage.name} maxLength={60} onChange={(e) => p.onStage({ name: e.target.value })} /></label>
      <div className="studio-stage-grid">{Object.entries(stageTypes).map(([id, name]) => <button key={id} aria-pressed={p.stage.type === id} onClick={() => p.onStage({ type: id as StageSettings["type"] })}>{name}</button>)}</div>
      <div className="studio-fields">{(["width", "depth"] as const).map((key) => <label key={key}>{key === "width" ? "地面宽度" : "地面深度"}<input type="number" min={4} max={40} value={p.stage[key]} onChange={(e) => p.onStage({ [key]: Math.max(4, Math.min(40, Number(e.target.value) || 4)) })} /></label>)}</div>
      <div className="studio-actions">{(["create", "duplicate", "save", "restore", "delete"] as const).map((action) => <button key={action} disabled={!p.ready || (action === "delete" && p.stages.length <= 1)} onClick={() => p.onStageAction(action)}>{({ create: "新建舞台", duplicate: "复制舞台", save: "保存舞台", restore: "恢复已保存状态", delete: "删除舞台" })[action]}</button>)}</div>
      <p className="studio-hint">舞台包含人物、相机、灯光、网格和当前镜头。编辑会缓存到本机；“保存舞台”同时备份完整项目到云端。访问钥匙留在本浏览器，清除浏览器数据前请导出 JSON。</p>
      <div className="studio-actions"><button disabled={!p.ready || p.cloudStatus.includes("正在")} onClick={p.onCloudSave}>保存云端项目</button><button disabled={!p.ready || p.cloudStatus.includes("正在")} onClick={p.onCloudRestore}>恢复云端项目</button></div>
      {p.cloudStatus && <p className="studio-hint" role="status">{p.cloudStatus}</p>}
      <div className="studio-actions"><button onClick={p.onExport}>导出项目 JSON</button><label className="studio-file">导入 V3.4 项目<input type="file" accept="application/json,.json" onChange={(e) => { const file = e.target.files?.[0]; if (file) p.onImport(file); e.target.value = ""; }} /></label></div>
    </div>}
    {section === "framing" && <div className="studio-section">
      <h3>景别</h3><div className="studio-size-grid">{Object.entries(shotSizes).map(([id, label]) => <button key={id} disabled={!p.ready} aria-pressed={p.framing.size === id} onClick={() => p.onFraming({ size: id as ShotPreset["size"] })}><b>{id}</b><span>{label}</span></button>)}</div>
      <div className="studio-fields"><label>机位<select value={p.framing.angle} onChange={(e) => p.onFraming({ angle: e.target.value as ShotPreset["angle"] })}>{Object.entries(shotAngles).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>构图<select value={p.framing.composition} onChange={(e) => p.onFraming({ composition: e.target.value as ShotPreset["composition"] })}>{Object.entries(compositions).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label></div>
      <div className="studio-fields"><label>画幅<select value={p.framing.ratio} onChange={(e) => p.onFraming({ ratio: e.target.value as ShotPreset["ratio"] })}>{studioRatios.map((r) => <option key={r}>{r}</option>)}</select></label><label>空间留白<select value={p.framing.negativeSpace} onChange={(e) => p.onFraming({ negativeSpace: e.target.value as ShotPreset["negativeSpace"] })}><option value="none">无</option><option value="sky">大量天空</option><option value="foreground">大量前景</option><option value="side">侧方留白</option></select></label></div>
      {([{ key: "focalLength", label: "焦距 / mm", min: 14, max: 200, step: 1 }, { key: "occupancy", label: "取景区域占比", min: .2, max: .95, step: .01 }, { key: "horizon", label: "地平线偏置", min: .1, max: .9, step: .01 }, { key: "offsetX", label: "水平偏移", min: -.45, max: .45, step: .01 }, { key: "offsetY", label: "垂直偏移", min: -.45, max: .45, step: .01 }] as const).map(({ key, label, ...range }) => <label className="studio-slider" key={key}><span>{label}<output>{p.framing[key]}</output></span><input type="range" {...range} value={p.framing[key]} onChange={(e) => p.onFraming({ [key]: Number(e.target.value) })} /></label>)}
      <div className="studio-checks">{(["safeFrame", "guides", "gridEnabled"] as const).map((key) => <label key={key}><input type="checkbox" checked={p.framing[key]} onChange={(e) => p.onFraming({ [key]: e.target.checked })} />{({ safeFrame: "安全框", guides: "三分参考线", gridEnabled: "透视网格" })[key]}</label>)}</div>
      <label>透视方式<select value={p.framing.gridMode} onChange={(e) => p.onFraming({ gridMode: e.target.value })}>{Object.entries({ ground: "地面", "one-point": "一点", "two-point": "两点", "three-point": "三点", off: "关闭" }).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <div className="studio-actions"><button className="primary" disabled={!p.ready} onClick={p.onAddShot}>保存为新镜头</button><button disabled={!p.currentShot || !p.ready} onClick={p.onUpdateShot}>更新当前镜头</button></div>
      <label>自定义景别名称<input value={presetName} placeholder="例如：低机位全身右构图" onChange={(e) => setPresetName(e.target.value)} maxLength={60} /></label>
      <button disabled={!presetName.trim() || !p.ready} onClick={() => { p.onSavePreset(presetName.trim()); setPresetName(""); }}>保存当前相机为预设</button>
      {p.presets.length > 0 && <label>已保存预设<select defaultValue="" onChange={(e) => { p.onPreset(e.target.value); e.target.value = ""; }}><option value="" disabled>选择并应用</option>{p.presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>}
    </div>}
    {section === "parse" && <div className="studio-section">
      <label>输入单镜头或时间分段提示词<textarea rows={7} value={prompt} onChange={(e) => setPrompt(e.target.value)} /></label>
      <button className="primary" disabled={!prompt.trim()} onClick={() => { const result = parseShotSequence(prompt, p.framing.ratio); setDrafts(result.drafts); setWarnings(result.warnings); setParsedText(prompt); }}>解析姿态与景别</button>
      <p className="studio-hint">本地规则解析 · 先检查并修改下方推荐，再确认生成。原有姿态匹配与人物／相机动画仍然生效。</p>
      {warnings.map((warning, i) => <p className="studio-warning" key={i}>{warning}</p>)}
      {drafts.map((draft, index) => <div className="studio-draft" key={index}><strong>Shot {String(index + 1).padStart(2, "0")} · {draft.start}–{draft.end}s</strong><p>{draft.promptText}</p><div className="studio-fields"><label>景别<select value={draft.shotPreset.size} onChange={(e) => patchDraft(index, { size: e.target.value as ShotPreset["size"] })}>{Object.entries(shotSizes).map(([id, name]) => <option key={id} value={id}>{id} · {name}</option>)}</select></label><label>机位<select value={draft.shotPreset.angle} onChange={(e) => patchDraft(index, { angle: e.target.value as ShotPreset["angle"] })}>{Object.entries(shotAngles).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>构图<select value={draft.shotPreset.composition} onChange={(e) => patchDraft(index, { composition: e.target.value as ShotPreset["composition"] })}>{Object.entries(compositions).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>画幅<select value={draft.shotPreset.ratio} onChange={(e) => patchDraft(index, { ratio: e.target.value as ShotPreset["ratio"] })}>{studioRatios.map((r) => <option key={r}>{r}</option>)}</select></label></div><small>{stageTypes[draft.stageType]} · {draft.poseHint.category} · 运镜 {draft.motion}{draft.shotPreset.negativeSpace === "sky" ? " · 大量天空留白" : ""}</small></div>)}
      {drafts.length > 0 && <button className="primary" disabled={!p.ready || parsedText !== prompt} onClick={() => p.onCreateShots(drafts)}>确认 {drafts.length} 个镜头并替换时间轴</button>}
      {parsedText && parsedText !== prompt && <p className="studio-warning">文字已修改，请重新解析。</p>}
    </div>}
    {section === "snapshot" && <div className="studio-section"><h3>当前镜头参考图</h3><p className="studio-hint">先选中或保存一个时间轴镜头。每种画幅的相机偏移独立保存；快照不会改变人物姿态。</p><div className="studio-actions">{Object.entries({ clean: "干净图", reference: "舞台参考图", "with-grid": "网格图", "safe-frame": "安全框图", annotated: "标注图" }).map(([id, label]) => <button key={id} disabled={!p.currentShot || !p.ready || p.exporting} onClick={() => p.onSnapshot(id as SnapshotMode)}>{label}</button>)}</div><label>切换导出画幅<select value={p.framing.ratio} onChange={(e) => p.onFraming({ ratio: e.target.value as ShotPreset["ratio"] })}>{studioRatios.map((r) => <option key={r}>{r}</option>)}</select></label></div>}
    {p.currentShot && <div className="studio-shot-summary"><strong>Shot {String(p.currentShot.index).padStart(2, "0")} · {p.currentShot.duration.toFixed(2)}s</strong><span>{p.currentShot.pose}</span><span>{p.currentShot.camera}</span><span>{p.currentShot.framing}</span>{p.currentShot.thumbnail ? <img src={p.currentShot.thumbnail} alt="当前镜头已保存快照" /> : <small>尚未保存快照</small>}</div>}
    <button className="studio-node-entry" onClick={p.onGraph}>打开节点视图 ↗</button>
  </div>;
}
