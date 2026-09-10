import * as THREE from "three";
import { framingGeometry, type ShotPreset, type StageSettings } from "./stage-studio";

export function createStageEnvironment(stage: StageSettings) {
  const group = new THREE.Group();
  group.name = "poseboard-stage-environment";
  const box = (size: [number, number, number], at: [number, number, number], color = "#bdc9d6") => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({ color, roughness: .92 }));
    mesh.position.set(...at); mesh.receiveShadow = true; mesh.castShadow = true; group.add(mesh);
  };
  const w = stage.width, d = stage.depth;
  if (stage.type !== "blank") box([w, .12, d], [0, -.1, 0], stage.type === "grass" ? "#718c6d" : "#c7cfd7");
  if (stage.type === "room" || stage.type === "interior") {
    box([w, 5, .15], [0, 2.4, -d / 2]);
    box([.15, 5, d], [-w / 2, 2.4, 0], "#d6dce4");
    if (stage.type === "room") { box([2.3, 1, 1.1], [-3, .45, -2]); box([1, 1.8, .8], [3, .85, -3]); }
    else { box([.5, 4.5, .5], [-3, 2.2, -3]); box([.5, 4.5, .5], [3, 2.2, -3]); }
  }
  if (stage.type === "street") {
    box([3, .02, d], [0, -.025, 0], "#7e8998");
    [-1, 1].forEach((side) => { for (let n = 0; n < 3; n++) box([2, 3 + n, 2], [side * (w / 2 - 1), (3 + n) / 2, -d / 2 + 2 + n * 3]); });
  }
  if (stage.type === "rooftop") {
    box([w, .65, .2], [0, .25, -d / 2]);
    box([.2, .65, d], [-w / 2, .25, 0]);
    for (let n = 0; n < 5; n++) box([2, 2 + n % 3, 2], [(n - 2) * 3, (2 + n % 3) / 2 - 2, -d / 2 - 7], "#a5b8cc");
  }
  if (stage.type === "studio") {
    box([w, 6, .15], [0, 2.9, -d / 2], "#e6e9ee");
    [-1, 1].forEach((side) => { box([.08, 3, .08], [side * 4, 1.45, -1]); box([1.1, 1.4, .12], [side * 4, 3, -1], "#f9fafb"); });
  }
  return group;
}
export function disposeStageEnvironment(group: THREE.Group) {
  group.traverse((child) => { if (child instanceof THREE.Mesh) { child.geometry.dispose(); (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => material.dispose()); } });
}

export function cameraForShot(preset: ShotPreset, position: [number, number, number], scale: number, subjectHeight = 3.45, dialogueWidth = 0) {
  const g = framingGeometry(preset, subjectHeight * scale / 100);
  if (preset.composition === "dialogue" && dialogueWidth > 0) {
    const tangent = g.halfHeight / g.distance;
    g.distance = Math.max(g.distance, dialogueWidth / (2 * tangent * g.aspect * preset.occupancy));
    g.halfHeight = g.distance * tangent;
  }
  const directions: Record<ShotPreset["angle"], [number, number, number]> = { eye_level: [0, 0, 1], low: [0, -.28, 1], high: [0, .5, 1], up: [0, -.65, 1], down: [0, 1, 1], side: [1, 0, .02], back: [0, 0, -1], top: [0, 1, .001], dutch: [0, 0, 1] };
  const direction = new THREE.Vector3(...directions[preset.angle]).normalize();
  const target = new THREE.Vector3(...position).add(new THREE.Vector3(0, g.targetHeight, 0));
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  target.addScaledVector(right, -g.xBias * g.halfHeight * 2 * g.aspect);
  target.addScaledVector(up, g.yBias * g.halfHeight * 2);
  const cameraPosition = target.clone().addScaledVector(direction, g.distance);
  const cameraUp = new THREE.Vector3(0, 1, 0);
  if (preset.angle === "dutch" || preset.composition === "diagonal") cameraUp.applyAxisAngle(direction, Math.PI / 12);
  const camera = new THREE.PerspectiveCamera(); camera.position.copy(cameraPosition); camera.up.copy(cameraUp); camera.lookAt(target);
  return { position: cameraPosition.toArray() as [number, number, number], target: target.toArray() as [number, number, number], up: cameraUp.toArray() as [number, number, number], rotation: camera.rotation.toArray().slice(0, 3) as [number, number, number], focalLength: preset.focalLength, fov: 2 * Math.atan(g.halfHeight / g.distance) * 180 / Math.PI };
}

export function drawShotGuides(context: CanvasRenderingContext2D, width: number, height: number, safe: boolean, thirds: boolean) {
  context.save(); context.strokeStyle = "rgba(255,255,255,.85)"; context.lineWidth = Math.max(1, width / 900);
  context.shadowColor = "#182230"; context.shadowBlur = 2;
  if (safe) { context.setLineDash([8, 6]); context.strokeRect(width * .05, height * .05, width * .9, height * .9); context.strokeRect(width * .1, height * .1, width * .8, height * .8); }
  if (thirds) { context.setLineDash([]); context.beginPath(); for (const n of [1, 2]) { context.moveTo(width * n / 3, 0); context.lineTo(width * n / 3, height); context.moveTo(0, height * n / 3); context.lineTo(width, height * n / 3); } context.stroke(); }
  context.restore();
}
