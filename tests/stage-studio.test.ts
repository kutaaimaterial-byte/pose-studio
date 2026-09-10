import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { cameraForShot, createStageEnvironment, disposeStageEnvironment } from "../app/stage-scene";
import { connectNodes, defaultShotPreset, defaultStage, framingGeometry, normalizeShotPreset, parseShotPrompt, parseShotSequence, shotSizes, shotSnapshotFilename, stageTypes, type StudioGraph } from "../app/stage-studio";
import { normalizeVideoTimeline, parseTimelinePrompt } from "../app/video-timeline";
import { handleStudioProject, type ProjectBucket } from "../worker/studio-project";

test("acceptance: full-body low angle retains BOTH right composition and sky negative space", () => {
  const draft = parseShotPrompt("一个角色低机位全身站立，位于画面右侧，大量天空留白。");
  assert.equal(draft.shotPreset.size, "FS"); assert.equal(draft.shotPreset.angle, "low");
  assert.equal(draft.shotPreset.composition, "right"); assert.equal(draft.shotPreset.negativeSpace, "sky");
  assert.equal(draft.poseHint.category, "standing");
  const spec = cameraForShot(draft.shotPreset, [0, 0, 0], 100);
  const camera = new THREE.PerspectiveCamera(); camera.aspect = 9 / 16; camera.setFocalLength(spec.focalLength);
  camera.position.set(...spec.position); camera.up.set(...spec.up); camera.lookAt(new THREE.Vector3(...spec.target)); camera.updateMatrixWorld();
  const center = new THREE.Vector3(0, 1.725, 0).project(camera);
  assert.ok(center.x > .2 && center.x < .9, `subject right: ${center.x}`);
  assert.ok(center.y < -.1, `sky above subject: ${center.y}`);
  assert.ok(spec.position[1] < spec.target[1], "camera below lookAt");
});

test("all eight sizes have progressively wider framing, independent of actor transform", () => {
  let previous = 0;
  const actor: [number, number, number] = [2, 0, -1]; const before = [...actor];
  for (const size of Object.keys(shotSizes) as (keyof typeof shotSizes)[]) {
    const p = { ...defaultShotPreset, size }; const g = framingGeometry(p);
    assert.ok(g.distance > previous); previous = g.distance;
    const spec = cameraForShot(p, actor, 100); assert.ok(spec.position.every(Number.isFinite));
  }
  assert.deepEqual(actor, before);
  for (const ratio of ["9:16", "16:9"] as const) assert.ok(cameraForShot({ ...defaultShotPreset, ratio }, actor, 100).position.every(Number.isFinite));
});

test("three timed descriptions become isolated, editable structured shots", () => {
  const parsed = parseShotSequence("0-2秒：角色中景站立，平视镜头。\n2-4秒：切换近景，角色回头。\n4-6秒：低机位全身，角色向前冲刺。");
  assert.equal(parsed.drafts.length, 3);
  assert.deepEqual(parsed.drafts.map((d) => [d.start, d.end, d.shotPreset.size]), [[0, 2, "MS"], [2, 4, "MCU"], [4, 6, "FS"]]);
  assert.equal(parsed.drafts[2].poseHint.category, "running");
  parsed.drafts[0].shotPreset.composition = "left"; assert.equal(parsed.drafts[1].shotPreset.composition, "center");
  assert.equal(parseShotSequence("一个武士站在屋顶上，低机位仰拍，全身，人物位于画面中央，背景有天空。").drafts[0].stageType, "rooftop");
  assert.equal(parseShotSequence("").drafts.length, 0);
  assert.ok(parseShotSequence("0-3秒：站立\n2-4秒：行走").warnings.length > 0);
});

test("shot preset guards finite camera parameters and all stages produce disposable geometry", () => {
  const preset = normalizeShotPreset({ focalLength: NaN, occupancy: 100, offsetX: -100 });
  assert.equal(preset.focalLength, 50); assert.equal(preset.occupancy, .95); assert.equal(preset.offsetX, -.45);
  for (const type of Object.keys(stageTypes) as (keyof typeof stageTypes)[]) {
    const group = createStageEnvironment({ ...defaultStage, type });
    if (type !== "blank") assert.ok(group.children.length > 0);
    disposeStageEnvironment(group);
  }
});

test("aspect snapshots and per-format references survive timeline serialization", () => {
  const timeline = parseTimelinePrompt("0-3秒：站立").timeline;
  timeline.shots[0].sceneSnapshot = { shotPreset: { ...defaultShotPreset }, stage: { ...defaultStage } };
  timeline.shots[0].aspectOverrides = { "9:16": { ratio: "9:16", updatedAt: 1, snapshot: { offsetX: .2 } }, "16:9": { ratio: "16:9", updatedAt: 2, snapshot: { offsetX: -.2 } } };
  timeline.shots[0].snapshots = { "9:16:clean": { thumbnail: "data:image/jpeg;base64,abc", filename: "Demo_Shot01_FS_9x16.png", capturedAt: 1 } };
  const restored = normalizeVideoTimeline(JSON.parse(JSON.stringify(timeline)));
  assert.deepEqual(restored.shots[0].aspectOverrides, timeline.shots[0].aspectOverrides);
  assert.deepEqual(restored.shots[0].sceneSnapshot, timeline.shots[0].sceneSnapshot);
  assert.deepEqual(restored.shots[0].snapshots, timeline.shots[0].snapshots);
  assert.equal(shotSnapshotFilename("Demo", 1, { ...defaultShotPreset, size: "MS" }), "Demo_Shot01_MS_9x16.png");
});

test("graph connections reject cycles, missing nodes and duplicate edges", () => {
  const graph: StudioGraph = { nodes: [{ id: "a", kind: "prompt", x: 0, y: 0 }, { id: "b", kind: "parse", x: 250, y: 0 }], edges: [] };
  const connected = connectNodes(graph, "a", "b"); assert.equal(connected.edges.length, 1);
  assert.equal(connectNodes(connected, "b", "a"), connected);
  assert.equal(connectNodes(connected, "a", "b"), connected);
  assert.equal(connectNodes(connected, "a", "missing"), connected);
  assert.deepEqual(JSON.parse(JSON.stringify(connected)), connected);
});

test("private project storage denies missing capability, isolates keys and prevents stale overwrite", async () => {
  const objects = new Map<string, { value: string; etag: string }>();
  const bucket: ProjectBucket = {
    async get(key) { const o = objects.get(key); return o ? { body: new Blob([o.value]).stream(), httpEtag: o.etag } : null; },
    async put(key, value, options) { const old = objects.get(key); if (options?.onlyIf?.etagDoesNotMatch === "*" && old) return null; if (options?.onlyIf?.etagMatches && options.onlyIf.etagMatches !== old?.etag) return null; const etag = `"${objects.size + value.length}"`; objects.set(key, { value, etag }); return { httpEtag: etag }; },
  };
  const url = "https://example.com/api/studio-project";
  assert.equal((await handleStudioProject(new Request(url), bucket)).status, 401);
  const headers = { authorization: `Bearer ${"a".repeat(64)}`, "content-type": "application/json" };
  const body = JSON.stringify({ studioVersion: "1.0", currentScene: { editor: {} }, stageRecords: [], studioGraph: { nodes: [] } });
  const saved = await handleStudioProject(new Request(url, { method: "PUT", headers, body }), bucket); assert.equal(saved.status, 200);
  assert.ok(![...objects.keys()][0].includes("a".repeat(64)));
  const loaded = await handleStudioProject(new Request(url, { headers }), bucket); assert.equal(loaded.status, 200); assert.equal(await loaded.text(), body);
  assert.equal((await handleStudioProject(new Request(url, { headers: { authorization: `Bearer ${"b".repeat(64)}` } }), bucket)).status, 404);
  assert.equal((await handleStudioProject(new Request(url, { method: "PUT", headers, body }), bucket)).status, 409);
  assert.equal((await handleStudioProject(new Request(url, { method: "PUT", headers: { ...headers, "if-match": saved.headers.get("etag")! }, body }), bucket)).status, 200);
  assert.equal((await handleStudioProject(new Request(url, { headers: { ...headers, origin: "https://evil.example" } }), bucket)).status, 403);
});
