import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { transpileModule, ScriptTarget } from "typescript";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("rig snapshots retain independent rotations, bone positions and root positions", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const start = page.indexOf("  const captureRigPoseState = ");
  const end = page.indexOf("  const capturePoseRigState = ", start);
  assert.ok(start >= 0 && end > start);
  const { outputText } = transpileModule(page.slice(start, end), { compilerOptions: { target: ScriptTarget.ES2022 } });
  const capture = new Function(`${outputText}; return captureRigPoseState;`)();
  const bone = { quaternion: { x: 0, y: 0, z: 0, w: 1 }, position: { x: 1, y: 2, z: 3 } };
  const root = { position: { x: 4, y: 5, z: 6 } };
  const snapshot = capture({ bonesByName: new Map([["hips", bone]]), root });
  assert.deepEqual(snapshot, { bones: { hips: [0, 0, 0, 1] }, bonePositions: { hips: [1, 2, 3] }, rigPosition: [4, 5, 6] });
  bone.position.x = 9;
  root.position.x = 10;
  snapshot.bones.hips[0] = 0.5;
  assert.equal(snapshot.bonePositions.hips[0], 1);
  assert.equal(snapshot.rigPosition[0], 4);
  assert.equal(bone.quaternion.x, 0);
});

test("server-renders the PoseBoard studio shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>AI Character Studio \| PoseBoard 3D Studio<\/title>/i);
  assert.match(html, /class="editor-app/);
  assert.match(html, /class="intro-loader/);
  assert.match(html, />正在准备 3D 工作区<\/p>/);
  assert.match(html, />PoseBoard<\/span>/);
  assert.doesNotMatch(html, />V1\.0\.3<\/span>/);
  assert.match(html, />姿势库<\/h2>/);
  assert.match(html, /152 个姿势/);
  assert.match(html, /aria-label="Pose Library"/);
  assert.match(html, /aria-label="Workspace tools"/);
  assert.match(html, /class="tool-rail"/);
  assert.match(html, /class="context-action-bar"/);
  assert.match(html, /aria-label="项目名称"/);
  assert.match(html, /class="export-button-label">导出<\/span>/);
  assert.match(html, /class="language-switch" role="group" aria-label="语言"/);
  assert.match(html, /video-timeline-button/);
  assert.match(html, />时间轴<\/span>/);
  assert.match(html, /aria-pressed="false">EN<\/button>/);
  assert.match(html, /aria-pressed="true">中文<\/button>/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the Precision Light workstation responsive and restrained", async () => {
  const [css, precisionCss, page, layout, workspaceUi, timelinePanel] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/precision-light.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/workspace-ui.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/video-timeline-panel.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(css, /--surface-primary:\s*#ffffff/);
  assert.match(css, /\.intro-loader\s*\{[^}]*position:\s*fixed;[^}]*background:\s*#fff;/s);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\.intro-loader/s);
  assert.match(page, /const \[introPhase, setIntroPhase\] = useState<"loading" \| "leaving" \| "hidden">\("loading"\)/);
  assert.match(page, /if \(!modelInfo\.loaded && !modelInfo\.label\.includes\("失败"\)\) return;/);
  assert.match(css, /\.timeline-workspace \{[^}]*grid-template-columns:\s*224px minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*?\.timeline-workspace \{[^}]*grid-template-columns:\s*212px minmax\(0, 1fr\)/);
  assert.match(css, /--primary:\s*#2684ff/);
  assert.match(css, /--context-panel:\s*380px/);
  assert.match(css, /\.workspace\s*\{[^}]*grid-template-areas:\s*"rail canvas panel"/s);
  assert.match(css, /\.workspace\s*\{[^}]*grid-template-columns:\s*var\(--toolrail-w\)[^}]*transition:\s*none/s);
  assert.match(css, /\.panel-collapsed \.workspace\s*\{[^}]*"rail canvas"/s);
  assert.match(css, /\.context-panel\s*\{[^}]*border-left:\s*1px solid/s);
  assert.match(css, /\.context-panel, \.panel-collapsed \.context-panel\s*\{[^}]*right:\s*8px;[^}]*left:\s*auto;[^}]*translateX\(calc\(100% \+ 20px\)\)/s);
  assert.match(css, /\.category-list\s*\{[^}]*flex-wrap:\s*wrap;[^}]*overflow:\s*visible/s);
  assert.match(css, /\.quick-entry\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.prompt-context-content \.platform-tabs\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.lighting-presets\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /\.tool-rail\s*\{/);
  assert.match(css, /\.tool-rail button\.active::before\s*\{\s*display:\s*none;\s*\}/);
  assert.match(css, /\.toggle\s*\{[^}]*width:\s*40px;[^}]*height:\s*24px;[^}]*border-radius:\s*var\(--radius-full\)/s);
  assert.match(css, /\.toggle i\s*\{[^}]*width:\s*18px;[^}]*height:\s*18px;[^}]*border-radius:\s*50%/s);
  assert.match(css, /\.context-action-bar\s*\{/);
  assert.match(css, /\.toolbar-center \.perspective-grid-button\s*\{[^}]*width:\s*auto;[^}]*min-width:\s*max-content/s);
  assert.match(css, /\.toolbar-right \.export-button\s*\{[^}]*width:\s*auto;[^}]*min-width:\s*92px/s);
  assert.match(css, /\.perspective-grid-label, \.export-button-label\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(css, /\.artboard-shell\s*\{[^}]*overflow:\s*visible/s);
  assert.match(css, /\.three-viewport\s*\{[^}]*overflow:\s*hidden;[^}]*contain:\s*layout paint/s);
  assert.match(css, /\.control-point-layer\s*\{[^}]*overflow:\s*visible;[^}]*transition:\s*none/s);
  assert.match(css, /\.offcanvas-transform-proxy\s*\{[^}]*display:\s*none;[^}]*position:\s*absolute;[^}]*z-index:\s*14/s);
  assert.match(css, /\.tool-pose \.inspector-panel\s*\{[^}]*display:\s*flex;[^}]*visibility:\s*hidden;[^}]*pointer-events:\s*none/s);
  assert.match(css, /\.editor-app:not\(\.tool-pose\) \.library-panel\s*\{[^}]*display:\s*grid;[^}]*visibility:\s*hidden;[^}]*pointer-events:\s*none/s);
  assert.match(css, /\.artboard-command-bar\s*\{[^}]*position:\s*absolute;[^}]*left:\s*50%;[^}]*top:\s*-92px;[^}]*translateX\(-50%\)/s);
  assert.match(css, /\.command-bar-divider\s*\{[^}]*width:\s*1px;[^}]*height:\s*22px/s);
  assert.match(css, /@media \(max-width:\s*1023px\)/);
  assert.match(css, /@media \(max-width:\s*720px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /linear-gradient|#725cf6|#5a46de/i);
  assert.doesNotMatch(`${page}\n${layout}`, /[—–]/);
  assert.doesNotMatch(page, /className="brand-edition"/);
  assert.doesNotMatch(page, /className="canvas-meta"/);
  assert.match(page, /className="canvas-project-name"/);
  assert.doesNotMatch(page, /className="project-identity"/);
  assert.match(page, /className=\{!quickView && category === item\.value \? "active" : ""\}/);
  assert.match(page, /<SSRProvider>/);
  assert.match(page, /<FluentProvider[^>]*applyStylesToPortals=\{false\}/);
  assert.doesNotMatch(page, /<Tooltip/);
  assert.match(page, /className="perspective-grid-label"/);
  assert.match(page, /className="export-button-label"/);
  assert.match(page, /useState<ActiveTool>\("pose"\)/);
  assert.match(page, /useState<ToolMode>\("pose"\)/);
  assert.match(page, /useState<InteractionMode>\("camera-browse"\)/);
  assert.match(precisionCss, /grid-template-areas:\s*"canvas panel"/s);
  assert.match(precisionCss, /\.tool-rail-list\s*\{[^}]*flex-direction:\s*row/s);
  assert.ok(page.indexOf("<ToolRail activeTool={activeTool}") < page.indexOf('<Toolbar className="toolbar-center"'));
  assert.match(page, /className="canvas-project-menu"/);
  assert.match(page, /className="context-panel-reopen"/);
  assert.match(page, /onClick=\{\(\) => setContextPanelOpen\(true\)\}/);
  assert.match(precisionCss, /\.context-panel-reopen\s*\{[^}]*position:\s*absolute/s);
  assert.match(precisionCss, /\.panel-collapsed \.topbar > \.tool-rail > \.tool-rail-collapse\s*\{[^}]*display:\s*none\s*!important/s);
  assert.match(precisionCss, /\.artboard-command-bar\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(precisionCss, /\.timeline-open \.workspace[\s\S]*"timeline timeline"/s);
  assert.match(page, /interactionModeRef\.current === "camera-browse" && !cameraLockedRef\.current/);
  assert.match(page, /const syncTransformController = \(mode: "translate" \| "rotate"/);
  assert.match(page, /transformControls\.attach\(root\)/);
  assert.match(page, /const activateCanvasMode = \(mode: ToolMode\)/);
  assert.match(page, /if \(width === renderedWidth && height === renderedHeight\) return;/);
  assert.match(page, /camera\.updateProjectionMatrix\(\);\s*renderer\.render\(scene, camera\);/s);
  assert.match(page, /const changeActiveTool = \(tool: ActiveTool\) => \{\s*setActiveTool\(tool\)/s);
  assert.match(page, /syncTransformController\(nextMode, nextRoot\)/);
  assert.match(page, /const beginOffCanvasModelDrag = \(event: React\.PointerEvent<HTMLButtonElement>\)/);
  assert.match(page, /const pointerId = event\.pointerId/);
  assert.match(page, /pointerEvent\.buttons !== 1/);
  assert.match(page, /proxy\.setPointerCapture\(pointerId\)/);
  assert.match(page, /proxy\.addEventListener\("lostpointercapture", handleLostPointerCapture\)/);
  assert.match(page, /className="offcanvas-transform-proxy"/);
  assert.match(page, /<div><strong>\{toolLabels\[activeTool\]\}<\/strong><\/div>/);
  assert.doesNotMatch(page, /<div><strong>\{toolLabels\[activeTool\]\}<\/strong><small>/);
  assert.match(page, /className="tool-dock artboard-command-bar"/);
  assert.match(page, /aria-label=\{text\("Canvas character and artboard controls", "画板人物与画板控制"\)/);
  assert.match(page, /onClick=\{redo\} disabled=\{!canRedo\}/);
  assert.doesNotMatch(page, /canvas-mode-switch/);
  assert.match(page, /const gizmoInside = projected\.z > -1 && projected\.z < 1/);
  assert.doesNotMatch(page, /activateTool\(/);
  assert.doesNotMatch(workspaceUi, /<Tooltip/);
  assert.match(workspaceUi, /<button\s+type="button"\s+key=\{tool\}/s);
  assert.match(workspaceUi, /export type ActiveTool = [^;]*\| "convert"/);
  assert.match(workspaceUi, /convert: CubeFocus/);
  assert.match(page, /\{ikControlDefinitions\.map\(\(\{ id: control, label, labelEn, kind, group \}\)/);
  assert.doesNotMatch(page, /ikControlDefinitions\.filter/);
  assert.match(page, /const IK_DRAG_SENSITIVITY = 100 \/ 60/);
  assert.match(page, /const IK_DRAG_FINE_SENSITIVITY = 10 \/ 60/);
  assert.match(page, /const ikEffectorDirectionControl: Partial<Record<IKControlId, IKControlId>>/);
  assert.match(page, /nextTargets\[linkedDirectionControl\] = \[directionTarget\.x, directionTarget\.y, directionTarget\.z\]/);
  assert.match(page, /currentPointerWorld\.clone\(\)\.sub\(startPointerWorld\)\.multiplyScalar\(sensitivity\)/);
  assert.match(page, /if \(stored\) return new THREE\.Vector3\(\.\.\.stored\)/);
  assert.match(page, /const handleDelta = new THREE\.Vector3\(\.\.\.target\)\.sub\(handlePosition\)/);
  assert.match(page, /id: "headPitch", label: "抬头\/低头"/);
  assert.match(page, /if \(targets\.headPitch\) applyHeadPitchTarget\(rig, targets\.headPitch\)/);
  assert.match(page, /setSelectedPoseId\(pose\.id\);\s*setToolMode\("pose"\);\s*setActiveTool\("pose"\);\s*setInteractionMode\("ik-edit"\)/s);
  assert.match(page, /camera\.near = 0\.02/);
  assert.match(page, /findOpenModelPosition/);
  assert.doesNotMatch(page, /controlsRef\.current\.enabled = true/);
  assert.match(page, /useRef<Language>\("zh"\)/);
  assert.match(page, /useState<Language>\("zh"\)/);
  assert.match(page, /parseTimelinePrompt\(timelinePrompt\)/);
  assert.match(page, /<VideoTimelinePanel/);
  assert.match(page, /convert: text\("2D to 3D", "平面转三维"\)/);
  assert.match(page, /activeTool === "convert" && <div className="convert-context-content">/);
  assert.doesNotMatch(page, /className="active-tool-card"/);
  assert.doesNotMatch(css, /\.active-tool-card/);
  assert.match(page, /<div className="result-line">\s*<strong>[^<]+<\/strong><span>· \{filteredPoses\.length\}<\/span>\s*<button className=\{`filter-bar-button/s);
  assert.match(css, /\.result-line \.filter-bar-button\s*\{[^}]*margin-left:\s*auto;/s);
  assert.match(css, /--surface-search:\s*#eef5f4/);
  assert.match(css, /\.search-field\s*\{[^}]*background:\s*var\(--surface-search\)/s);
  assert.match(css, /\.search-field:hover\s*\{[^}]*background:\s*var\(--surface-search-hover\)/s);
  assert.match(css, /\.search-field:focus-within\s*\{[^}]*background:\s*var\(--surface-search-focus\)/s);
  assert.match(page, /description:\s*"自然压缩，突出人物轮廓"/);
  assert.match(page, /aria-pressed=\{editor\.cameraPreset === id\}/);
  assert.match(page, /className="camera-preset-description"/);
  assert.match(page, /className="camera-preset-tags"/);
  assert.match(page, /className="camera-focal-scale" aria-hidden="true"/);
  assert.match(page, /<PersonSimple size=\{18\} weight=\{selected \? "fill" : "regular"\} \/>/);
  assert.doesNotMatch(page, /<Cube size=\{16\} weight=\{selected \? "fill" : "regular"\} \/>/);
  assert.match(css, /\.camera-presets button\s*\{[^}]*min-height:\s*104px;[^}]*grid-template-rows:\s*auto 18px;/s);
  assert.match(css, /\.camera-focal-scale::before\s*\{[^}]*background:\s*var\(--border-strong\)/s);
  assert.match(css, /\.convert-flow\s*\{[^}]*min-height:\s*116px;[^}]*border:\s*1px solid var\(--border-default\)/s);
  assert.match(page, /className=\{`icon-button topbar-quick-action \$\{promptOpen \? "active" : ""\}`\}/);
  assert.match(page, /aria-label=\{text\("Plan", "计划"\)\}/);
  assert.match(page, /const \[poseControlsVisible, setPoseControlsVisible\] = useState\(true\)/);
  assert.match(page, /const contextVisibilityAvailable = activeTool === "model" \|\| activeTool === "perspective" \|\| activeTool === "pose"/);
  assert.match(page, /const contextVisibilityVisible = activeTool === "model"[\s\S]*?editor\.perspectiveGrid\.mode !== "off"[\s\S]*?poseControlsVisible/);
  assert.match(page, /const toggleContextVisibility = \(\) => \{/);
  assert.match(page, /contextVisibilityAvailable && <button className=\{contextVisibilityVisible \? "visible" : ""\}/);
  assert.match(page, /interactionMode === "ik-edit" && poseControlsVisible && modelInfo\.hasSkeleton && editor\.visible/);
  assert.match(css, /\.selection-header\.without-visibility\s*\{[^}]*grid-template-columns:/s);
  assert.doesNotMatch(page, /aria-label=\{editor\.visible \? text\("Hide model"/);
  assert.match(css, /--motion-fast:\s*160ms/);
  assert.match(css, /@media \(hover: hover\)/);
  assert.match(css, /button:not\(:disabled\), \[role="button"\]:not\(\[aria-disabled="true"\]\)/);
  assert.match(css, /\.pose-card:focus-within \.pose-card-actions button/);
  assert.match(css, /@keyframes dialog-enter-refined/);
  assert.match(css, /@keyframes popover-enter/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?--motion-instant:\s*1ms/s);
  assert.doesNotMatch(css, /transition:\s*all/);
  assert.match(page, /const applySceneSnapshot = \(snapshotSource: ShotSceneSnapshot/);
  assert.match(page, /function keepModelInCameraFrame\(\s*root: THREE\.Group/s);
  assert.match(page, /const frameFill: Record<ShotSize, number> = \{ close: 2\.35, medium: 1\.35, full: 0\.86, long: 0\.46 \}/);
  assert.match(page, /const restoredEditor = selected\s*\? cloneState\(\{ \.\.\.snapshot\.editor, \.\.\.cloneModelEditState\(selected\.state\) \}\)/s);
  assert.match(page, /const snapshotRatio = currentRatioOverride\s*\? currentRatio\s*:\s*storedSnapshot\?\.editor\.ratio \?\? timelineLatestRef\.current\.masterAspect \?\? currentRatio;/s);
  assert.match(page, /storedSnapshot && !shot\.snapshotLocked && shot\.promptText\.trim\(\)\s*\? buildSnapshotForShotPrompt\(storedSnapshot, shot\.promptText, snapshotRatio\)/s);
  assert.match(page, /applyTimelineShot\(shot, true\);\s*\/\/ Restore the persisted active shot once the asynchronous 3D model is ready\./s);
  assert.match(page, /setTimelinePlayhead\(0\);\s*applyTimelineShot\(shots\[0\], true\);/s);
  assert.match(page, /const persistTimelineShotScene = \(shotId: string, includeThumbnail = false\) => \{/);
  assert.match(page, /activeShotIdRef\.current !== shotId/);
  assert.match(page, /const persistActiveTimelineShotScene = \(includeThumbnail = false\) => \{/);
  assert.match(page, /includeThumbnail \? capturePoseThumbnail\(rendererRef\.current\?\.domElement\) : ""/);
  assert.match(page, /A captured scene is authoritative[\s\S]*snapshotLocked: true,[\s\S]*dirty: false/);
  assert.match(page, /const outgoingShotId = activeShotIdRef\.current;\s*const isCurrentShot = outgoingShotId === shot\.id;\s*if \(outgoingShotId\) persistTimelineShotScene\(outgoingShotId\);[\s\S]*if \(isCurrentShot\) return;/s);
  assert.match(page, /const selectedShot = timelineLatestRef\.current\.shots\.find\(\(shot\) => shot\.id === shotId\);[\s\S]*if \(activeShotIdRef\.current !== shotId\) selectTimelineShot\(selectedShot\);[\s\S]*const sourceTimeline = clonePoseBoardTimeline\(timelineLatestRef\.current\);/s);
  const timelineClipDragBlock = page.match(/const beginTimelineClipDrag = \([\s\S]*?const startX = event\.clientX;/)?.[0] ?? "";
  assert.doesNotMatch(timelineClipDragBlock, /setActiveShotId\(shotId\)/);
  assert.match(page, /if \(shot\) \{[\s\S]*if \(applyShot && shot\.id !== activeShotIdRef\.current\) applyTimelineShot\(target, true\);[\s\S]*applyAnimationAtTime\(target, value\);/s);
  assert.doesNotMatch(page, /if \(applyShot && shot\.id !== activeShotIdRef\.current\) persistActiveTimelineShotScene\(\);/s);
  assert.match(page, /onScrubStart=\{\(\) => persistActiveTimelineShotScene\(\)\}/);
  assert.match(page, /const scheduledShotId = activeShotIdRef\.current;\s*const saveTimer = window\.setTimeout\(\(\) => persistTimelineShotScene\(scheduledShotId\), 180\)/s);
  assert.match(page, /const baseSnapshot = captureSceneSnapshot\(\);[\s\S]*buildSnapshotForShotPrompt\(baseSnapshot, shot\.promptText, ratio\)/s);
  assert.doesNotMatch(page, /inheritedSnapshot/);
  assert.match(page, /buildSnapshotForShotPrompt\(baseSnapshot, shot\.promptText, ratio\);[\s\S]*snapshotLocked: true,/s);
  assert.match(page, /currentTimeline\.shots\.some\(\(shot\) => shot\.snapshotVersion < 2\)/);
  assert.match(page, /buildSnapshotForShotPrompt\(baseSnapshot, shot\.promptText, ratio\)/);
  assert.match(page, /snapshotLocked: true,\s*snapshotVersion: 2,\s*dirty: false/s);
  assert.match(page, /const snapshot = buildSnapshotForShotPrompt\(baseSnapshot, value, ratio\);[\s\S]*if \(activeShotIdRef\.current === shotId\) applySceneSnapshot\(snapshot, true\);/s);
  assert.match(page, /const toggleTimelinePlayback = \(\) =>/);
  assert.match(page, /const tick = \(\) => \{[\s\S]*?const clock = readPlaybackClock\(\);/s);
  assert.match(page, /timelineLatestRef\.current = \{ \.\.\.current, playhead: nextTime \};\s*setTimelinePlayhead\(nextTime\);/s);
  assert.match(page, /timelinePlaybackTimerRef\.current = window\.requestAnimationFrame\(tick\)/);
  assert.match(page, /window\.cancelAnimationFrame\(timelinePlaybackTimerRef\.current\)/);
  assert.match(page, /videoTimeline: \{ \.\.\.timelineLatestRef\.current/);
  assert.match(page, /animationTimeline: animationTimelineLatestRef\.current/);
  assert.match(page, /frames\.push\(frame\(`step_\$\{step\}`,[\s\S]*step % 2 === 1,[\s\S]*"linear"\)\)/s);
  assert.match(page, /if \(value\.pose\.rigPosition\) rig\.root\.position\.set/);
  assert.match(page, /motionRevision: 2/);
  assert.match(page, /motionId,\s*loop: motionId === "idle"/s);
  assert.match(page, /const buildCameraMotionFrames = \(/);
  assert.match(page, /track\.kind === "camera" \? \{ \.\.\.track, keyframes: cameraFrames \} : track/);
  assert.match(page, /track\.kind === "camera" \? track : \(\{ \.\.\.track, keyframes: \[\] \}\) as AnimationTrack/);
  assert.match(page, /animationShot\.shotId !== shot\.id \? animationShot : \{[\s\S]*?motionId,/s);
  assert.doesNotMatch(page, /motionId === "run" \? 3\.2 : 0/);
  assert.match(timelinePanel, /value=\{activeAnimationShot\?\.motionId \?\? ""\}/);
  assert.match(timelinePanel, /value=\{activeAnimationShot\?\.cameraMotionId \?\? ""\}/);
  assert.match(timelinePanel, /animationTimeline\.cameraMotionLibrary\.map/);
  assert.match(timelinePanel, /clipMotion\.name/);
  assert.match(timelinePanel, /ArrowsLeftRight size=\{18\}/);
  assert.match(timelinePanel, /requestAnimationFrame\(applyPendingScrub\)/);
  assert.match(timelinePanel, /const pointerOffset = event\.clientX - handle\.getBoundingClientRect\(\)\.left/);
  assert.match(timelinePanel, /handle\.style\.left = `\$\{timeFromClientX\(pendingClientX\) \* pixelsPerSecond\}px`/);
  assert.match(timelinePanel, /onScrub\(timeFromClientX\(pendingClientX\), true\)/);
  assert.match(timelinePanel, /Math\.ceil\(timeline\.duration \/ 2000 \/ baseStep\) \* baseStep/);
  assert.match(page, /target\.start = next\s*\? Math\.min\(proposedStart/);
  assert.match(page, /target\.end = next \? Math\.min\(proposedEnd, next\.start\) : proposedEnd/);
  assert.match(page, /current\.duration = Math\.max\(current\.duration, shots\.at\(-1\)\?\.end \?\? frame\)/);
  assert.doesNotMatch(timelinePanel, /\{text\("Ripple", "联动"\)\}|\{text\("Split", "切分"\)\}|\{text\("Delete", "删除"\)\}|\{text\("Fit", "适配"\)\}/);
  assert.match(layout, /AI Character Studio \| PoseBoard 3D Studio/);
});
