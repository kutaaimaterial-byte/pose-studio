import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { shotRecipes, shotSuites, recommendRecipePlan, planForRecipes, composedRecipeCamera, arrangedRecipe, nudgeRecipeCamera, orderedShotIds } from "../app/shot-recipes";
import { syncShotCards } from "../app/stage-studio";
import { normalizeVideoTimeline } from "../app/video-timeline";

test("every complete shot has real actors, two authored cameras, stage, duration and relationship", () => {
  assert.equal(shotRecipes.length, 11);
  for (const recipe of shotRecipes) {
    assert.ok(recipe.actors.length >= 1 && recipe.actors.length <= 2);
    assert.ok(recipe.duration > 0 && recipe.relation && recipe.environment);
    assert.notDeepEqual(recipe.cameras["16:9"], recipe.cameras["9:16"]);
    for (const camera of Object.values(recipe.cameras)) assert.ok([...camera.position, ...camera.target, camera.focalLength].every(Number.isFinite));
  }
});
test("dialogue keeps identity, placement, facing and axis across all four shots", () => {
  const dialogue = shotSuites.find((s) => s.id === "dialogue")!;
  const recipes = dialogue.recipeIds.map((id) => shotRecipes.find((r) => r.id === id)!);
  for (const recipe of recipes) {
    assert.deepEqual(recipe.actors, recipes[0].actors);
    for (const camera of Object.values(recipe.cameras)) assert.ok(camera.position[2] > 0);
  }
  assert.equal(recipes[0].actors[0].yaw, 90); assert.equal(recipes[0].actors[1].yaw, -90);
});
test("the user's eight-second prompt directly produces three correctly ordered shots", () => {
  const plan = recommendRecipePlan("竖屏，两个人对话，先交代两个人的位置，再拍对方的反应，最后给一个眼神特写，总共 8 秒。", "16:9");
  assert.equal(plan.ratio, "9:16");
  assert.deepEqual(plan.items.map((s) => s.recipeId), ["dialogue-wide", "reaction-b", "eyes-b"]);
  assert.equal(plan.items.reduce((n, s) => n + s.duration, 0), 8);
  assert.equal(plan.items.reduce((n, s) => n + Math.round(s.duration * 24), 0), 192);
});
test("explicit timing takes priority and unsupported animation is disclosed", () => {
  const plan = recommendRecipePlan("横版。0–2秒：全身站立\n2–5秒：面部特写", "9:16");
  assert.deepEqual(plan.items.map((s) => s.duration), [2, 3]);
  const limited = recommendRecipePlan("三人在天台跑跳打斗，运镜环绕，拿着剑", "9:16");
  assert.ok(limited.warnings.some((w) => w.includes("静态")));
  assert.ok(limited.warnings.some((w) => w.includes("两个人")));
  assert.ok(limited.warnings.some((w) => w.includes("道具")));
});
test("composition changes the actual camera, never actor transforms", () => {
  const recipe = shotRecipes[0], original = structuredClone(recipe);
  for (const ratio of ["16:9", "9:16"] as const) {
    for (const side of ["left", "right"] as const) {
      const spec = composedRecipeCamera(recipe, ratio, side);
      const camera = new THREE.PerspectiveCamera(40, ratio === "16:9" ? 16 / 9 : 9 / 16);
      camera.position.set(...spec.position); camera.setFocalLength(spec.focalLength); camera.lookAt(new THREE.Vector3(...spec.target)); camera.updateMatrixWorld();
      const subject = new THREE.Vector3(...recipe.cameras[ratio].target).project(camera);
      assert.ok(side === "left" ? subject.x < -.2 : subject.x > .2);
    }
  }
  assert.deepEqual(recipe, original);
});
test("mirroring an entire suite retains its shared relationship; swapping only exchanges identity slots", () => {
  const recipe = shotRecipes[5], before = structuredClone(recipe);
  const mirrored = arrangedRecipe(recipe, { mirrored: true });
  assert.equal(mirrored.actors[0].position[0], -recipe.actors[0].position[0]);
  assert.equal(mirrored.cameras["9:16"].position[2], recipe.cameras["9:16"].position[2]);
  const swapped = arrangedRecipe(recipe, { swapped: true });
  assert.equal(swapped.actors[0].slot, "B"); assert.deepEqual(swapped.actors[0].position, recipe.actors[0].position);
  assert.deepEqual(recipe, before);
});
test("camera nudges and reordered cards do not mutate source data", () => {
  const camera = shotRecipes[0].cameras["9:16"], before = structuredClone(camera);
  for (const kind of ["near", "far", "left", "right", "high", "low"] as const) assert.notDeepEqual(nudgeRecipeCamera(camera, kind), camera);
  assert.deepEqual(camera, before);
  const ids = ["a", "b", "c"];
  assert.deepEqual(orderedShotIds(ids, "c", "a"), ["c", "a", "b"]); assert.deepEqual(ids, ["a", "b", "c"]);
});
test("shot nodes and sequential edges are derived automatically without technical connections", () => {
  const graph = syncShotCards({ nodes: [], edges: [] }, [{ id: "a", title: "过肩", duration: 3 }, { id: "b", title: "反打", duration: 2 }]);
  assert.equal(graph.nodes.length, 2); assert.deepEqual(graph.edges, [{ from: "card-a", to: "card-b" }]);
  const reversed = syncShotCards(graph, [{ id: "b", title: "反打", duration: 2 }, { id: "a", title: "过肩", duration: 3 }]);
  assert.deepEqual(reversed.edges, [{ from: "card-b", to: "card-a" }]);
  assert.equal(planForRecipes(["ots-b"], "9:16", "过肩").items[0].duration, 3);
  const legacy = syncShotCards({ nodes: [{ id: "custom", kind: "shot", x: 88, y: 199, text: "旧的技术景别节点" }], edges: [] }, []);
  assert.equal(legacy.nodes[0].text, "旧的技术景别节点");
});
test("project normalization preserves previous confirmation images and review status", () => {
  const snapshots = { old: { thumbnail: "data:image/png;base64,old", filename: "old.png", capturedAt: 1 } };
  const normalized = normalizeVideoTimeline({ shots: [{ id: "a", start: 0, end: 3, duration: 3, title: "旧图", snapshots, needsReview: true }] });
  assert.deepEqual(normalized.shots[0].snapshots, snapshots); assert.equal(normalized.shots[0].needsReview, true);
});
