import assert from "node:assert/strict";
import test from "node:test";

import {
  animationLocalTime,
  createAnimationTimeline,
  evaluateAnimationShot,
  inferMotionFromPrompt,
  motionLibrary,
  normalizeAnimationTimeline,
  slerpQuaternion,
  snapAnimationTime,
  type AnimationShot,
} from "../app/animation-timeline";

const shot: AnimationShot = {
  id: "anim_shot_1",
  shotId: "shot_1",
  duration: 6,
  speed: 1,
  loop: false,
  motionId: "walk",
  tracks: [
    {
      id: "pose_shot_1",
      kind: "pose",
      name: "Pose",
      enabled: true,
      keyframes: [
        { id: "p0", time: 0, interpolation: "linear", poseId: "a", poseIndex: 0, bones: { arm: [0, 0, 0, 1] }, bonePositions: { hips: [0, 1, 0] }, rigPosition: [0, 0, 0] },
        { id: "p1", time: 2, interpolation: "linear", poseId: "b", poseIndex: 1, bones: { arm: [0, 0, 1, 0] }, bonePositions: { hips: [0, 0.5, 0] }, rigPosition: [0, -0.2, 0] },
      ],
    },
    {
      id: "root_shot_1",
      kind: "root",
      name: "Root Transform",
      enabled: true,
      keyframes: [
        { id: "r0", time: 0, interpolation: "linear", position: [0, 0, 0], rotation: [0, 0, 0], scale: 100 },
        { id: "r1", time: 6, interpolation: "linear", position: [0, 0, -6], rotation: [0, 90, 0], scale: 120 },
      ],
    },
    {
      id: "camera_shot_1",
      kind: "camera",
      name: "Camera",
      enabled: true,
      keyframes: [
        { id: "c0", time: 0, interpolation: "ease-in-out", position: [0, 2, 8], target: [0, 1, 0], focalLength: 50 },
        { id: "c1", time: 6, interpolation: "ease-in-out", position: [0, 3, 12], target: [0, 1, -3], focalLength: 35 },
      ],
    },
  ],
};

test("V3.3 evaluator uses the same deterministic local clock for scrub and playback", () => {
  assert.equal(animationLocalTime(12.5, 10, 6), 2.5);
  assert.equal(animationLocalTime(20, 10, 6), 6);
  assert.equal(snapAnimationTime(1.019, 24), 1);
  const value = evaluateAnimationShot(shot, 3);
  assert.deepEqual(value.root?.position, [0, 0, -3]);
  assert.deepEqual(value.root?.rotation, [0, 45, 0]);
  assert.equal(value.root?.scale, 110);
  assert.deepEqual(value.camera?.position, [0, 2.5, 10]);
  const poseMidpoint = evaluateAnimationShot(shot, 1).pose;
  assert.deepEqual(poseMidpoint?.bonePositions?.hips, [0, 0.75, 0]);
  assert.deepEqual(poseMidpoint?.rigPosition, [0, -0.1, 0]);
});

test("bone tracks use normalized quaternion slerp", () => {
  const halfway = slerpQuaternion([0, 0, 0, 1], [0, 0, 1, 0], 0.5);
  assert.ok(Math.abs(Math.hypot(...halfway) - 1) < 1e-5);
  assert.ok(Math.abs(halfway[2] - Math.SQRT1_2) < 1e-5);
  assert.ok(Math.abs(halfway[3] - Math.SQRT1_2) < 1e-5);
});

test("normalization migrates shot metadata without losing stored keys", () => {
  const timeline = createAnimationTimeline([{ id: "shot_1", duration: 6 }], 24);
  timeline.shots[0] = shot;
  const restored = normalizeAnimationTimeline(JSON.parse(JSON.stringify(timeline)), [
    { id: "shot_1", duration: 8 },
    { id: "shot_2", duration: 4 },
  ], 30);
  assert.equal(restored.schemaVersion, "3.3");
  assert.equal(restored.shots[0].duration, 8);
  assert.equal(restored.shots[0].tracks[0].keyframes.length, 2);
  assert.equal(restored.shots[0].motionId, "walk");
  assert.equal(restored.shots[1].tracks.length, 3);
  assert.equal(restored.shots[1].motionId, null);
});

test("motion library provides a broad set of unique clip motions", () => {
  assert.ok(motionLibrary.length >= 12);
  assert.equal(new Set(motionLibrary.map((motion) => motion.id)).size, motionLibrary.length);
});

test("Prompt To Animation maps timed actions deterministically", () => {
  assert.equal(inferMotionFromPrompt("2-5秒：角色慢慢抬起右手并挥手"), "wave");
  assert.equal(inferMotionFromPrompt("角色从站立过渡到单膝跪地"), "kneel");
  assert.equal(inferMotionFromPrompt("向前疾跑冲刺，镜头后拉"), "run");
  assert.equal(inferMotionFromPrompt("角色原地起跳后落地"), "jump");
  assert.equal(inferMotionFromPrompt("转身并回头看向观众"), "look-back");
  assert.equal(inferMotionFromPrompt("抬手敬礼"), "salute");
  assert.equal(inferMotionFromPrompt("只有镜头特写"), null);
});
