export type TimelineIssueCode =
  | "invalid-time"
  | "overlap"
  | "gap"
  | "unassigned"
  | "duration-mismatch";

export type TimelineIssue = {
  id: string;
  code: TimelineIssueCode;
  severity: "error" | "warning";
  message: string;
  line?: number;
  start?: number;
  end?: number;
};

export type TimelineAspectOverride<TSnapshot> = {
  ratio: string;
  snapshot: TSnapshot;
  updatedAt: number;
};

export type VideoShot<TSnapshot = unknown> = {
  id: string;
  index: number;
  start: number;
  end: number;
  duration: number;
  colorToken: string;
  color: string;
  title: string;
  promptText: string;
  transitionIn: "cut";
  sceneSnapshot: TSnapshot | null;
  aspectOverrides: Record<string, TimelineAspectOverride<TSnapshot>>;
  thumbnail: string;
  snapshotLocked: boolean;
  dirty: boolean;
};

export type VideoTimeline<TSnapshot = unknown> = {
  schemaVersion: "1.0";
  duration: number;
  fps: number;
  playhead: number;
  loop: boolean;
  loopMode: "all" | "shot";
  ripple: boolean;
  masterAspect: string;
  shots: VideoShot<TSnapshot>[];
  issues: TimelineIssue[];
  unassigned: string[];
  sourcePrompt: string;
  updatedAt: number;
};

export type TimelineParseResult = {
  timeline: VideoTimeline;
  issues: TimelineIssue[];
  unassigned: string[];
};

const DEFAULT_DURATION = 15;
const DEFAULT_FPS = 24;
const MAX_DURATION = 600;
const MAX_SHOTS = 100;
const EPSILON = 0.0001;

export const shotColorPalette = [
  "#2684FF",
  "#9B63E8",
  "#E45B7A",
  "#E5872F",
  "#1F9E7A",
  "#4E70D8",
  "#C55A32",
  "#2B8CA8",
  "#B3578D",
  "#6C7F31",
  "#6E5BC7",
  "#D06B45",
] as const;

function roundTime(value: number, fps = DEFAULT_FPS) {
  const safeFps = Math.max(1, fps);
  return Math.round(value * safeFps) / safeFps;
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableShotId(start: number, end: number, text: string, occurrence: number) {
  const hash = hashText(`${start.toFixed(3)}|${end.toFixed(3)}|${text}|${occurrence}`);
  return `shot_${hash.toString(36).padStart(7, "0")}`;
}

export function shotColorForId(id: string, index: number, previous?: string, excluded: ReadonlySet<string> = new Set()) {
  let paletteIndex = (hashText(id) + index * 3) % shotColorPalette.length;
  let attempts = 0;
  while ((shotColorPalette[paletteIndex] === previous || excluded.has(shotColorPalette[paletteIndex])) && attempts < shotColorPalette.length) {
    paletteIndex = (paletteIndex + 5) % shotColorPalette.length;
    attempts += 1;
  }
  return shotColorPalette[paletteIndex];
}

function timeTokenToSeconds(token: string) {
  const cleaned = token.trim();
  if (!cleaned.includes(":")) return Number(cleaned);
  const parts = cleaned.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return Number.NaN;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Number.NaN;
}

function cleanShotText(value: string) {
  return value.replace(/^[\s:：,，、.。\-—]+/, "").replace(/[。；;\s]+$/, "").trim();
}

function shotTitle(text: string, index: number) {
  const compact = text.replace(/[，,。；;：:]/g, " ").replace(/\s+/g, " ").trim();
  return compact.slice(0, 24) || `Shot ${String(index + 1).padStart(2, "0")}`;
}

function metadataFromPrompt(prompt: string) {
  const durationMatch = prompt.match(/(?:总时长|项目时长|total\s*duration)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:秒|s|seconds?)?/i);
  const fpsMatch = prompt.match(/(?:帧率\s*[:：]?\s*)?(\d+(?:\.\d+)?)\s*fps\b/i);
  const ratioMatch = prompt.match(/(?:画面|画幅|比例|aspect)?\s*(21:9|16:9|9:16|4:5|3:4|4:3|3:2|2:3|1:1)\b/i);
  return {
    declaredDuration: durationMatch ? Number(durationMatch[1]) : null,
    fps: fpsMatch ? Math.min(120, Math.max(1, Number(fpsMatch[1]))) : DEFAULT_FPS,
    ratio: ratioMatch?.[1] ?? "16:9",
  };
}

const explicitRangePattern = /^(?:镜头\s*\d+\s*[:：、.\-—]\s*)?(?:第\s*)?(\d+(?::\d{1,2}(?:\.\d+)?)?(?:\.\d+)?)\s*(?:秒)?\s*(?:-|–|—|~|～|至|到)\s*(\d+(?::\d{1,2}(?:\.\d+)?)?(?:\.\d+)?)\s*(?:秒|s|seconds?)?\s*[:：\-—]?\s*(.+)$/i;
const durationOnlyPattern = /^(?:镜头|shot)\s*(\d+)?\s*[（(]\s*(\d+(?:\.\d+)?)\s*(?:秒|s|seconds?)\s*[）)]\s*[:：\-—]?\s*(.+)$/i;
const durationSentencePattern = /^(?:持续|时长|duration)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:秒|s|seconds?)\s*[:：\-—]?\s*(.+)$/i;

type ParsedCandidate = { start: number; end: number; text: string; line: number; occurrence: number };

export function createEmptyTimeline<TSnapshot = unknown>(aspect = "16:9", fps = DEFAULT_FPS): VideoTimeline<TSnapshot> {
  return {
    schemaVersion: "1.0",
    duration: DEFAULT_DURATION,
    fps,
    playhead: 0,
    loop: false,
    loopMode: "all",
    ripple: true,
    masterAspect: aspect,
    shots: [],
    issues: [],
    unassigned: [],
    sourcePrompt: "",
    updatedAt: 0,
  };
}

export function parseTimelinePrompt(prompt: string): TimelineParseResult {
  const sourcePrompt = prompt.trim();
  const metadata = metadataFromPrompt(sourcePrompt);
  const issues: TimelineIssue[] = [];
  const unassignedEntries: Array<{ text: string; line: number }> = [];
  const pushUnassigned = (text: string, line: number) => unassignedEntries.push({ text, line });
  const candidates: ParsedCandidate[] = [];
  let cursor = 0;
  let occurrence = 0;

  const lines = sourcePrompt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line, lineIndex) => {
    if (/(?:总时长|项目时长|total\s*duration|fps|画面|画幅|比例|aspect)/i.test(line)
      && !explicitRangePattern.test(line)
      && !durationOnlyPattern.test(line)) return;

    const explicit = line.match(explicitRangePattern);
    const durationOnly = line.match(durationOnlyPattern) ?? line.match(durationSentencePattern);
    if (explicit) {
      const start = timeTokenToSeconds(explicit[1]);
      const end = timeTokenToSeconds(explicit[2]);
      const text = cleanShotText(explicit[3]);
      candidates.push({ start, end, text, line: lineIndex + 1, occurrence });
      cursor = Number.isFinite(end) ? Math.max(cursor, end) : cursor;
      occurrence += 1;
      return;
    }
    if (durationOnly) {
      const durationIndex = durationOnly.length === 4 ? 2 : 1;
      const textIndex = durationOnly.length === 4 ? 3 : 2;
      const duration = Number(durationOnly[durationIndex]);
      const text = cleanShotText(durationOnly[textIndex]);
      candidates.push({ start: cursor, end: cursor + duration, text, line: lineIndex + 1, occurrence });
      cursor += duration;
      occurrence += 1;
      return;
    }

    if (/\d+\s*(?:秒|s)|\d+\s*[-至到~～]\s*\d+/i.test(line)) {
      issues.push({
        id: `invalid-${lineIndex}`,
        code: "invalid-time",
        severity: "error",
        message: `第 ${lineIndex + 1} 行的时间格式无法解析`,
        line: lineIndex + 1,
      });
    }
    pushUnassigned(line, lineIndex + 1);
  });

  const shots: VideoShot[] = [];
  let previousEnd = 0;
  let previousColor: string | undefined;
  const usedColors = new Set<string>();
  candidates.slice(0, MAX_SHOTS).forEach((candidate, candidateIndex) => {
    const start = roundTime(candidate.start, metadata.fps);
    const end = roundTime(candidate.end, metadata.fps);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || end > MAX_DURATION + EPSILON) {
      issues.push({
        id: `invalid-${candidate.line}-${candidateIndex}`,
        code: "invalid-time",
        severity: "error",
        message: `第 ${candidate.line} 行的开始或结束时间无效`,
        line: candidate.line,
        start,
        end,
      });
      pushUnassigned(candidate.text, candidate.line);
      return;
    }
    if (start < previousEnd - EPSILON) {
      issues.push({
        id: `overlap-${candidate.line}-${candidateIndex}`,
        code: "overlap",
        severity: "error",
        message: `第 ${candidate.line} 行与上一镜头重叠，已放入待分配列表`,
        line: candidate.line,
        start,
        end,
      });
      pushUnassigned(candidate.text, candidate.line);
      return;
    }
    if (start > previousEnd + EPSILON) {
      issues.push({
        id: `gap-${candidate.line}-${candidateIndex}`,
        code: "gap",
        severity: "warning",
        message: `${formatTimecode(previousEnd)}–${formatTimecode(start)} 存在空白区间`,
        line: candidate.line,
        start: previousEnd,
        end: start,
      });
    }
    const id = stableShotId(start, end, candidate.text, candidate.occurrence);
    const color = shotColorForId(id, shots.length, previousColor, usedColors);
    previousColor = color;
    usedColors.add(color);
    shots.push({
      id,
      index: shots.length + 1,
      start,
      end,
      duration: roundTime(end - start, metadata.fps),
      colorToken: `shot-color-${String((hashText(id) % shotColorPalette.length) + 1).padStart(2, "0")}`,
      color,
      title: shotTitle(candidate.text, candidateIndex),
      promptText: candidate.text,
      transitionIn: "cut",
      sceneSnapshot: null,
      aspectOverrides: {},
      thumbnail: "",
      snapshotLocked: false,
      dirty: false,
    });
    previousEnd = end;
  });

  const unassigned = unassignedEntries.sort((left, right) => left.line - right.line).map((entry) => entry.text);
  if (unassigned.length) {
    issues.push({
      id: "unassigned",
      code: "unassigned",
      severity: "warning",
      message: `${unassigned.length} 段文字尚未分配到时间轴`,
    });
  }

  const lastEnd = shots.at(-1)?.end ?? 0;
  const declaredDuration = metadata.declaredDuration;
  if (declaredDuration !== null && Number.isFinite(declaredDuration) && declaredDuration + EPSILON < lastEnd) {
    issues.push({
      id: "duration-mismatch",
      code: "duration-mismatch",
      severity: "error",
      message: `声明总时长 ${declaredDuration}s 小于最后镜头结束时间 ${lastEnd}s`,
    });
  }
  const duration = clampDuration(Math.max(declaredDuration ?? 0, lastEnd || DEFAULT_DURATION));
  const timeline: VideoTimeline = {
    ...createEmptyTimeline(metadata.ratio, metadata.fps),
    duration,
    shots,
    issues,
    unassigned,
    sourcePrompt,
    updatedAt: 1,
  };
  return { timeline, issues, unassigned };
}

function clampDuration(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_DURATION;
  return Math.min(MAX_DURATION, Math.max(0.1, value));
}

function validShot<TSnapshot>(value: unknown, index: number, fps: number): VideoShot<TSnapshot> | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<VideoShot<TSnapshot>>;
  const start = Number(raw.start);
  const end = Number(raw.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) return null;
  const id = typeof raw.id === "string" && raw.id ? raw.id : stableShotId(start, end, String(raw.promptText ?? ""), index);
  const color = typeof raw.color === "string" && /^#[\da-f]{6}$/i.test(raw.color) ? raw.color : shotColorForId(id, index);
  return {
    id,
    index: index + 1,
    start: roundTime(start, fps),
    end: roundTime(end, fps),
    duration: roundTime(end - start, fps),
    colorToken: typeof raw.colorToken === "string" ? raw.colorToken : `shot-color-${String((index % shotColorPalette.length) + 1).padStart(2, "0")}`,
    color,
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim().slice(0, 80) : shotTitle(String(raw.promptText ?? ""), index),
    promptText: typeof raw.promptText === "string" ? raw.promptText : "",
    transitionIn: "cut",
    sceneSnapshot: raw.sceneSnapshot ?? null,
    aspectOverrides: raw.aspectOverrides && typeof raw.aspectOverrides === "object" ? raw.aspectOverrides : {},
    thumbnail: typeof raw.thumbnail === "string" ? raw.thumbnail : "",
    snapshotLocked: Boolean(raw.snapshotLocked),
    dirty: Boolean(raw.dirty),
  };
}

export function normalizeVideoTimeline<TSnapshot = unknown>(value: unknown, fallbackAspect = "16:9"): VideoTimeline<TSnapshot> {
  if (!value || typeof value !== "object") return createEmptyTimeline<TSnapshot>(fallbackAspect);
  const raw = value as Partial<VideoTimeline<TSnapshot>>;
  const fps = Number.isFinite(Number(raw.fps)) ? Math.min(120, Math.max(1, Number(raw.fps))) : DEFAULT_FPS;
  const shots = Array.isArray(raw.shots)
    ? raw.shots.slice(0, MAX_SHOTS).map((shot, index) => validShot<TSnapshot>(shot, index, fps)).filter((shot): shot is VideoShot<TSnapshot> => Boolean(shot))
    : [];
  shots.sort((left, right) => left.start - right.start || left.index - right.index);
  shots.forEach((shot, index) => { shot.index = index + 1; });
  const lastEnd = shots.at(-1)?.end ?? 0;
  const duration = clampDuration(Math.max(Number(raw.duration) || 0, lastEnd || DEFAULT_DURATION));
  return {
    schemaVersion: "1.0",
    duration,
    fps,
    playhead: Math.min(duration, Math.max(0, Number(raw.playhead) || 0)),
    loop: Boolean(raw.loop),
    loopMode: raw.loopMode === "shot" ? "shot" : "all",
    ripple: raw.ripple !== false,
    masterAspect: typeof raw.masterAspect === "string" ? raw.masterAspect : fallbackAspect,
    shots,
    issues: Array.isArray(raw.issues) ? raw.issues.filter((issue): issue is TimelineIssue => Boolean(issue && typeof issue === "object")) : [],
    unassigned: Array.isArray(raw.unassigned) ? raw.unassigned.filter((item): item is string => typeof item === "string") : [],
    sourcePrompt: typeof raw.sourcePrompt === "string" ? raw.sourcePrompt : "",
    updatedAt: Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : 0,
  };
}

export function formatTimecode(value: number, includeFrames = false, fps = DEFAULT_FPS) {
  const safe = Math.max(0, value);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  const frames = Math.floor((safe - Math.floor(safe)) * fps + EPSILON);
  const base = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return includeFrames ? `${base}:${String(frames).padStart(2, "0")}` : base;
}

export function timelinePromptText(timeline: VideoTimeline) {
  const header = `总时长${timeline.duration}s，画面${timeline.masterAspect}，${timeline.fps}fps。`;
  const shots = timeline.shots.map((shot) => `${formatTimecode(shot.start)}-${formatTimecode(shot.end)}：${shot.promptText || shot.title}。`);
  return [header, ...shots].join("\n");
}
