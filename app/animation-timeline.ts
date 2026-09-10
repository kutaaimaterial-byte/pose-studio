export type AnimationInterpolation = "hold" | "linear" | "ease-in-out";
export type Vec3Tuple = [number, number, number];
export type QuaternionTuple = [number, number, number, number];
export type BoneQuaternionSnapshot = Record<string, QuaternionTuple>;
export type BonePositionSnapshot = Record<string, Vec3Tuple>;

export type PoseAnimationKeyframe = {
  id: string;
  time: number;
  interpolation: AnimationInterpolation;
  poseId: string;
  poseIndex: number;
  bones: BoneQuaternionSnapshot;
  bonePositions?: BonePositionSnapshot;
  rigPosition?: Vec3Tuple;
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

export type MotionId =
  | "idle"
  | "walk"
  | "run"
  | "wave"
  | "kneel"
  | "jump"
  | "squat"
  | "sit"
  | "turn"
  | "look-back"
  | "salute"
  | "stretch";

export type CameraMotionId =
  | "push-in"
  | "pull-out"
  | "pan-left"
  | "pan-right"
  | "truck-left"
  | "truck-right"
  | "orbit-left"
  | "orbit-right"
  | "crane-up"
  | "crane-down"
  | "handheld";

export type AnimationShot = {
  id: string;
  shotId: string;
  duration: number;
  speed: number;
  loop: boolean;
  motionId: MotionId | null;
  cameraMotionId: CameraMotionId | null;
  tracks: AnimationTrack[];
};

export type MotionLibraryItem = {
  id: MotionId;
  name: string;
  nameEn: string;
  category: "loop" | "gesture" | "transition";
  defaultDuration: number;
};

export type CameraMotionLibraryItem = {
  id: CameraMotionId;
  name: string;
  nameEn: string;
  category: "dolly" | "pan" | "truck" | "orbit" | "crane" | "style";
};

export type AnimationTimeline = {
  schemaVersion: "3.3";
  motionRevision: 1 | 2;
  fps: number;
  autoKey: boolean;
  interpolation: AnimationInterpolation;
  shots: AnimationShot[];
  motionLibrary: MotionLibraryItem[];
  cameraMotionLibrary: CameraMotionLibraryItem[];
  updatedAt: number;
};

export type EvaluatedAnimation = {
  pose?: Pick<PoseAnimationKeyframe, "poseId" | "poseIndex" | "bones" | "bonePositions" | "rigPosition">;
  root?: Pick<RootAnimationKeyframe, "position" | "rotation" | "scale">;
  camera?: Pick<CameraAnimationKeyframe, "position" | "target" | "focalLength">;
};

export const motionLibrary: MotionLibraryItem[] = [
  { id: "idle", name: "待机呼吸", nameEn: "Idle", category: "loop", defaultDuration: 3 },
  { id: "walk", name: "自然行走", nameEn: "Walk", category: "loop", defaultDuration: 4 },
  { id: "run", name: "向前奔跑", nameEn: "Run", category: "loop", defaultDuration: 6 },
  { id: "wave", name: "抬手挥动", nameEn: "Wave", category: "gesture", defaultDuration: 5 },
  { id: "kneel", name: "站立到单膝跪", nameEn: "Kneel", category: "transition", defaultDuration: 4 },
  { id: "jump", name: "原地起跳", nameEn: "Jump", category: "transition", defaultDuration: 3 },
  { id: "squat", name: "下蹲起身", nameEn: "Squat", category: "transition", defaultDuration: 4 },
  { id: "sit", name: "站立到坐姿", nameEn: "Sit Down", category: "transition", defaultDuration: 4 },
  { id: "turn", name: "转身回头", nameEn: "Turn Around", category: "transition", defaultDuration: 4 },
  { id: "look-back", name: "侧身回眸", nameEn: "Look Back", category: "gesture", defaultDuration: 3 },
  { id: "salute", name: "抬手敬礼", nameEn: "Salute", category: "gesture", defaultDuration: 4 },
  { id: "stretch", name: "双臂伸展", nameEn: "Stretch", category: "gesture", defaultDuration: 4 },
];

export const cameraMotionLibrary: CameraMotionLibraryItem[] = [
  { id: "push-in", name: "镜头推进", nameEn: "Push In", category: "dolly" },
  { id: "pull-out", name: "镜头拉远", nameEn: "Pull Out", category: "dolly" },
  { id: "pan-left", name: "向左摇镜", nameEn: "Pan Left", category: "pan" },
  { id: "pan-right", name: "向右摇镜", nameEn: "Pan Right", category: "pan" },
  { id: "truck-left", name: "向左横移", nameEn: "Truck Left", category: "truck" },
  { id: "truck-right", name: "向右横移", nameEn: "Truck Right", category: "truck" },
  { id: "orbit-left", name: "向左环绕", nameEn: "Orbit Left", category: "orbit" },
  { id: "orbit-right", name: "向右环绕", nameEn: "Orbit Right", category: "orbit" },
  { id: "crane-up", name: "镜头升高", nameEn: "Crane Up", category: "crane" },
  { id: "crane-down", name: "镜头降低", nameEn: "Crane Down", category: "crane" },
  { id: "handheld", name: "手持跟拍", nameEn: "Handheld", category: "style" },
];

export function inferMotionFromPrompt(prompt: string): MotionLibraryItem["id"] | null {
  const value = prompt.toLowerCase();
  if (/敬礼|军礼|salute/.test(value)) return "salute";
  if (/回眸|回头看|侧身回头|look\s*back/.test(value)) return "look-back";
  if (/转身|转过去|turn\s*around|turning/.test(value)) return "turn";
  if (/伸展|伸懒腰|张开双臂|stretch/.test(value)) return "stretch";
  if (/坐下|坐姿|正坐|sit\s*down|seated/.test(value)) return "sit";
  if (/深蹲|半蹲|下蹲|蹲下|squat/.test(value)) return "squat";
  if (/起跳|跳跃|跳起|落地|jump|leap/.test(value)) return "jump";
  if (/单膝|跪下|跪地|kneel/.test(value)) return "kneel";
  if (/抬手|举手|挥手|wave|raise.+hand/.test(value)) return "wave";
  if (/疾跑|冲刺|奔跑|跑步|run|sprint/.test(value)) return "run";
  if (/行走|走路|迈步|walk/.test(value)) return "walk";
  if (/待机|呼吸|静止|稳定|idle|breath|still/.test(value)) return "idle";
  return null;
}

export function inferCameraMotionFromPrompt(prompt: string): CameraMotionId | null {
  const value = prompt.toLowerCase();
  if (/手持|跟拍|晃动|handheld|follow\s*cam/.test(value)) return "handheld";
  if (/向左环绕|左环绕|orbit\s*left/.test(value)) return "orbit-left";
  if (/向右环绕|右环绕|orbit\s*right/.test(value)) return "orbit-right";
  if (/镜头.{0,6}(?:升高|上升|升起)|crane\s*up|boom\s*up/.test(value)) return "crane-up";
  if (/镜头.{0,6}(?:降低|下降|下沉)|crane\s*down|boom\s*down/.test(value)) return "crane-down";
  if (/镜头.{0,6}(?:左移|向左横移)|truck\s*left|dolly\s*left/.test(value)) return "truck-left";
  if (/镜头.{0,6}(?:右移|向右横移)|truck\s*right|dolly\s*right/.test(value)) return "truck-right";
  if (/镜头.{0,6}(?:左摇|向左摇)|pan\s*left/.test(value)) return "pan-left";
  if (/镜头.{0,6}(?:右摇|向右摇)|pan\s*right/.test(value)) return "pan-right";
  if (/镜头.{0,6}(?:后拉|拉远|拉开)|dolly\s*out|pull\s*back|zoom\s*out/.test(value)) return "pull-out";
  if (/镜头.{0,6}(?:推进|推近|靠近)|dolly\s*in|push\s*in|zoom\s*in/.test(value)) return "push-in";
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
  if (!frames.length) return null;
  let first = frames[0], last = frames[0];
  let before: T | undefined, after: T | undefined;
  // Match stable sorting, including duplicate times, without sorting or copying
  // the track on every playback frame. Imported tracks may be unsorted.
  for (const frame of frames) {
    if (frame.time < first.time) first = frame;
    if (frame.time >= last.time) last = frame;
    if (frame.time < time && (!before || frame.time >= before.time)) before = frame;
    if (frame.time >= time && (!after || frame.time < after.time)) after = frame;
  }
  if (time <= first.time) return { before: first, after: first, amount: 0 };
  if (time >= last.time) return { before: last, after: last, amount: 0 };
  if (!before || !after) return null;
  const span = Math.max(1e-6, after.time - before.time);
  return { before, after, amount: easing((time - before.time) / span, before.interpolation) };
}

function interpolateSnapshot<T>(before: Record<string, T> = {}, after: Record<string, T> = {}, amount: number, interpolate: (a: T, b: T, t: number) => T) {
  const result: Record<string, T> = {};
  for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const start = before[name] ?? after[name];
    const end = after[name] ?? start;
    if (start && end) result[name] = interpolate(start, end, amount);
  }
  return result;
}

function evaluatePose(track: Extract<AnimationTrack, { kind: "pose" }>, time: number) {
  const pair = framePair(track.keyframes, time);
  if (!pair) return undefined;
  const bones = interpolateSnapshot(pair.before.bones, pair.after.bones, pair.amount, slerpQuaternion);
  const bonePositions = interpolateSnapshot(pair.before.bonePositions ?? {}, pair.after.bonePositions ?? {}, pair.amount, lerpVec3);
  const selected = pair.amount < 0.5 ? pair.before : pair.after;
  const beforeRig = pair.before.rigPosition ?? pair.after.rigPosition;
  const afterRig = pair.after.rigPosition ?? beforeRig;
  return {
    poseId: selected.poseId,
    poseIndex: selected.poseIndex,
    bones,
    bonePositions: Object.keys(bonePositions).length ? bonePositions : undefined,
    rigPosition: beforeRig && afterRig ? lerpVec3(beforeRig, afterRig, pair.amount) : undefined,
  };
}

export function evaluateAnimationShot(shot: AnimationShot | undefined, localTime: number): EvaluatedAnimation {
  if (!shot) return {};
  const time = Math.min(shot.duration, Math.max(0, localTime));
  const result: EvaluatedAnimation = {};
  for (const track of shot.tracks) {
    if (!track.enabled) continue;
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
  }
  return result;
}

function emptyAnimationShot(shotId: string, duration: number): AnimationShot {
  return {
    id: `anim_${shotId}`,
    shotId,
    duration: Math.max(1 / 120, duration),
    speed: 1,
    loop: false,
    motionId: null,
    cameraMotionId: null,
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
    motionRevision: 2,
    fps: Math.max(1, fps),
    autoKey: false,
    interpolation: "ease-in-out",
    shots: shots.map((shot) => emptyAnimationShot(shot.id, shot.duration)),
    motionLibrary: motionLibrary.map((motion) => ({ ...motion })),
    cameraMotionLibrary: cameraMotionLibrary.map((motion) => ({ ...motion })),
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
  base.motionRevision = value.motionRevision === 2 ? 2 : 1;
  base.shots = shots.map((shot) => {
    const stored = storedShots.find((item) => item?.shotId === shot.id);
    if (!stored || !Array.isArray(stored.tracks)) return emptyAnimationShot(shot.id, shot.duration);
    const fallback = emptyAnimationShot(shot.id, shot.duration);
    const storedMotionId = motionLibrary.some((motion) => motion.id === stored.motionId) ? stored.motionId as MotionId : null;
    const storedCameraMotionId = cameraMotionLibrary.some((motion) => motion.id === stored.cameraMotionId) ? stored.cameraMotionId as CameraMotionId : null;
    const generatedKeyIds = stored.tracks.flatMap((track) => Array.isArray(track.keyframes) ? track.keyframes.map((keyframe) => keyframe.id) : []).join(" ");
    const inferredMotionId = storedMotionId ?? motionLibrary.find((motion) => generatedKeyIds.includes(`${motion.id}_`))?.id ?? null;
    const inferredCameraMotionId = storedCameraMotionId ?? cameraMotionLibrary.find((motion) => generatedKeyIds.includes(`camera_${motion.id}_`))?.id ?? null;
    return {
      ...fallback,
      ...stored,
      id: stored.id || fallback.id,
      shotId: shot.id,
      duration: shot.duration,
      speed: Math.max(0.01, Number(stored.speed) || 1),
      motionId: inferredMotionId,
      cameraMotionId: inferredCameraMotionId,
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
