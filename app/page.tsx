"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, FluentProvider, SSRProvider, webLightTheme } from "@fluentui/react-components";
import { ArrowLeft, Plus, Folder, FilmStrip, PersonSimple, Camera, SquaresFour, List, Trash, DotsThree, UploadSimple } from "@phosphor-icons/react";
import { addProjectPage, assertProject, createProject, duplicateProject, latestCover, listProjects, migrateLegacy, pageKinds, portableProject, projectTemplates, removeProject, saveProject, type EditorBridge, type PageKind, type Project, type ProjectPage } from "./project-store";
const StudioEditor = lazy(() => import("./studio-editor"));
const icons = { stage: Camera, storyboard: SquaresFour, animation: FilmStrip, pose: PersonSimple };
function download(name: string, value: unknown) { const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function Cover({ project }: { project: Project }) { const image = latestCover(project); const Icon = icons[project.pages[0].kind]; return <div className={`project-cover template-${project.template}`}>{image ? <img src={image} alt={`${project.name}封面`} /> : <><Icon size={48} weight="light" /><span>{projectTemplates.find((t) => t.id === project.template)?.name ?? "创作项目"}</span></>}</div>; }
export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]), [ready, setReady] = useState(false), [error, setError] = useState("");
  const [active, setActive] = useState<{ project: Project; page: ProjectPage; bridge: EditorBridge } | null>(null);
  const activeRef = useRef(active);
  const [status, setStatus] = useState("已保存"), [busy, setBusy] = useState(false), [query, setQuery] = useState(""), [trash, setTrash] = useState(false), [list, setList] = useState(false);
  const [createOpen, setCreateOpen] = useState(false), [ratio, setRatio] = useState("9:16"), [addOpen, setAddOpen] = useState(false);
  const [edit, setEdit] = useState<{ title: string; value: string; done: (v: string) => Promise<void> } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null), dirty = useRef(0), saved = useRef(0), saving = useRef<Promise<void> | null>(null);
  const persistRef = useRef<() => Promise<void>>(async () => {});
  const busyRef = useRef(false);
  const dirtyChanged = () => { dirty.current++; setStatus("正在保存"); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { void persistRef.current().catch(() => {}); }, 500); };
  const persist = async () => {
    if (saving.current) return saving.current;
    const current = activeRef.current; if (!current) return;
    current.bridge.capture?.();
    if (saved.current === dirty.current) return;
    saving.current = (async () => {
      try {
        while (saved.current !== dirty.current) {
          const sequence = dirty.current, next = await saveProject(current.project);
          current.project.revision = next.revision; current.project.updatedAt = next.updatedAt; saved.current = sequence;
        }
        setStatus("已保存"); setError("");
      } catch (e) { setStatus("保存失败"); setError(e instanceof Error ? e.message : "本地保存失败，请重试或导出项目"); throw e; }
      finally { saving.current = null; }
    })();
    return saving.current;
  };
  useEffect(() => { persistRef.current = persist; });
  const flush = async () => { activeRef.current?.bridge.capture?.(); await persist(); };
  const run = async (fn: () => Promise<void>) => { if (busyRef.current) return; busyRef.current = true; setBusy(true); try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "操作失败，请重试"); } finally { busyRef.current = false; setBusy(false); } };
  const refresh = async () => setProjects(await listProjects());
  useEffect(() => { let cancelled = false; void (async () => { try { await migrateLegacy(localStorage); const all = await listProjects(); if (!cancelled) { setProjects(all); setRatio(localStorage.getItem("poseboard.last-project-ratio") === "16:9" ? "16:9" : "9:16"); setReady(true); } } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "无法打开本地项目存储"); } })(); return () => { cancelled = true; }; }, []);
  useEffect(() => {
    const before = (event: BeforeUnloadEvent) => { try { activeRef.current?.bridge.capture?.(); } catch { return; } if (dirty.current !== saved.current) { event.preventDefault(); event.returnValue = ""; void persistRef.current().catch(() => {}); } };
    const hidden = () => { if (document.visibilityState === "hidden") { try { activeRef.current?.bridge.capture?.(); } catch { return; } void persistRef.current().catch(() => {}); } };
    window.addEventListener("beforeunload", before); document.addEventListener("visibilitychange", hidden);
    return () => { window.removeEventListener("beforeunload", before); document.removeEventListener("visibilitychange", hidden); };
  }, []);
  const exportOne = async (project: Project) => { if (activeRef.current?.project.id === project.id) { try { activeRef.current.bridge.capture?.(); } catch { /* Export the retained raw content when restoring the editor failed. */ } } download(`${project.name}.poseboard.json`, await portableProject(project)); };
  const open = async (project: Project, pageId = project.lastPageId) => {
    await flush(); assertProject(project); if (project.deletedAt) throw new Error("请先从回收站恢复项目");
    const page = project.pages.find((p) => p.id === pageId)!; if (!page) throw new Error("页面不存在");
    const content = project.contents[page.contentId]; if (content.projectId !== project.id) throw new Error("内容所属项目不匹配");
    project.lastPageId = page.id; project.openedAt = Date.now();
    let capture: (() => void) | undefined;
    let loadError = "";
    const bridge: EditorBridge = {
      capture: () => { if (loadError) throw new Error(loadError); capture?.(); }, registerCapture: (fn) => { capture = fn; }, notifyDirty: dirtyChanged,
      reportLoadError: (message) => { loadError = message; setError(message); setStatus("保存失败"); },
      projectId: project.id, pageId: page.id, kind: page.kind, projectName: project.name, view: structuredClone(page.view), contentVersion: content.version ?? 0,
      getItem: (key) => key === "poseboard.workspace.v4" ? JSON.stringify({ ...page.view, projectName: project.name }) : content.local[key] ?? null,
      setItem: (key, value) => {
        if (activeRef.current?.bridge !== bridge || loadError) return;
        if (key === "poseboard.workspace.v4") { const prefs = JSON.parse(value); if (prefs.projectName && prefs.projectName !== project.name) project.name = prefs.projectName; const { projectName: _name, ...view } = prefs; void _name; page.view = { ...page.view, ...view }; }
        else { if (content.local[key] === value) return; content.local[key] = value; if (key === "poseboard.project.v3") content.version = (content.version ?? 0) + 1; }
        dirtyChanged();
      },
      setView: (view) => { const next = { ...view, contentVersion: content.version ?? 0 }; if (activeRef.current?.bridge !== bridge || JSON.stringify(next) === JSON.stringify(page.view)) return; page.view = next; if (view.ratio === "16:9" || view.ratio === "9:16") { setRatio(view.ratio); try { localStorage.setItem("poseboard.last-project-ratio", view.ratio); } catch { /* The project itself still saves through IndexedDB. */ } } dirtyChanged(); },
      exportProject: () => { void run(() => exportOne(project)); },
      rename: (name) => { project.name = name; dirtyChanged(); },
    };
    const next = { project, page, bridge }; activeRef.current = next; setActive(next); dirtyChanged();
    history.replaceState(null, "", `#project=${encodeURIComponent(project.id)}&page=${encodeURIComponent(page.id)}`);
  };
  useEffect(() => { if (!ready || activeRef.current) return; const params = new URLSearchParams(location.hash.slice(1)), id = params.get("project"); const project = projects.find((p) => p.id === id && !p.deletedAt); const timer = setTimeout(() => { if (project) void run(() => open(project, params.get("page") ?? project.lastPageId)); }, 0); return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  const home = async () => { await flush(); activeRef.current = null; setActive(null); history.replaceState(null, "", location.pathname); await refresh(); };
  const create = async (id: string) => { const p = await saveProject(createProject(id, ratio)); try { localStorage.setItem("poseboard.last-project-ratio", ratio); } catch { /* preference is optional */ } setCreateOpen(false); await open(p); };
  const mutate = async (project: Project, change: (p: Project) => void) => { await flush(); change(project); const next = await saveProject(project); project.revision = next.revision; project.updatedAt = next.updatedAt; if (activeRef.current) setActive({ ...activeRef.current }); await refresh(); };
  const add = async (kind: PageKind, independent = false) => { if (!active) return; await flush(); const page = addProjectPage(active.project, kind, active.page.id, independent); dirtyChanged(); await persist(); setAddOpen(false); await open(active.project, page.id); };
  const deletePage = async (page: ProjectPage) => {
    if (!active || active.project.pages.length <= 1) throw new Error("至少保留一个页面");
    if (!confirm(`删除“${page.name}”页面？仅移除页面入口，共享舞台、镜头和素材仍保留。`)) return;
    await flush(); const p = activeRef.current!.project; p.pages = p.pages.filter((v) => v.id !== page.id); if (p.lastPageId === page.id) p.lastPageId = p.pages[0].id; dirtyChanged(); await persist(); await open(p, p.lastPageId);
  };
  const importFile = async (file: File) => {
    if (file.size > 200 * 1024 * 1024) throw new Error("项目超过 200 MB，请拆分素材后重试");
    const value = JSON.parse(await file.text()); let project: Project;
    if (value.poseboardProjectFormat === 1) { assertProject(value.project); project = duplicateProject(value.project); project.name = value.project.name; }
    else if (value.studioVersion === "1.0" && value.currentScene?.editor) {
      project = createProject("story", value.currentScene.editor.ratio); project.name = value.name || "导入的项目";
      Object.values(project.contents)[0].local["poseboard.project.v3"] = JSON.stringify({ ...value, editor: value.currentScene.editor, selectedPoseId: value.currentScene.selectedPoseId });
    } else throw new Error("请选择 PoseBoard 项目文件");
    const portable = await portableProject(project); await saveProject(portable.project); await refresh();
  };
  const visible = projects.filter((p) => Boolean(p.deletedAt) === trash && p.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.updatedAt - a.updatedAt);
  const recent = !trash && !query && visible.length > 1 ? [...visible].sort((a, b) => b.openedAt - a.openedAt)[0] : undefined;
  // Fluent theme IDs are client-owned. Keep the initial server/client tree
  // deterministic, then mount the interactive library after IndexedDB opens.
  if (!ready) return <div className="project-provider"><main className="project-home"><header className="project-home-header"><Link href="/" className="project-logo"><span>P</span>PoseBoard</Link><button disabled>新建项目</button></header><div className="project-home-content"><div className="project-heading"><div><h1>项目工作台</h1><p>保存于此浏览器 · 定期导出项目，保留你的创作</p></div></div><section aria-label="快速开始"><h2>快速开始</h2><div className="project-templates">{projectTemplates.map((t) => <button disabled key={t.id}><strong>{t.name}</strong><span>{t.description}</span></button>)}</div></section>{error ? <div role="alert"><p>{error}</p><button onClick={() => location.reload()}>重试</button><button onClick={() => download("poseboard-legacy-backup.json", Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith("poseboard.") && !/access-key|etag/.test(k)).map((k) => [k, localStorage.getItem(k)])))}>导出本机备份</button></div> : <p role="status">正在读取本地项目…</p>}</div></main></div>;
  return <SSRProvider><FluentProvider theme={{ ...webLightTheme, colorBrandBackground: "#246bfd", colorBrandBackgroundHover: "#1759d8" }} applyStylesToPortals={false} className="project-provider">
    {error && <div className="project-error" role="alert"><span>{error}</span>{active ? <><button onClick={() => void run(flush)}>重试保存</button><button onClick={() => void run(() => exportOne(active.project))}>导出当前项目</button></> : <><button onClick={() => location.reload()}>重试</button><button onClick={() => download("poseboard-legacy-backup.json", Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith("poseboard.") && !/access-key|etag/.test(k)).map((k) => [k, localStorage.getItem(k)])))}>导出本机备份</button></>}<button aria-label="关闭提示" onClick={() => setError("")}>×</button></div>}
    {active ? <div className="project-workspace">
      <header className="project-workspace-header"><button onClick={() => void run(home)} disabled={busy}><ArrowLeft size={18} />项目首页</button><strong>{active.project.name}</strong><span>/ {active.page.name}</span><output className={status === "保存失败" ? "failed" : ""}>{status} · 保存于此浏览器</output><button onClick={() => void run(() => exportOne(active.project))}>导出项目</button></header>
      <nav className="project-pages" aria-label="项目页面"><div className="pages-title"><strong>页面</strong><button aria-label="添加页面" onClick={() => setAddOpen(true)}><Plus size={18} /></button></div>
        {active.project.pages.map((page, index) => { const Icon = icons[page.kind]; return <div key={page.id} className={`project-page-item ${page.id === active.page.id ? "selected" : ""}`}><button className="page-open" onClick={() => void run(() => open(active.project, page.id))} disabled={busy}><Icon size={18} /><span>{page.name}</span></button><details><summary aria-label={`${page.name}菜单`}><DotsThree size={18} /></summary><div className="project-menu"><button onClick={() => setEdit({ title: "重命名页面", value: page.name, done: (name) => mutate(active.project, () => { page.name = name; }) })}>重命名</button><button onClick={() => void run(async () => { await flush(); const added = addProjectPage(active.project, page.kind, page.id, true); dirtyChanged(); await persist(); await open(active.project, added.id); })}>复制为新方案</button><button disabled={!index} onClick={() => void run(() => mutate(active.project, (p) => { [p.pages[index - 1], p.pages[index]] = [p.pages[index], p.pages[index - 1]]; }))}>上移</button><button disabled={index === active.project.pages.length - 1} onClick={() => void run(() => mutate(active.project, (p) => { [p.pages[index + 1], p.pages[index]] = [p.pages[index], p.pages[index + 1]]; }))}>下移</button><button disabled={active.project.pages.length <= 1} onClick={() => void run(() => deletePage(page))}>删除页面</button></div></details></div>; })}
        <div className="page-content-reference"><span>当前内容</span><strong>{active.project.contents[active.page.contentId].name}</strong><small>{active.project.pages.filter((p) => p.contentId === active.page.contentId).length} 个页面共享此内容</small><button onClick={() => setAddOpen(true)}>在另一页面打开</button><button onClick={() => void run(() => add(active.page.kind, true))}>复制为新方案</button></div>
      </nav>
      <div className={`project-editor page-kind-${active.page.kind}`}><Suspense fallback={<div className="project-loading">正在打开编辑器…</div>}><StudioEditor key={`${active.project.id}:${active.page.id}`} bridge={active.bridge} /></Suspense></div>
    </div> : <main className="project-home">
      <header className="project-home-header"><Link href="/" className="project-logo"><span>P</span>PoseBoard</Link><label className="project-search">搜索项目<input placeholder="搜索项目名称" value={query} onChange={(e) => setQuery(e.target.value)} /></label><Button appearance="primary" icon={<Plus size={18} />} disabled={!ready} onClick={() => setCreateOpen(true)}>新建项目</Button></header>
      <div className="project-home-content"><div className="project-heading"><div><h1>项目工作台</h1><p>保存于此浏览器 · 定期导出项目，保留你的创作</p></div><label className="project-import"><UploadSimple size={18} />导入项目<input type="file" accept=".json" onChange={(e) => { const file = e.target.files?.[0]; if (file) void run(() => importFile(file)); e.target.value = ""; }} /></label></div>
      {!trash && !query && <section aria-label="快速开始"><h2>快速开始</h2><div className="project-templates">{projectTemplates.map((t) => { const Icon = icons[t.pages[0]]; return <button key={t.id} disabled={!ready} onClick={() => void run(() => create(t.id))}><Icon size={26} /><strong>{t.name}</strong><span>{t.description}</span></button>; })}</div></section>}
      {recent && <section className="project-resume"><div><span>继续创作</span><h2>{recent.name}</h2><p>{recent.pages.length} 个页面 · 上次打开 {new Date(recent.openedAt).toLocaleString("zh-CN")}</p></div><Button appearance="primary" onClick={() => void run(() => open(recent))}>继续编辑</Button><button onClick={() => setQuery(recent.name)}>管理项目</button></section>}
      <section><div className="project-section-heading"><div className="project-home-tabs"><button aria-pressed={!trash} onClick={() => setTrash(false)}>我的项目</button><button aria-pressed={trash} onClick={() => setTrash(true)}><Trash size={16} />回收站</button></div><div><button aria-label="网格视图" aria-pressed={!list} onClick={() => setList(false)}><SquaresFour size={20} /></button><button aria-label="列表视图" aria-pressed={list} onClick={() => setList(true)}><List size={20} /></button></div></div>
      {!ready ? <p className="project-empty">正在读取本地项目…</p> : !visible.length ? <div className="project-empty"><Folder size={36} /><h2>{query ? "没有匹配的项目" : trash ? "回收站为空" : "从第一个项目开始"}</h2><p>{query ? "试试其他名称" : trash ? "移入回收站的项目可以在这里恢复" : "选择一个模板，直接进入创作"}</p>{!query && !trash && <Button appearance="primary" onClick={() => setCreateOpen(true)}>新建项目</Button>}</div> : <div className={`project-grid ${list ? "as-list" : ""}`}>{visible.filter((p) => p.id !== recent?.id).map((project) => <article className="project-card" key={project.id}><button className="project-card-open" disabled={trash || busy} onClick={() => void run(() => open(project))}><Cover project={project} /><div><h3>{project.name}</h3><p>{projectTemplates.find((t) => t.id === project.template)?.name} · {project.pages.length} 个页面</p><time>{new Date(project.updatedAt).toLocaleString("zh-CN")}</time></div></button><details><summary aria-label={`${project.name}菜单`}><DotsThree size={22} /></summary><div className="project-menu">{trash ? <><button onClick={() => void run(() => mutate(project, (p) => { delete p.deletedAt; }))}>恢复项目</button><button onClick={() => void run(async () => { if (!confirm(`永久删除“${project.name}”？此操作无法恢复。`)) return; await removeProject(project); await refresh(); })}>永久删除</button></> : <><button onClick={() => setEdit({ title: "重命名项目", value: project.name, done: (name) => mutate(project, (p) => { p.name = name; }) })}>重命名</button><button onClick={() => void run(async () => { await saveProject(duplicateProject(project)); await refresh(); })}>复制项目</button><label>更换封面<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) void run(async () => { if (file.size > 5 * 1024 * 1024) throw new Error("封面请小于 5 MB"); const cover = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); }); await mutate(project, (p) => { p.cover = cover; }); }); }} /></label><button onClick={() => void run(() => exportOne(project))}>导出项目</button><button onClick={() => void run(() => mutate(project, (p) => { p.deletedAt = Date.now(); }))}>移入回收站</button></>}</div></details></article>)}</div>}</section></div>
    </main>}
    <Dialog open={createOpen} onOpenChange={(_, data) => setCreateOpen(data.open)}><DialogSurface><DialogBody><DialogTitle>选择项目模板</DialogTitle><DialogContent><div className="project-ratio"><button aria-pressed={ratio === "16:9"} onClick={() => setRatio("16:9")}>横版 16:9</button><button aria-pressed={ratio === "9:16"} onClick={() => setRatio("9:16")}>竖版 9:16</button></div><div className="project-template-picker">{projectTemplates.map((t) => <button key={t.id} disabled={busy} onClick={() => void run(() => create(t.id))}><strong>{t.name}</strong><span>{t.pages.map((p) => pageKinds[p]).join(" · ")}</span></button>)}</div></DialogContent><DialogActions><Button onClick={() => setCreateOpen(false)}>取消</Button></DialogActions></DialogBody></DialogSurface></Dialog>
    <Dialog open={addOpen} onOpenChange={(_, data) => setAddOpen(data.open)}><DialogSurface><DialogBody><DialogTitle>在另一页面打开当前内容</DialogTitle><DialogContent><p>新页面关联当前舞台与分镜。若要独立编辑，请在页面菜单中选择“复制为新方案”。</p><div className="project-template-picker">{Object.entries(pageKinds).map(([kind, name]) => <button key={kind} disabled={busy} onClick={() => void run(() => add(kind as PageKind))}>{name}</button>)}</div></DialogContent><DialogActions><Button onClick={() => setAddOpen(false)}>取消</Button></DialogActions></DialogBody></DialogSurface></Dialog>
    <Dialog open={!!edit} onOpenChange={(_, data) => { if (!data.open) setEdit(null); }}><DialogSurface><DialogBody><DialogTitle>{edit?.title}</DialogTitle><DialogContent><input className="project-name-input" aria-label="名称" maxLength={80} value={edit?.value ?? ""} onChange={(e) => setEdit(edit ? { ...edit, value: e.target.value } : null)} /></DialogContent><DialogActions><Button onClick={() => setEdit(null)}>取消</Button><Button appearance="primary" disabled={busy || !edit?.value.trim()} onClick={() => void run(async () => { if (!edit) return; await edit.done(edit.value.trim()); setEdit(null); })}>保存</Button></DialogActions></DialogBody></DialogSurface></Dialog>
  </FluentProvider></SSRProvider>;
}
