import assert from "node:assert/strict";
import test from "node:test";

import { analyzePromptToPose } from "../app/prompt-to-pose";

test("timeline pose prompts produce distinct head and motion states", () => {
  const lookDown = analyzePromptToPose("脸部极近景，角色低头，画面稳定");
  const lookUp = analyzePromptToPose("侧面中景，角色慢慢抬头");
  const sprint = analyzePromptToPose("角色身体前倾，向前疾跑冲刺");
  const stop = analyzePromptToPose("角色停下并看向镜头，稳定收尾");

  assert.equal(lookDown.modifiers.head, "look_down");
  assert.equal(lookUp.modifiers.head, "look_up");
  assert.equal(sprint.category, "running");
  assert.equal(sprint.modifiers.bodyLean, "forward");
  assert.equal(stop.category, "standing");
  assert.notEqual(sprint.pose.enginePoseIndex, stop.pose.enginePoseIndex);
});
