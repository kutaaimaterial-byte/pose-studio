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
  assert.match(html, />3D STUDIO<\/span>/);
  assert.match(html, /姿势预设库/);
  assert.match(html, /152<!-- --> poses/);
  assert.match(html, /aria-label="Pose Library"/);
  assert.match(html, /aria-label="Inspector"/);
  assert.match(html, /aria-label="模型编辑模式"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the premium white-first design system responsive and restrained", async () => {
  const [css, page, layout] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(css, /--surface:\s*#ffffff/);
  assert.match(css, /--accent:\s*#246bfd/);
  assert.match(css, /\.workspace\s*\{[^}]*grid-template-columns:/s);
  assert.match(css, /\.canvas-area\s*\{[^}]*border-radius:\s*18px/s);
  assert.match(css, /@media \(max-width:\s*1080px\)/);
  assert.match(css, /@media \(max-width:\s*620px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /linear-gradient|#725cf6|#5a46de/i);
  assert.doesNotMatch(`${page}\n${layout}`, /[—–]/);
  assert.match(page, /className="brand-edition">3D STUDIO/);
  assert.match(layout, /AI Character Studio \| PoseBoard 3D Studio/);
});
