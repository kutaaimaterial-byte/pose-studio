import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

globalThis.ProgressEvent ??= class ProgressEvent {
  constructor(type, init = {}) {
    this.type = type;
    Object.assign(this, init);
  }
};

await import("../app/page.tsx");

const engine = globalThis.__POSEBOARD_ENGINE_DEBUG__;
const parameterAudit = globalThis.__POSEBOARD_ENGINE_AUDIT__;
if (!engine || !parameterAudit) throw new Error("Pose Engine debug API is unavailable");

const projectRoot = process.cwd();
const modelPath = path.join(projectRoot, "public/assets/humanoid/Superhero_Male_FullBody.gltf");
const modelDirectory = path.dirname(modelPath);
const gltf = JSON.parse(fs.readFileSync(modelPath, "utf8"));

for (const buffer of gltf.buffers ?? []) {
  if (!buffer.uri || buffer.uri.startsWith("data:")) continue;
  const bytes = fs.readFileSync(path.join(modelDirectory, decodeURIComponent(buffer.uri)));
  buffer.uri = `data:application/octet-stream;base64,${bytes.toString("base64")}`;
}
for (const mesh of gltf.meshes ?? []) {
  for (const primitive of mesh.primitives ?? []) delete primitive.material;
}
delete gltf.images;
delete gltf.textures;
delete gltf.samplers;
delete gltf.materials;

const loaded = await new Promise((resolve, reject) => {
  new GLTFLoader().parse(JSON.stringify(gltf), "", resolve, reject);
});
const model = loaded.scene;
const initialBox = new THREE.Box3().setFromObject(model);
const size = initialBox.getSize(new THREE.Vector3());
const center = initialBox.getCenter(new THREE.Vector3());
const fit = 3.45 / Math.max(size.y, 0.001);
model.scale.setScalar(fit);
model.position.set(-center.x * fit, -initialBox.min.y * fit, -center.z * fit);
model.updateMatrixWorld(true);

const rig = engine.createRigBinding(model);
if (!rig) throw new Error(`Skeleton mapping failed: ${JSON.stringify(model.userData.poseboardMissingBones)}`);
const mappedRestPositions = Object.fromEntries(
  Object.entries(rig.humanoidBones).map(([name, bone]) => [
    name,
    bone.getWorldPosition(new THREE.Vector3()).toArray().map((value) => Number(value.toFixed(4))),
  ]),
);

const geometryFindings = [];
const collisionFindings = [];
const results = [];
for (const pose of engine.poses) {
  engine.applyRigPose(rig, pose.enginePoseIndex, false);
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().makeEmpty();
  model.traverse((child) => {
    if (!(child instanceof THREE.SkinnedMesh)) return;
    child.skeleton.update();
    child.computeBoundingBox();
    if (child.boundingBox) bounds.union(child.boundingBox.clone().applyMatrix4(child.matrixWorld));
  });
  const posedSize = bounds.getSize(new THREE.Vector3());
  const finite = [bounds.min.x, bounds.min.y, bounds.min.z, bounds.max.x, bounds.max.y, bounds.max.z].every(Number.isFinite);
  if (!finite || posedSize.length() > 12 || posedSize.length() < 0.2) {
    geometryFindings.push({ id: pose.id, name: pose.name, issue: "invalid-spatial-bounds", bounds: [...bounds.min.toArray(), ...bounds.max.toArray()] });
  }

  const collision = model.userData.poseboardCollisionFallbackReason;
  if (collision) collisionFindings.push({ id: pose.id, name: pose.name, collision });
  results.push({
    id: pose.id,
    name: pose.name,
    category: pose.category,
    bounds: [...bounds.min.toArray(), ...bounds.max.toArray()].map((value) => Number(value.toFixed(4))),
    safetyFactor: model.userData.poseboardSafetyFactor,
    collision: collision ?? null,
  });
}

const report = {
  model: {
    format: "gltf-2.0",
    mappedBones: Object.keys(model.userData.poseboardBoneMapping ?? {}).length,
    mapping: model.userData.poseboardBoneMapping,
    restPositions: mappedRestPositions,
    missingBones: model.userData.poseboardMissingBones,
  },
  parameters: parameterAudit,
  geometry: {
    checked: results.length,
    invalid: geometryFindings,
    collisionFallbacks: collisionFindings,
  },
  critical: Object.fromEntries(
    ["自然站立", "单手叉腰", "全力冲刺"].map((name) => [name, results.find((result) => result.name === name)]),
  ),
};

console.log(JSON.stringify(report, null, 2));
if (parameterAudit.findings.length || parameterAudit.exactDuplicates.length || parameterAudit.nearDuplicates.length || geometryFindings.length || collisionFindings.length) {
  process.exitCode = 1;
}
