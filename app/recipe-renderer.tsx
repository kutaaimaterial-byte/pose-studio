"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStageEnvironment, disposeStageEnvironment } from "./stage-scene";
import { defaultStage } from "./stage-studio";
import { shotRecipes, type RecipeActor, type RecipeCamera, type RecipeRatio, type ShotRecipe } from "./shot-recipes";
export type RecipeActorFactory = (template: THREE.Object3D, actor: RecipeActor) => THREE.Group;
export function buildRecipeScene(recipe: ShotRecipe, template: THREE.Object3D, factory: RecipeActorFactory) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color("#e5ebf2");
  const environment = createStageEnvironment({ ...defaultStage, type: recipe.environment, width: 14, depth: 14 }); scene.add(environment);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6d7480, 1.35));
  for (const [position, intensity, color] of [[[4, 8, 5], 4.6, 0xffffff], [[-3, 3.5, 4.5], 1.35, 0xe8f1ff], [[-5, 4, -3], 2.1, 0xcbd5ff]] as const) {
    const light = new THREE.DirectionalLight(color, intensity); light.position.set(position[0], position[1], position[2]);
    if (intensity === 4.6) { light.castShadow = true; light.shadow.mapSize.set(2048, 2048); Object.assign(light.shadow.camera, { left: -5, right: 5, top: 6, bottom: -2 }); light.shadow.bias = -.00015; }
    scene.add(light);
  }
  const actors = recipe.actors.map((actor) => factory(template, actor)); actors.forEach((a) => { a.traverse((child) => { if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; } }); scene.add(a); });
  scene.updateMatrixWorld(true);
  return { scene, dispose: () => {
    disposeStageEnvironment(environment);
    scene.traverse((child) => { if (child instanceof THREE.DirectionalLight) child.shadow.dispose(); });
    actors.forEach((root) => root.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) child.skeleton.dispose();
      if (child instanceof THREE.Mesh) { child.geometry.dispose(); (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => m.dispose()); }
    }));
  } };
}
export function makeRecipeCamera(spec: RecipeCamera, ratio: RecipeRatio) {
  const camera = new THREE.PerspectiveCamera(40, ratio === "16:9" ? 16 / 9 : 9 / 16, .05, 150);
  camera.position.set(...spec.position); camera.setFocalLength(spec.focalLength); camera.lookAt(new THREE.Vector3(...spec.target)); camera.updateMatrixWorld(true); return camera;
}
export function makeRecipeRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; return renderer;
}
export function captureShotThumbnail(source: HTMLCanvasElement | undefined) {
  if (!source?.width || !source.height) return "";
  const output = document.createElement("canvas"), scale = Math.min(384 / source.width, 384 / source.height);
  output.width = Math.max(1, Math.round(source.width * scale)); output.height = Math.max(1, Math.round(source.height * scale));
  output.getContext("2d")?.drawImage(source, 0, 0, output.width, output.height);
  return output.toDataURL("image/jpeg", .85);
}
export function renderRecipeThumbnail(template: THREE.Object3D, factory: RecipeActorFactory, recipe: ShotRecipe, ratio: RecipeRatio, camera: RecipeCamera) {
  const renderer = makeRecipeRenderer(), view = buildRecipeScene(recipe, template, factory);
  try { renderer.setSize(ratio === "16:9" ? 384 : 216, ratio === "16:9" ? 216 : 384, false); renderer.render(view.scene, makeRecipeCamera(camera, ratio)); return renderer.domElement.toDataURL("image/jpeg", .85); }
  finally { view.dispose(); renderer.dispose(); renderer.forceContextLoss(); }
}
export function generateRecipeThumbnails(template: THREE.Object3D, factory: RecipeActorFactory, onImage: (id: string, image: string) => void, onError: () => void) {
  const renderer = makeRecipeRenderer(); let cancelled = false; let frame = 0;
  const tasks = shotRecipes.flatMap((recipe) => (["16:9", "9:16"] as RecipeRatio[]).map((ratio) => ({ recipe, ratio })));
  const next = () => {
    if (cancelled) return;
    const task = tasks.shift(); if (!task) { renderer.dispose(); renderer.forceContextLoss(); return; }
    const view = buildRecipeScene(task.recipe, template, factory);
    try { renderer.setSize(task.ratio === "16:9" ? 384 : 216, task.ratio === "16:9" ? 216 : 384, false); renderer.render(view.scene, makeRecipeCamera(task.recipe.cameras[task.ratio], task.ratio)); onImage(`${task.recipe.id}:${task.ratio}`, renderer.domElement.toDataURL("image/jpeg", .84)); }
    catch { onError(); }
    finally { view.dispose(); }
    frame = requestAnimationFrame(next);
  };
  frame = requestAnimationFrame(next);
  return () => { cancelled = true; cancelAnimationFrame(frame); renderer.dispose(); renderer.forceContextLoss(); };
}
export function RecipeViewport({ template, factory, recipe, ratio, camera, exportSignal, onError }: { template: THREE.Object3D | null; factory: RecipeActorFactory; recipe: ShotRecipe; ratio: RecipeRatio; camera?: RecipeCamera; exportSignal: number; onError: (message: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera } | null>(null);
  useEffect(() => {
    if (!template || !host.current) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = makeRecipeRenderer(); } catch { onError("3D 预览暂不可用，请重新加载页面"); return; }
    const view = buildRecipeScene(recipe, template, factory), shotCamera = makeRecipeCamera(camera ?? recipe.cameras[ratio], ratio);
    const element = host.current; element.appendChild(renderer.domElement); live.current = { renderer, scene: view.scene, camera: shotCamera };
    let frame = 0, width = 0, height = 0;
    const render = () => { const w = Math.max(1, element.clientWidth), h = Math.max(1, element.clientHeight); if (w !== width || h !== height) { width = w; height = h; renderer.setSize(w, h, false); } renderer.render(view.scene, shotCamera); };
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(render); }); observer.observe(element); render();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); live.current = null; renderer.domElement.remove(); view.dispose(); renderer.dispose(); renderer.forceContextLoss(); };
  // The factory is module-stable; preview errors only report through the latest render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, factory, recipe, ratio, camera]);
  useEffect(() => {
    if (!exportSignal || !live.current) return;
    const { renderer, scene, camera } = live.current;
    const old = renderer.getSize(new THREE.Vector2());
    try { renderer.setSize(ratio === "16:9" ? 1920 : 1080, ratio === "16:9" ? 1080 : 1920, false); renderer.render(scene, camera); const a = document.createElement("a"); a.download = `PoseBoard_${recipe.id}_${ratio.replace(":", "x")}.png`; a.href = renderer.domElement.toDataURL("image/png"); a.click(); }
    catch { onError("保存图片失败，请重试"); }
    finally { renderer.setSize(old.x, old.y, false); renderer.render(scene, camera); }
  // A save signal exports exactly the currently displayed preview, without adding a timeline shot.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportSignal]);
  return <div ref={host} className="recipe-viewport" aria-label={`${recipe.name} ${ratio} 实时镜头预览`} />;
}
