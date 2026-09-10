import { parseTimelinePrompt } from "./video-timeline";
export type RecipeRatio = "16:9" | "9:16";
export type RecipeActor = { slot: "A" | "B"; position: [number, number, number]; yaw: number; pose: string; mirrored?: boolean };
export type RecipeCamera = { position: [number, number, number]; target: [number, number, number]; focalLength: number };
export type CameraNudge = "near" | "far" | "left" | "right" | "high" | "low";
export function nudgeRecipeCamera(spec: RecipeCamera, kind: CameraNudge): RecipeCamera {
  const position = [...spec.position] as RecipeCamera["position"], target = [...spec.target] as RecipeCamera["target"];
  if (kind === "near" || kind === "far") return { ...spec, position: position.map((v, i) => target[i] + (v - target[i]) * (kind === "near" ? .9 : 1.1)) as RecipeCamera["position"], target };
  const dx = target[0] - position[0], dz = target[2] - position[2], length = Math.hypot(dx, dz) || 1;
  const shift = kind === "high" || kind === "low" ? [0, kind === "high" ? .15 : -.15, 0] : [-dz / length * (kind === "left" ? .15 : -.15), 0, dx / length * (kind === "left" ? .15 : -.15)];
  return { ...spec, position: position.map((v, i) => v + shift[i]) as RecipeCamera["position"], target: target.map((v, i) => v + shift[i]) as RecipeCamera["target"] };
}
export type ShotRecipe = { id: string; name: string; category: "单人" | "双人" | "动作反应"; size: "FS" | "MS" | "MCU" | "CU" | "ECU"; actors: RecipeActor[]; environment: "studio" | "interior"; duration: number; relation: string; cameras: Record<RecipeRatio, RecipeCamera> };
const solo: RecipeActor[] = [{ slot: "A", position: [0, 0, 0], yaw: 0, pose: "自然站立" }];
const pair: RecipeActor[] = [{ slot: "A", position: [-1.4, 0, 0], yaw: 90, pose: "自然站立" }, { slot: "B", position: [1.4, 0, 0], yaw: -90, pose: "自然站立" }];
const camera = (position: RecipeCamera["position"], target: RecipeCamera["target"], focalLength: number): RecipeCamera => ({ position, target, focalLength });
// Every ratio is authored separately. Actor placement and the A/B identity slots are shared.
// All dialogue cameras stay on the +Z side of the A–B axis.
export const shotRecipes: ShotRecipe[] = [
  { id: "arrival-full", name: "人物登场全身", category: "单人", size: "FS", actors: solo, environment: "studio", duration: 3, relation: "正面站立，完整交代人物", cameras: { "16:9": camera([.8, 2.5, 8.7], [0, 1.65, 0], 42), "9:16": camera([.4, 2.1, 6.3], [0, 1.7, 0], 45) } },
  { id: "arrival-medium", name: "人物中景", category: "单人", size: "MS", actors: solo, environment: "studio", duration: 3, relation: "上半身与表情", cameras: { "16:9": camera([.8, 2.85, 6], [0, 2.48, 0], 58), "9:16": camera([.4, 2.85, 3.7], [0, 2.65, 0], 72) } },
  { id: "arrival-close", name: "面部特写", category: "单人", size: "CU", actors: solo, environment: "studio", duration: 2, relation: "清晰面部与眼神", cameras: { "16:9": camera([.28, 3.18, 3.8], [0, 3.12, 0], 100), "9:16": camera([.2, 3.2, 2.7], [0, 3.08, 0], 120) } },
  { id: "hero-low", name: "低机位英雄全身", category: "单人", size: "FS", actors: solo, environment: "studio", duration: 3, relation: "低角度，头顶留白", cameras: { "16:9": camera([1.3, .7, 8.4], [0, 1.9, 0], 38), "9:16": camera([.5, .65, 5.5], [0, 1.92, 0], 36) } },
  { id: "dialogue-wide", name: "双人关系镜头", category: "双人", size: "FS", actors: pair, environment: "interior", duration: 3, relation: "A 在左、B 在右，两人面对面", cameras: { "16:9": camera([0, 2.65, 9.5], [0, 1.7, 0], 44), "9:16": camera([.25, 2.65, 10.8], [0, 1.8, 0], 40) } },
  { id: "ots-b", name: "双人过肩近景 · 看 B", category: "双人", size: "MCU", actors: pair, environment: "interior", duration: 3, relation: "A 肩背在前景，B 面向 A；同轴侧", cameras: { "16:9": camera([-3.9, 3.12, 1.12], [1.24, 2.96, 0], 66), "9:16": camera([-3.6, 3.12, .95], [1.31, 2.98, 0], 98) } },
  { id: "ots-a", name: "双人过肩反打 · 看 A", category: "双人", size: "MCU", actors: pair, environment: "interior", duration: 3, relation: "B 肩背在前景，A 面向 B；同轴侧", cameras: { "16:9": camera([3.9, 3.12, 1.12], [-1.24, 2.96, 0], 66), "9:16": camera([3.6, 3.12, .95], [-1.31, 2.98, 0], 98) } },
  { id: "reaction-b", name: "对方反应特写", category: "双人", size: "CU", actors: pair, environment: "interior", duration: 2, relation: "B 看向画面左侧的 A", cameras: { "16:9": camera([-1.2, 3.2, 1.95], [1.38, 3.12, 0], 75), "9:16": camera([-.65, 3.2, 1.55], [1.39, 3.1, 0], 91) } },
  { id: "eyes-b", name: "眼神特写 · 看 B", category: "双人", size: "ECU", actors: pair, environment: "interior", duration: 2, relation: "B 的眼神，保持对话方向", cameras: { "16:9": camera([-.35, 3.22, .73], [1.39, 3.23, .01], 128), "9:16": camera([.1, 3.24, .55], [1.4, 3.21, 0], 128) } },
  { id: "gesture", name: "抬手示意", category: "动作反应", size: "FS", actors: [{ ...pair[0], pose: "单手举起" }, pair[1]], environment: "interior", duration: 2, relation: "A 抬手，B 面向 A；定格姿态", cameras: { "16:9": camera([1.6, 3.2, 6.8], [-.5, 2.7, .15], 40), "9:16": camera([1, 3, 9], [-.25, 2.35, .5], 39) } },
  { id: "hand-detail", name: "抬手细节", category: "动作反应", size: "CU", actors: [{ ...pair[0], pose: "单手举起" }, pair[1]], environment: "interior", duration: 2, relation: "举手动作局部，定格细节", cameras: { "16:9": camera([2.6, 4.1, 3.9], [-1.4, 3.65, 1.2], 130), "9:16": camera([1, 3.9, 3.1], [-1.4, 3.65, 1.05], 75) } },
];
export const shotSuites = [
  { id: "arrival", name: "人物登场套组", description: "全身建立 → 中景 → 面部收尾", recipeIds: ["arrival-full", "arrival-medium", "arrival-close"] },
  { id: "dialogue", name: "双人对话套组", description: "关系建立 → B 过肩 → A 反打 → 反应", recipeIds: ["dialogue-wide", "ots-b", "ots-a", "reaction-b"] },
  { id: "reaction", name: "动作反应套组", description: "抬手示意 → 对方反应 → 手部 → 结果", recipeIds: ["gesture", "reaction-b", "hand-detail", "dialogue-wide"] },
];
export type RecipePlan = { name: string; sourcePrompt?: string; items: { recipeId: string; duration: number; prompt: string; composition?: "left" | "right" | "center"; cameras?: Partial<Record<RecipeRatio, RecipeCamera>> }[]; ratio: RecipeRatio; warnings: string[]; mirrored?: boolean; swapped?: boolean };
export function arrangedRecipe(recipe: ShotRecipe, plan: Pick<RecipePlan, "mirrored" | "swapped">): ShotRecipe {
  if (!plan.mirrored && !plan.swapped) return recipe;
  const flip = (v: RecipeCamera["position"]): RecipeCamera["position"] => [-v[0], v[1], v[2]];
  return { ...recipe, actors: recipe.actors.map((a) => ({ ...a, slot: plan.swapped ? a.slot === "A" ? "B" : "A" : a.slot, position: plan.mirrored ? flip(a.position) : a.position, yaw: plan.mirrored ? -a.yaw : a.yaw, mirrored: plan.mirrored })), cameras: Object.fromEntries(Object.entries(recipe.cameras).map(([ratio, c]) => [ratio, plan.mirrored ? { ...c, position: flip(c.position), target: flip(c.target) } : c])) as ShotRecipe["cameras"] };
}
export function composedRecipeCamera(recipe: ShotRecipe, ratio: RecipeRatio, composition?: "left" | "right" | "center"): RecipeCamera {
  const original = recipe.cameras[ratio];
  if (!composition || composition === "center") return original;
  const [px, py, pz] = original.position, [tx, ty, tz] = original.target;
  const length = Math.hypot(tx - px, tz - pz), distance = Math.hypot(tx - px, ty - py, tz - pz);
  const width = distance * 35 * Math.min(ratio === "16:9" ? 16 / 9 : 9 / 16, 1) / original.focalLength;
  const shift = width * (composition === "left" ? .16 : -.16);
  const dx = -(tz - pz) / length * shift, dz = (tx - px) / length * shift;
  return { ...original, position: [px + dx, py, pz + dz], target: [tx + dx, ty, tz + dz] };
}
export function planForRecipes(ids: string[], ratio: RecipeRatio, name: string): RecipePlan {
  return { name, ratio, warnings: [], items: ids.map((id) => { const r = shotRecipes.find((r) => r.id === id)!; return { recipeId: id, duration: r.duration, prompt: `${r.name}，${r.relation}。静态分镜。` }; }) };
}
export function recommendRecipePlan(prompt: string, currentRatio: RecipeRatio, alternative = 0): RecipePlan {
  const ratio = /竖屏|竖版|9:16/.test(prompt) ? "9:16" : /横屏|横版|16:9/.test(prompt) ? "16:9" : currentRatio;
  const match = (text: string) => /眼神/.test(text) ? "eyes-b" : /手部|手掌|细节/.test(text) ? "hand-detail" : /反应/.test(text) ? "reaction-b" : /反打|看A/.test(text) ? "ots-a" : /过肩/.test(text) ? "ots-b" : /两个人的位置|关系|交代|双人|两人|两个人/.test(text) ? "dialogue-wide" : /低机位|英雄|仰拍/.test(text) ? "hero-low" : /特写|面部/.test(text) ? "arrival-close" : /中景|半身/.test(text) ? "arrival-medium" : "arrival-full";
  const timed = /\d\s*(?:秒|s)?\s*[-~～—–至到]\s*\d/.test(prompt) ? parseTimelinePrompt(prompt.replace(/(\d+(?:\.\d+)?\s*(?:秒|s)?\s*[-~～—–至到]\s*\d)/g, "\n$1")) : null;
  let plan: RecipePlan;
  if (timed?.timeline.shots.length) {
    plan = { name: "按时间安排的分镜", ratio, warnings: timed.issues.map((i) => i.message), items: timed.timeline.shots.map((s) => ({ recipeId: match(s.promptText), duration: s.duration, prompt: s.promptText })) };
    if (timed.issues.some((i) => i.code === "gap" || i.code === "overlap")) plan.warnings.push("预设模式按镜头顺序连续排布，原文的空隙／重叠不予执行。");
  } else if (/先.+(?:再|然后).+最后/.test(prompt)) {
    const parts = prompt.replace(/^.*?先/, "").split(/，?再|，?然后|，?最后/).map((p) => p.replace(/，?总共.*$/, ""));
    plan = planForRecipes(parts.map(match), ratio, "推荐分镜");
    plan.items = plan.items.map((item, i) => ({ ...item, prompt: parts[i] }));
  } else {
    const suite = /对话|两人|双人|两个人/.test(prompt) ? shotSuites[1] : /动作|反应|抬手/.test(prompt) ? shotSuites[2] : /登场|套组|分镜/.test(prompt) ? shotSuites[0] : null;
    plan = planForRecipes(suite?.recipeIds ?? [match(prompt)], ratio, suite?.name ?? "推荐镜头");
  }
  if (alternative % 2) plan.mirrored = true;
  const total = prompt.match(/(?:总共|总时长|共|总计)\s*(\d+(?:\.\d+)?)\s*秒/);
  if (total && !timed) {
    const frames = Math.round(Number(total[1]) * 24);
    if (frames < plan.items.length) plan.warnings.push("总时长不足以容纳每镜一帧，保留预设时长。");
    else plan.items.forEach((item, i) => { item.duration = (Math.floor(frames / plan.items.length) + (i < frames % plan.items.length ? 1 : 0)) / 24; });
  }
  const composition = /右侧|偏右/.test(prompt) ? "right" : /左侧|偏左/.test(prompt) ? "left" : /居中/.test(prompt) ? "center" : undefined;
  if (composition) plan.items = plan.items.map((i) => ({ ...i, composition }));
  if (/跑|跳|走动|递物|拥抱|打斗|运镜|推近|拉远|环绕/.test(prompt)) plan.warnings.push("这批完整预设是静态镜头；不包含跑跳、递物或连续运镜动画，不会用平移冒充动作。");
  if (/三人|四人|多人|3人|4人/.test(prompt)) plan.warnings.push("当前完整预设最多两个人，未实现额外人数。");
  if (/天空|屋顶|天台|雨|雪|道具|剑|枪|服装|换装/.test(prompt)) plan.warnings.push("预设使用白模和基础室内／摄影棚，未实现文字中要求的外景、天气、服装或道具。");
  if (/眼神/.test(prompt) && !/对话|两人|双人|两个人/.test(prompt)) plan.warnings.push("眼神预设来自双人对话布置，包含 A、B 两个人物槽位。");
  plan.sourcePrompt = prompt;
  return plan;
}

export function orderedShotIds(ids: string[], from: string, to: string) {
  if (!ids.includes(from) || !ids.includes(to) || from === to) return ids;
  const next = ids.filter((id) => id !== from); next.splice(next.indexOf(to), 0, from); return next;
}
