/** Project ownership and content references surround the existing editor format. */
export type PageKind = "stage" | "storyboard" | "animation" | "pose";
export type PageView = { contentVersion?: number; activeShotId?: string | null; camera?: unknown; ratio?: string; zoom?: number; playhead?: number; timelinePixelsPerSecond?: number; activeTool?: string; timelineOpen?: boolean; graphOpen?: boolean; contextPanelOpen?: boolean; cameraLocked?: boolean };
export type ProjectPage = { id: string; projectId: string; name: string; kind: PageKind; contentId: string; view: PageView };
export type ProjectContent = { id: string; projectId: string; name: string; version?: number; local: Record<string, string> };
export type Project = { format: 1; id: string; name: string; template: string; cover?: string; createdAt: number; updatedAt: number; openedAt: number; revision: number; deletedAt?: number; pages: ProjectPage[]; lastPageId: string; contents: Record<string, ProjectContent> };
export const pageKinds: Record<PageKind, string> = { stage: "舞台构图", storyboard: "分镜", animation: "动画时间轴", pose: "姿态编辑" };
export const projectTemplates = [
  { id: "framing", name: "景别与构图", description: "选用完整镜头，保存构图参考", pages: ["stage"] as PageKind[] },
  { id: "story", name: "剧情分镜", description: "构图、分镜、动画共用一组内容", pages: ["stage", "storyboard", "animation"] as PageKind[] },
  { id: "pose", name: "人物姿态", description: "选择姿态，微调人物，输出图片", pages: ["pose"] as PageKind[] },
  { id: "free", name: "自由项目", description: "从舞台开始，按需添加页面", pages: ["stage"] as PageKind[] },
];
export const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export function createProject(templateId: string, ratio = "9:16"): Project {
  const template = projectTemplates.find((t) => t.id === templateId) ?? projectTemplates[0];
  const id = uid("project"), contentId = uid("content"), now = Date.now();
  const pages = template.pages.map((kind) => ({ id: uid("page"), projectId: id, name: pageKinds[kind], kind, contentId, view: {} }));
  return { format: 1, id, name: `${template.name} ${new Date(now).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}`, template: template.id, createdAt: now, updatedAt: now, openedAt: now, revision: 0, pages, lastPageId: pages[0].id, contents: { [contentId]: { id: contentId, projectId: id, name: "主舞台与分镜", local: { "poseboard.project.v3": JSON.stringify({ editor: { ratio } }) } } } };
}
export function assertProject(project: Project) {
  if (project?.format !== 1 || typeof project.id !== "string" || typeof project.name !== "string" || !Array.isArray(project.pages) || !project.pages.length || project.pages.length > 100 || !project.contents || typeof project.contents !== "object") throw new Error("项目格式无效");
  const ids = new Set<string>();
  for (const page of project.pages) {
    if (!page.id || ids.has(page.id) || page.projectId !== project.id || !Object.hasOwn(pageKinds, page.kind) || !Object.hasOwn(project.contents, page.contentId) || typeof page.name !== "string" || !page.view) throw new Error("页面所属项目或内容引用无效");
    ids.add(page.id);
  }
  for (const [id, content] of Object.entries(project.contents)) {
    if (content.id !== id || content.projectId !== project.id || !content.local || typeof content.local !== "object") throw new Error("内容不属于当前项目");
    for (const [key, value] of Object.entries(content.local)) {
      if (!key.startsWith("poseboard.") || typeof value !== "string") throw new Error("项目内容格式无效");
      if (key === "poseboard.project.v3") JSON.parse(value);
    }
  }
  if (!ids.has(project.lastPageId)) throw new Error("上次页面引用无效");
}
// Only instance identifiers are remapped; built-in recipe/pose IDs remain shared.
export function cloneInstance<T>(value: T): T {
  const ids = new Map<string, string>();
  const collect = (v: unknown) => { if (!v || typeof v !== "object") return; for (const [k, x] of Object.entries(v)) { if (k === "id" && typeof x === "string") ids.set(x, uid("instance")); collect(x); } };
  collect(value);
  const rewrite = (v: unknown): unknown => typeof v === "string" ? ids.get(v) ?? v : Array.isArray(v) ? v.map(rewrite) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== "__proto__").map(([k, x]) => [ids.get(k) ?? k, rewrite(x)])) : v;
  return rewrite(value) as T;
}
function cloneContent(source: ProjectContent, projectId: string, views: PageView[] = []): { content: ProjectContent; views: PageView[] } {
  const parsed = Object.fromEntries(Object.entries(source.local).filter(([k]) => !/access-key|etag/.test(k)).map(([k, v]) => { try { return [k, JSON.parse(v)]; } catch { return [k, v]; } }));
  const remapped = cloneInstance({ local: parsed, views });
  return { content: { id: uid("content"), projectId, version: source.version ?? 0, name: `${source.name} · 新方案`, local: Object.fromEntries(Object.entries(remapped.local).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)])) }, views: remapped.views };
}
export function duplicateProject(source: Project): Project {
  assertProject(source);
  const p = structuredClone(source), id = uid("project"), refs = new Map<string, string>();
  const views = new Map<string, PageView>();
  p.contents = Object.fromEntries(Object.values(source.contents).map((c) => { const pages = source.pages.filter((page) => page.contentId === c.id); const copied = cloneContent(c, id, pages.map((page) => page.view)), next = copied.content; pages.forEach((page, index) => views.set(page.id, copied.views[index])); refs.set(c.id, next.id); return [next.id, next]; }));
  p.pages = source.pages.map((page) => ({ ...page, id: uid("page"), projectId: id, contentId: refs.get(page.contentId)!, view: views.get(page.id) ?? {} }));
  return { ...p, id, name: `${source.name} · 副本`, revision: 0, deletedAt: undefined, createdAt: Date.now(), updatedAt: Date.now(), openedAt: Date.now(), lastPageId: p.pages[Math.max(0, source.pages.findIndex((v) => v.id === source.lastPageId))].id };
}
export function addProjectPage(project: Project, kind: PageKind, sourcePageId: string, independent = false) {
  assertProject(project);
  const source = project.pages.find((p) => p.id === sourcePageId);
  if (!source) throw new Error("未找到源页面");
  let contentId = source.contentId;
  let view: PageView = {};
  if (independent) { const copied = cloneContent(project.contents[contentId], project.id, [source.view]), content = copied.content; project.contents[content.id] = content; contentId = content.id; view = copied.views[0]; }
  const page: ProjectPage = { id: uid("page"), projectId: project.id, kind, name: independent ? `${source.name} · 新方案` : pageKinds[kind], contentId, view };
  project.pages.push(page); return page;
}
export type EditorBridge = {
  projectId: string; pageId: string; kind: PageKind; projectName: string; view: PageView; contentVersion: number;
  getItem: (key: string) => string | null; setItem: (key: string, value: string) => void;
  capture?: () => void; registerCapture: (capture?: () => void) => void; notifyDirty: () => void; reportLoadError: (message: string) => void; exportProject: () => void; rename: (name: string) => void;
  setView: (view: PageView) => void;
};
let database: Promise<IDBDatabase> | undefined;
function db() {
  return database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("poseboard-projects", 1);
    request.onupgradeneeded = () => { for (const store of ["projects", "meta", "backups"]) request.result.createObjectStore(store); };
    request.onsuccess = () => resolve(request.result); request.onerror = () => { database = undefined; reject(request.error); };
  });
}
const result = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
const complete = (tx: IDBTransaction) => new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error ?? new Error("本地保存失败")); });
export async function listProjects() { return result<Project[]>((await db()).transaction("projects").objectStore("projects").getAll()); }
export async function saveProject(project: Project) {
  assertProject(project);
  const tx = (await db()).transaction("projects", "readwrite"), done = complete(tx), store = tx.objectStore("projects");
  const old = await result<Project | undefined>(store.get(project.id));
  if ((old?.revision ?? 0) !== project.revision) { tx.abort(); await done.catch(() => {}); throw new Error("项目已在另一窗口更新。请先导出当前修改，再重新打开项目。"); }
  const next = { ...structuredClone(project), updatedAt: Date.now(), revision: project.revision + 1 };
  store.put(next, next.id); await done; return next;
}
export async function removeProject(project: Project) {
  if (!project.deletedAt) throw new Error("请先将项目移入回收站");
  const tx = (await db()).transaction("projects", "readwrite"), done = complete(tx), store = tx.objectStore("projects");
  const old = await result<Project | undefined>(store.get(project.id));
  if (!old?.deletedAt || old.revision !== project.revision) { tx.abort(); await done.catch(() => {}); throw new Error("项目状态已变化，请刷新回收站"); }
  store.delete(project.id); await done;
}
export async function migrateLegacy(storage: Pick<Storage, "getItem">) {
  const database = await db();
  if (await result(database.transaction("meta").objectStore("meta").get("migration-v1"))) return;
  const keys = ["poseboard.project.v3", "poseboard.project.v2", "poseboard.workspace.v4", "poseboard.savedPoses.v1", "poseboard.favoriteIds", "poseboard.recentIds", "poseboard.lastSelectedId", "poseboard.studio.access-key", "poseboard.studio.etag"];
  const local = Object.fromEntries(keys.map((k) => [k, storage.getItem(k)]).filter((entry): entry is [string, string] => entry[1] !== null));
  const raw = local["poseboard.project.v3"] ?? local["poseboard.project.v2"];
  let project: Project | undefined;
  if (Object.keys(local).length) {
    const value = raw ? JSON.parse(raw) : {};
    if (!value || typeof value !== "object") throw new Error("旧项目无法读取，原始数据未改动，请先导出备份");
    project = createProject(value.videoTimeline?.shots?.length ? "story" : "pose"); project.name = "原有项目";
    Object.values(project.contents)[0].local = local;
  }
  const tx = database.transaction(["meta", "projects", "backups"], "readwrite"), done = complete(tx);
  const already = await result(tx.objectStore("meta").get("migration-v1"));
  if (!already) { tx.objectStore("backups").put(local, "legacy-v1"); if (project) tx.objectStore("projects").put(project, project.id); tx.objectStore("meta").put({ at: Date.now(), projectId: project?.id }, "migration-v1"); }
  await done;
}
export function latestCover(project: Project): string | undefined {
  if (project.cover) return project.cover;
  let latest = "", captured = -1;
  for (const c of Object.values(project.contents)) { try { const data = JSON.parse(c.local["poseboard.project.v3"] ?? "{}"); for (const shot of data.videoTimeline?.shots ?? []) { for (const value of Object.values(shot.snapshots ?? {}) as { thumbnail?: string; capturedAt?: number }[]) { if (value?.thumbnail && (value.capturedAt ?? 0) > captured) { latest = value.thumbnail; captured = value.capturedAt ?? 0; } } } } catch { /* Keep a usable template cover. */ } }
  return latest || undefined;
}
export async function portableProject(source: Project) {
  const project = structuredClone(source);
  const convert = async (v: unknown): Promise<unknown> => {
    if (typeof v === "string" && /^(blob:|https?:\/\/)/.test(v)) {
      const response = await fetch(v); if (!response.ok) throw new Error("素材无法读取，导出已停止。请重新上传该素材。");
      const blob = await response.blob(); if (!blob.type.startsWith("image/")) throw new Error("项目素材不是可恢复的图片");
      return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
    }
    if (Array.isArray(v)) return Promise.all(v.map(convert));
    if (v && typeof v === "object") return Object.fromEntries(await Promise.all(Object.entries(v).map(async ([k, x]) => [k, await convert(x)])));
    return v;
  };
  if (project.cover) project.cover = await convert(project.cover) as string;
  for (const content of Object.values(project.contents)) for (const [key, text] of Object.entries(content.local)) {
    if (/access-key|etag/.test(key)) { delete content.local[key]; continue; }
    let parsed: unknown; try { parsed = JSON.parse(text); } catch { continue; }
    content.local[key] = JSON.stringify(await convert(parsed));
  }
  return { poseboardProjectFormat: 1, project };
}
