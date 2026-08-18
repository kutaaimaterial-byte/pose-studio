import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

test("server-renders the PoseBoard studio shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>AI Character Studio \| PoseBoard 3D Studio<\/title>/i);
  assert.match(html, /class="editor-app/);
  assert.match(html, />PoseBoard<\/span>/);
  assert.match(html, />V1\.0\.3<\/span>/);
  assert.match(html, />Pose Library<\/h2>/);
  assert.match(html, /152<!-- --> poses/);
  assert.match(html, /aria-label="Pose Library"/);
  assert.match(html, /aria-label="Workspace tools"/);
  assert.match(html, /class="tool-rail"/);
  assert.match(html, /class="context-action-bar"/);
  assert.match(html, /aria-label="Project name"/);
  assert.match(html, />Export<\/button>/);
  assert.match(html, /class="language-switch" role="group" aria-label="Language"/);
  assert.match(html, /aria-pressed="true">EN<\/button>/);
  assert.match(html, /aria-pressed="false">中文<\/button>/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the V4 single-panel workstation responsive and restrained", async () => {
  const [css, page, layout] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(css, /--surface-primary:\s*#ffffff/);
  assert.match(css, /--primary:\s*#2684ff/);
  assert.match(css, /--context-panel:\s*380px/);
  assert.match(css, /\.workspace\s*\{[^}]*grid-template-areas:\s*"rail canvas panel"/s);
  assert.match(css, /\.panel-collapsed \.workspace\s*\{[^}]*"rail canvas"/s);
  assert.match(css, /\.context-panel\s*\{[^}]*border-left:\s*1px solid/s);
  assert.match(css, /\.context-panel, \.panel-collapsed \.context-panel\s*\{[^}]*right:\s*8px;[^}]*left:\s*auto;[^}]*translateX\(calc\(100% \+ 20px\)\)/s);
  assert.match(css, /\.category-list\s*\{[^}]*flex-wrap:\s*wrap;[^}]*overflow:\s*visible/s);
  assert.match(css, /\.quick-entry\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.prompt-context-content \.platform-tabs\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.lighting-presets\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /\.tool-rail\s*\{/);
  assert.match(css, /\.context-action-bar\s*\{/);
  assert.match(css, /@media \(max-width:\s*1023px\)/);
  assert.match(css, /@media \(max-width:\s*720px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /linear-gradient|#725cf6|#5a46de/i);
  assert.doesNotMatch(`${page}\n${layout}`, /[—–]/);
  assert.match(page, /className="brand-edition">V1\.0\.3/);
  assert.match(page, /useState<ActiveTool>\("pose"\)/);
  assert.match(page, /useState<InteractionMode>\("camera-browse"\)/);
  assert.match(page, /interactionModeRef\.current === "camera-browse" && !cameraLockedRef\.current/);
  assert.match(page, /const syncTransformController = \(mode: "translate" \| "rotate"/);
  assert.match(page, /transformControls\.attach\(root\)/);
  assert.match(page, /if \(tool === "model"\) \{\s*activateTool\(toolMode === "rotate" \? "rotate" : "translate"\)/s);
  assert.match(page, /syncTransformController\(nextMode, nextRoot\)/);
  assert.match(page, /camera\.near = 0\.02/);
  assert.match(page, /findOpenModelPosition/);
  assert.doesNotMatch(page, /controlsRef\.current\.enabled = true/);
  assert.match(page, /useState<Language>\("en"\)/);
  assert.match(layout, /AI Character Studio \| PoseBoard 3D Studio/);
});
