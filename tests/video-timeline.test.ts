import assert from "node:assert/strict";
import test from "node:test";

import {
  formatTimecode,
  normalizeVideoTimeline,
  parseTimelinePrompt,
  timelinePromptText,
} from "../app/video-timeline";

const samplePrompt = `总时长15秒，画面9:16，24fps。
0-2秒：脸部极近景，角色低头，画面稳定。
2-5秒：侧面中景，角色慢慢抬头。
5-8秒：大远景，镜头快速向后拉开。
8-12秒：角色身体前倾，向前疾跑冲刺。
12-15秒：上半身中近景，角色停下并看向镜头，稳定收尾。`;

test("V3.2 sample prompt creates five exact shots", () => {
  const result = parseTimelinePrompt(samplePrompt);
  assert.equal(result.timeline.duration, 15);
  assert.equal(result.timeline.fps, 24);
  assert.equal(result.timeline.masterAspect, "9:16");
  assert.deepEqual(result.timeline.shots.map(({ start, end, duration }) => ({ start, end, duration })), [
    { start: 0, end: 2, duration: 2 },
    { start: 2, end: 5, duration: 3 },
    { start: 5, end: 8, duration: 3 },
    { start: 8, end: 12, duration: 4 },
    { start: 12, end: 15, duration: 3 },
  ]);
  assert.equal(new Set(result.timeline.shots.map((shot) => shot.color)).size, 5);
  assert.equal(result.issues.filter((issue) => issue.severity === "error").length, 0);
});

test("duration-only shots accumulate from the previous end", () => {
  const result = parseTimelinePrompt(`画面16:9，30fps
镜头1（2秒）：低头特写
镜头2（3.5秒）：侧面中景
持续1.5秒：稳定收尾`);
  assert.deepEqual(result.timeline.shots.map(({ start, end }) => ({ start, end })), [
    { start: 0, end: 2 },
    { start: 2, end: 5.5 },
    { start: 5.5, end: 7 },
  ]);
  assert.equal(result.timeline.duration, 7);
});

test("timecode, Chinese ranges, gaps, and overlaps are deterministic", () => {
  const result = parseTimelinePrompt(`00:00-00:02：第一镜头
第4至6秒：第二镜头
5-7秒：发生重叠
这段没有时间`);
  assert.equal(result.timeline.shots.length, 2);
  assert.equal(result.timeline.shots[1].start, 4);
  assert.ok(result.issues.some((issue) => issue.code === "gap"));
  assert.ok(result.issues.some((issue) => issue.code === "overlap"));
  assert.deepEqual(result.unassigned, ["发生重叠", "这段没有时间"]);
});

test("normalization preserves colors, snapshots, and aspect overrides", () => {
  const parsed = parseTimelinePrompt(samplePrompt).timeline;
  parsed.shots[0].sceneSnapshot = { pose: "standing" };
  parsed.shots[0].aspectOverrides["9:16"] = { ratio: "9:16", snapshot: { camera: "close" }, updatedAt: 3 };
  const restored = normalizeVideoTimeline<typeof parsed.shots[0]["sceneSnapshot"]>(JSON.parse(JSON.stringify(parsed)));
  assert.equal(restored.shots[0].color, parsed.shots[0].color);
  assert.deepEqual(restored.shots[0].sceneSnapshot, { pose: "standing" });
  assert.deepEqual(restored.shots[0].aspectOverrides["9:16"].snapshot, { camera: "close" });
});

test("timeline prompt export uses persisted timing", () => {
  const timeline = parseTimelinePrompt(samplePrompt).timeline;
  const output = timelinePromptText(timeline);
  assert.match(output, /总时长15s，画面9:16，24fps/);
  assert.match(output, /00:08-00:12：角色身体前倾/);
  assert.equal(formatTimecode(65.5, true, 24), "01:05:12");
});
