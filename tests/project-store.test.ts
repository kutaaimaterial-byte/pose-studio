import assert from "node:assert/strict";
import test from "node:test";
import { addProjectPage, assertProject, createProject, duplicateProject, latestCover } from "../app/project-store";

test("templates create real editors sharing a single owned content record", () => {
  const story = createProject("story", "16:9"); assertProject(story);
  assert.deepEqual(story.pages.map((p) => p.kind), ["stage", "storyboard", "animation"]);
  assert.equal(new Set(story.pages.map((p) => p.contentId)).size, 1);
  assert.equal(JSON.parse(Object.values(story.contents)[0].local["poseboard.project.v3"]).editor.ratio, "16:9");
  const pose = createProject("pose"); assert.equal(pose.pages.length, 1); assert.equal(pose.pages[0].kind, "pose");
  assert.notEqual(pose.id, story.id); assert.notEqual(pose.pages[0].contentId, story.pages[0].contentId);
});
test("linked view shares content; an independent alternative rewrites internal references", () => {
  const p = createProject("framing"), first = p.pages[0];
  p.contents[first.contentId].local["poseboard.project.v3"] = JSON.stringify({ editor: { ratio: "9:16" }, currentScene: { models: [{ id: "model-1" }], selectedModelId: "model-1" }, videoTimeline: { shots: [{ id: "shot-1" }] }, activeShotId: "shot-1", animationTimeline: { shots: [{ id: "animation-1", shotId: "shot-1", tracks: [{ id: "track-1", modelId: "model-1" }] }] } });
  const linked = addProjectPage(p, "animation", first.id), alternative = addProjectPage(p, "stage", first.id, true);
  assert.equal(linked.contentId, first.contentId); assert.notEqual(alternative.contentId, first.contentId);
  const copied = JSON.parse(p.contents[alternative.contentId].local["poseboard.project.v3"]);
  assert.notEqual(copied.activeShotId, "shot-1"); assert.equal(copied.activeShotId, copied.videoTimeline.shots[0].id); assert.equal(copied.activeShotId, copied.animationTimeline.shots[0].shotId);
  assert.equal(copied.currentScene.models[0].id, copied.currentScene.selectedModelId); assert.equal(copied.currentScene.selectedModelId, copied.animationTimeline.shots[0].tracks[0].modelId);
  assertProject(p);
});
test("duplicated projects are disjoint and cannot inherit cloud credentials", () => {
  const source = createProject("story"); Object.values(source.contents)[0].local["poseboard.studio.access-key"] = "secret";
  const copy = duplicateProject(source); assertProject(copy); assert.notEqual(copy.id, source.id);
  assert.equal(new Set(copy.pages.map((p) => p.contentId)).size, 1);
  for (const p of copy.pages) { assert.equal(p.projectId, copy.id); assert.ok(!source.pages.some((s) => s.id === p.id)); }
  assert.equal(Object.values(copy.contents)[0].local["poseboard.studio.access-key"], undefined);
  Object.values(copy.contents)[0].local["poseboard.project.v3"] = "changed";
  assert.notEqual(Object.values(source.contents)[0].local["poseboard.project.v3"], "changed");
});
test("project boundaries and latest confirmed cover are enforced", () => {
  const p = createProject("story"); p.pages[0].projectId = "another"; assert.throws(() => assertProject(p)); p.pages[0].projectId = p.id;
  Object.values(p.contents)[0].local["poseboard.project.v3"] = JSON.stringify({ editor: {}, videoTimeline: { shots: [{ snapshots: { old: { capturedAt: 1, thumbnail: "old" }, new: { capturedAt: 3, thumbnail: "new" } } }, { thumbnail: "unconfirmed", snapshots: { other: { capturedAt: 2, thumbnail: "other" } } }] } });
  assert.equal(latestCover(p), "new"); p.cover = "custom"; assert.equal(latestCover(p), "custom");
});
