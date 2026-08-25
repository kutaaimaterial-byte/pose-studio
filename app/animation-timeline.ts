export type AnimationInterpolation = "hold" | "linear" | "ease-in-out";
export type Vec3Tuple = [number, number, number];
export type QuaternionTuple = [number, number, number, number];
export type BoneQuaternionSnapshot = Record<string, QuaternionTuple>;

export type PoseAnimationKeyframe = {
  id: string;
  time: number;
  interpolation: AnimationInterpolation;
  poseId: string;
  poseIndex: number;
  bones: BoneQuaternionSnapshot;
};

export type RootAnimationKeyframe = {
  id: string;
  time: number;
  interpolation: AnimationInterpolation;
  position: Vec3Tuple;
  rotation: Vec3Tuple;
  scale: number;
};

export type CameraAnimationKeyframe = {
  id: string;
  time: number;
  interpolation: AnimationInterpolation;
  position: Vec3Tuple;
  target: Vec3Tuple;
  focalLength: number;
};

export type AnimationTrack =
  | { id: string; kind: "pose"; name: string; enabled: boolean; keyframes: PoseAnimationKeyframe[] }
  | { id: string; kind: "root"; name: string; enabled: boolean; keyframes: RootAnimationKeyframe[] }
  | { id: string; kind: "camera"; name: string; enabled: boolean; keyframes: CameraAnimationKeyframe[] };

export type AnimationShot = {
  id: string;
  shotId: string;
  duration: number;
  speed: number;
  loop: boolean;
  tracks: AnimationTrack[];
};

export type MotionLibraryItem = {
  id: "idle" | "walk" | "run" | "wave" | "kneel";
  name: string;
  nameEn: string;
  category: "loop" | "gesture" | "transition";
  defaultDuration: number;
};

export type AnimationTimeline = {
  schemaVersion: "3.3";
  fps: number;
  autoKey: boolean;
  interpolation: AnimationInterpolation;
  shots: AnimationShot[];
  motionLibrary: MotionLibraryItem[];
  updatedAt: number;
};

export type EvaluatedAnimation = {
  pose?: Pick<PoseAnimationKeyframe, "poseId" | "poseIndex" | "bones">;
  root?: Pick<RootAnimationKeyframe, "position" | "rotation" | "scale">;
  camera?: Pick<CameraAnimationKeyframe, "position" | "target" | "focalLength">;
};

export const motionLibrary: MotionLibraryItem[] = [
  { id: "idle", name: "待机呼吸", nameEn: "Idle", category: "loop", defaultDuration: 3 },
  { id: "walk", name: "自然行走", nameEn: "Walk", category: "loop", defaultDuration: 4 },
  { id: "run", name: "向前奔跑", nameEn: "Run", category: "loop", defaultDuration: 6 },
  { id: "wave", name: "抬手挥动", nameEn: "Wave", category: "gesture", defaultDuration: 5 },
  { id: "kneel", name: "站立到单膝跪", nameEn: "Kneel", category: "transition", defaultDuration: 4 },
];

export function inferMotionFromPrompt(prompt: string): MotionLibraryItem["id"] | null {
  const value = prompt.toLowerCase();
  if (/单膝|跪下|跪地|kneel/.test(value)) return "kneel";
  if (/抬手|举手|挥手|wave|raise.+hand/.test(value)) return "wave";
  if (/疾跑|冲刺|奔跑|跑步|run|sprint/.test(value)) return "run";
  if (/行走|走路|迈步|walk/.test(value)) return "walk";
  if (/待机|呼吸|静止|稳定|idle|breath|still/.test(value)) return "idle";
  return null;
}

const round = (value: number, digits = 6) => Number(value.toFixed(digits));
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function snapAnimationTime(time: number, fps: number) {
  const safeFps = Math.max(1, fps || 24);
  return round(Math.max(0, Math.round(time * safeFps) / safeFps));
}

export function animationLocalTime(globalTime: number, shotStart: number, shotDuration: number, speed = 1) {
  return Math.min(Math.max(0, shotDuration), Math.max(0, globalTime - shotStart) * Math.max(0.01, speed));
}

function easing(value: number, interpolation: AnimationInterpolation) {
  const t = clamp01(value);
  if (interpolation === "hold") return 0;
  if (interpolation === "ease-in-out") return t * t * (3 - 2 * t);
  return t;
}

function lerpNumber(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3Tuple, b: Vec3Tuple, t: number): Vec3Tuple {
  return [round(lerpNumber(a[0], b[0], t)), round(lerpNumber(a[1], b[1], t)), round(lerpNumber(a[2], b[2], t))];
}

export function slerpQuaternion(a: QuaternionTuple, b: QuaternionTuple, amount: number): QuaternionTuple {
  let bx = b[0]; let by = b[1]; let bz = b[2]; let bw = b[3];
  let cosine = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
  if (cosine < 0) {
    cosine = -cosine;
    bx = -bx; by = -by; bz = -bz; bw = -bw;
  }
  const t = clamp01(amount);
  let left: number;
  let right: number;
  if (1 - cosine > 1e-6) {
    const angle = Math.acos(Math.min(1, cosine));
    const sine = Math.sin(angle);
    left = Math.sin((1 - t) * angle) / sine;
    right = Math.sin(t * angle) / sine;
  } else {
    left = 1 - t;
    right = t;
  }
  const result: QuaternionTuple = [
    a[0] * left + bx * right,
    a[1] * left + by * right,
    a[2] * left + bz * right,
    a[3] * left + bw * right,
  ];
  const length = Math.hypot(...result) || 1;
  return result.map((value) => round(value / length)) as QuaternionTuple;
}

function framePair<T extends { time: number; interpolation: AnimationInterpolation }>(frames: T[], time: number) {
  const sorted = [...frames].sort((a, b) => a.time - b.time);
  if (!sorted.length) return null;
  if (time <= sorted[0].time) return { before: sorted[0], after: sorted[0], amount: 0 };
  if (time >= sorted.at(-1)!.time) return { before: sorted.at(-1)!, after: sorted.at(-1)!, amount: 0 };
  const afterIndex = sorted.findIndex((frame) => frame.time >= time);
  const before = sorted[Math.max(0, afterIndex - 1)];
  const after = sorted[afterIndex];
  const span = Math.max(1e-6, after.time - before.time);
  return { before, after, amount: easing((time - before.time) / span, before.interpolation) };
}

function evaluatePose(track: Extract<AnimationTrack, { kind: "pose" }>, time: number) {
  const pair = framePair(track.keyframes, time);
  if (!pair) return undefined;
  const bones: BoneQuaternionSnapshot = {};
  const names = new Set([...Object.keys(pair.before.bones), ...Object.keys(pair.after.bones)]);
  names.forEach((name) => {
    const before = pair.before.bones[name] ?? pair.after.bones[name];
    const after = pair.after.bones[name] ?? before;
    if (before && after) bones[name] = slerpQuaternion(before, after, pair.amount);
  });
  const selected = pair.amount < 0.5 ? pair.before : pair.after;
  return { poseId: selected.poseId, poseIndex: selected.poseIndex, bones };
}

export function evaluateAnimationShot(shot: AnimationShot | undefined, localTime: number): EvaluatedAnimation {
  if (!shot) return {};
  const time = Math.min(shot.duration, Math.max(0, localTime));
  const result: EvaluatedAnimation = {};
  shot.tracks.filter((track) => track.enabled).forEach((track) => {
    if (track.kind === "pose") result.pose = evaluatePose(track, time);
    if (track.kind === "root") {
      const pair = framePair(track.keyframes, time);
      if (pair) result.root = {
        position: lerpVec3(pair.before.position, pair.after.position, pair.amount),
        rotation: lerpVec3(pair.before.rotation, pair.after.rotation, pair.amount),
        scale: round(lerpNumber(pair.before.scale, pair.after.scale, pair.amount)),
      };
    }
    if (track.kind === "camera") {
      const pair = framePair(track.keyframes, time);
      if (pair) result.camera = {
        position: lerpVec3(pair.before.position, pair.after.position, pair.amount),
        target: lerpVec3(pair.before.target, pair.after.target, pair.amount),
        focalLength: round(lerpNumber(pair.before.focalLength, pair.after.focalLength, pair.amount)),
      };
    }
  });
  return result;
}

function emptyAnimationShot(shotId: string, duration: number): AnimationShot {
  return {
    id: `anim_${shotId}`,
    shotId,
    duration: Math.max(1 / 120, duration),
    speed: 1,
    loop: false,
    tracks: [
      { id: `pose_${shotId}`, kind: "pose", name: "Pose", enabled: true, keyframes: [] },
      { id: `root_${shotId}`, kind: "root", name: "Root Transform", enabled: true, keyframes: [] },
      { id: `camera_${shotId}`, kind: "camera", name: "Camera", enabled: true, keyframes: [] },
    ],
  };
}

export function createAnimationTimeline(shots: Array<{ id: string; duration: number }>, fps = 24): AnimationTimeline {
  return {
    schemaVersion: "3.3",
    fps: Math.max(1, fps),
    autoKey: false,
    interpolation: "ease-in-out",
    shots: shots.map((shot) => emptyAnimationShot(shot.id, shot.duration)),
    motionLibrary: motionLibrary.map((motion) => ({ ...motion })),
    updatedAt: 0,
  };
}

export function normalizeAnimationTimeline(source: unknown, shots: Array<{ id: string; duration: number }>, fps = 24): AnimationTimeline {
  const value = source && typeof source === "object" ? source as Partial<AnimationTimeline> : {};
  const base = createAnimationTimeline(shots, fps);
  const storedShots = Array.isArray(value.shots) ? value.shots : [];
  base.autoKey = Boolean(value.autoKey);
  base.interpolation = value.interpolation === "hold" || value.interpolation === "linear" ? value.interpolation : "ease-in-out";
  base.updatedAt = Number.isFinite(value.updatedAt) ? Number(value.updatedAt) : 0;
  base.shots = shots.map((shot) => {
    const stored = storedShots.find((item) => item?.shotId === shot.id);
    if (!stored || !Array.isArray(stored.tracks)) return emptyAnimationShot(shot.id, shot.duration);
    const fallback = emptyAnimationShot(shot.id, shot.duration);
    return {
      ...fallback,
      ...stored,
      id: stored.id || fallback.id,
      shotId: shot.id,
      duration: shot.duration,
      speed: Math.max(0.01, Number(stored.speed) || 1),
      tracks: fallback.tracks.map((track) => {
        const found = stored.tracks.find((candidate) => candidate.kind === track.kind);
        if (!found || !Array.isArray(found.keyframes)) return track;
        return { ...track, ...found, id: found.id || track.id, keyframes: [...found.keyframes].sort((a, b) => a.time - b.time) } as AnimationTrack;
      }),
    };
  });
  return base;
}

export function upsertAnimationKeyframe<T extends AnimationTrack["keyframes"][number]>(frames: T[], frame: T, fps: number): T[] {
  const time = snapAnimationTime(frame.time, fps);
  const next = frames.filter((item) => Math.abs(item.time - time) > 0.5 / Math.max(1, fps));
  next.push({ ...frame, time });
  return next.sort((a, b) => a.time - b.time);
}
