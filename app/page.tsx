"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import {
  ArrowLeft,
  ArrowRight,
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowsLeftRight,
  ArrowsOutCardinal,
  Check,
  Camera,
  Copy,
  Cube,
  DownloadSimple,
  Eye,
  EyeSlash,
  FloppyDisk,
  GridFour,
  HouseLine,
  Info,
  Lightbulb,
  Lock,
  LockOpen,
  MagnifyingGlass,
  Minus,
  DotsThree,
  FunnelSimple,
  Perspective,
  Plus,
  Shuffle,
  SidebarSimple,
  SlidersHorizontal,
  Sparkle,
  Star,
  Trash,
  X,
} from "@phosphor-icons/react";
import {
  bodyOptions,
  defaultPose,
  directionOptions,
  getPoseCategoryLabel,
  getPoseCategoryLabelEn,
  getPoseTabLabel,
  handOptions,
  handLabelsEn,
  intensityOptions,
  intensityLabelsEn as poseIntensityLabelsEn,
  poseCategoryTabs,
  poseItems,
  poseCategoryLabelsEn,
  directionLabelsEn as poseDirectionLabelsEn,
  bodyLabelsEn,
  styleLabelsEn,
  styleOptions,
  type PoseBody,
  type PoseCategory,
  type PoseCategoryTab,
  type PoseDirection,
  type PoseHand,
  type PoseIntensity,
  type PoseItem,
  type PoseStyle,
} from "./pose-data";
import {
  analyzePromptToPose,
  promptToPoseExamples,
  promptToPoseJson,
  type PromptToPoseResult,
  type SemanticPoseModifiers,
} from "./prompt-to-pose";
import {
  PerspectiveGridOverlay,
  cameraLinkedPerspective,
  clonePerspectiveGrid,
  drawPerspectiveOverlay,
  initialPerspectiveGrid,
  normalizePerspectiveGrid,
  perspectiveDefaultsForMode,
  rebuildGroundGrid,
  type PerspectiveGridMode,
  type PerspectiveGridState,
} from "./perspective-grid";

type Ratio = "16:9" | "9:16" | "3:2" | "2:3" | "4:3" | "3:4" | "1:1";
type Language = "en" | "zh";
type ToolMode = "translate" | "rotate" | "pose";
type InspectorTab = "model" | "camera" | "scene";
type QuickView = "featured" | "recent" | null;
type CameraPresetId = "commercial" | "cinematic" | "ecommerce" | "custom";
type ShotSize = "close" | "medium" | "full" | "long";
type LightingPresetId = "studio" | "cinematic" | "night" | "soft" | "custom";
type PromptPlatform = "midjourney" | "flux" | "gpt-image" | "seedance" | "jimeng";
type IKControlId =
  | "hips"
  | "chest"
  | "head"
  | "leftShoulder"
  | "rightShoulder"
  | "leftElbow"
  | "rightElbow"
  | "leftHand"
  | "rightHand"
  | "leftHandDirection"
  | "rightHandDirection"
  | "leftHip"
  | "rightHip"
  | "leftKnee"
  | "rightKnee"
  | "leftFoot"
  | "rightFoot"
  | "leftFootDirection"
  | "rightFootDirection";
type IKTargetMap = Partial<Record<IKControlId, [number, number, number]>>;

const ikControlDefinitions: ReadonlyArray<{ id: IKControlId; label: string; labelEn: string; kind: "core" | "joint" | "effector" | "direction" }> = [
  { id: "head", label: "头部朝向", labelEn: "Head Direction", kind: "effector" },
  { id: "chest", label: "胸腔", labelEn: "Chest", kind: "core" },
  { id: "hips", label: "骨盆", labelEn: "Pelvis", kind: "core" },
  { id: "leftShoulder", label: "左肩", labelEn: "Left Shoulder", kind: "joint" },
  { id: "rightShoulder", label: "右肩", labelEn: "Right Shoulder", kind: "joint" },
  { id: "leftElbow", label: "左肘", labelEn: "Left Elbow", kind: "joint" },
  { id: "rightElbow", label: "右肘", labelEn: "Right Elbow", kind: "joint" },
  { id: "leftHand", label: "左手", labelEn: "Left Hand", kind: "effector" },
  { id: "rightHand", label: "右手", labelEn: "Right Hand", kind: "effector" },
  { id: "leftHandDirection", label: "左手方向", labelEn: "Left Hand Direction", kind: "direction" },
  { id: "rightHandDirection", label: "右手方向", labelEn: "Right Hand Direction", kind: "direction" },
  { id: "leftHip", label: "左髋", labelEn: "Left Hip", kind: "joint" },
  { id: "rightHip", label: "右髋", labelEn: "Right Hip", kind: "joint" },
  { id: "leftKnee", label: "左膝", labelEn: "Left Knee", kind: "joint" },
  { id: "rightKnee", label: "右膝", labelEn: "Right Knee", kind: "joint" },
  { id: "leftFoot", label: "左脚", labelEn: "Left Foot", kind: "effector" },
  { id: "rightFoot", label: "右脚", labelEn: "Right Foot", kind: "effector" },
  { id: "leftFootDirection", label: "左脚方向", labelEn: "Left Foot Direction", kind: "direction" },
  { id: "rightFootDirection", label: "右脚方向", labelEn: "Right Foot Direction", kind: "direction" },
];

const directionOptionsEn = [
  ["Any", "any"], ["Front", "front"], ["Front Left 45°", "front-left"], ["Front Right 45°", "front-right"],
  ["Side", "side"], ["Back", "back"], ["Look Back", "look-back"],
] as const;

const intensityOptionsEn = [
  ["Any", "any"], ["Static", "static"], ["Light", "light"], ["Medium", "medium"], ["Strong", "strong"],
] as const;

const handOptionsEn = [
  ["Any", "any"], ["Natural", "natural"], ["Hip", "hip"], ["Pocket", "pocket"], ["Crossed", "crossed"],
  ["Behind", "behind"], ["Support", "support"], ["Face", "face"], ["Chin", "chin"], ["Raise", "raise"],
  ["Open", "open"], ["Fist", "fist"], ["Holding", "holding"],
] as const;

const bodyOptionsEn = [
  ["Any", "any"], ["Upright", "upright"], ["Forward", "forward"], ["Backward", "backward"],
  ["Side Lean", "side-lean"], ["Twist", "twist"], ["Turn", "turn"],
] as const;

const styleOptionsEn = [
  ["Any", "any"], ["Natural", "natural"], ["Fashion", "fashion"], ["Photo", "photo"], ["Sport", "sport"],
  ["Combat", "combat"], ["Hero", "hero"], ["Emotion", "emotion"], ["Dance", "dance"], ["Daily", "daily"], ["Commercial", "commercial"],
] as const;

const compactPoseTabLabelsEn: Record<PoseCategoryTab, string> = {
  all: "All", favorites: "Favorites", saved: "Saved", standing: "Stand", walking: "Walk", running: "Run", jumping: "Jump",
  squatting: "Squat", sitting: "Sit", kneeling: "Kneel", lying: "Lie", prone: "Prone", leaning: "Lean", ground: "Ground",
};

const promptToPoseExamplesEn = [
  "A warrior kneeling on one knee, holding a sword in the right hand, leaning forward and ready to fight",
  "A fashion model standing on the street with both hands in pockets, turning sideways and looking back",
  "An athlete sprinting forward at full speed, body leaning forward with strong motion",
  "A person sitting on a chair, resting one hand on the chin and looking to the side",
] as const;

type EditorState = {
  pose: number;
  mirrored: boolean;
  ratio: Ratio;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  fov: number;
  focalLength: number;
  cameraHeight: number;
  shotSize: ShotSize;
  cameraPreset: CameraPresetId;
  lightingPreset: LightingPresetId;
  keyLight: number;
  fillLight: number;
  rimLight: number;
  exposure: number;
  keyColor: string;
  fillColor: string;
  rimColor: string;
  ikTargets: IKTargetMap;
  semanticModifiers: SemanticPoseModifiers;
  background: string;
  shadow: boolean;
  grid: boolean;
  perspectiveGrid: PerspectiveGridState;
  visible: boolean;
};

type SavedPoseRecord = {
  id: string;
  basePoseId: string;
  name: string;
  nameEn: string;
  category: PoseCategory;
  ikTargets: IKTargetMap;
  semanticModifiers: SemanticPoseModifiers;
  mirrored: boolean;
  thumbnail: string;
  updatedAt: number;
};

const initialState: EditorState = {
  pose: 0,
  mirrored: false,
  ratio: "16:9",
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 100,
  fov: 34,
  focalLength: 85,
  cameraHeight: 1.55,
  shotSize: "full",
  cameraPreset: "commercial",
  lightingPreset: "studio",
  keyLight: 4.6,
  fillLight: 1.35,
  rimLight: 2.1,
  exposure: 1.05,
  keyColor: "#ffffff",
  fillColor: "#e8f1ff",
  rimColor: "#cbd5ff",
  ikTargets: {},
  semanticModifiers: {},
  background: "#eef0f4",
  shadow: true,
  grid: false,
  perspectiveGrid: clonePerspectiveGrid(initialPerspectiveGrid),
  visible: true,
};

const ratioSize: Record<Ratio, [number, number]> = {
  "16:9": [1920, 1080],
  "9:16": [1080, 1920],
  "3:2": [1800, 1200],
  "2:3": [1200, 1800],
  "4:3": [1600, 1200],
  "3:4": [1200, 1600],
  "1:1": [1400, 1400],
};

const presetCameraPosition: [number, number, number] = [4.7, 2.8, 8.4];
const presetCameraTarget: [number, number, number] = [0, 1.55, 0];
const presetCameraFov = 34;

const cameraPresets: Record<Exclude<CameraPresetId, "custom">, {
  label: string;
  labelEn: string;
  focalLength: number;
  position: [number, number, number];
  target: [number, number, number];
  shotSize: ShotSize;
}> = {
  commercial: { label: "商业摄影", labelEn: "Commercial", focalLength: 85, position: [4.7, 2.8, 8.4], target: [0, 1.55, 0], shotSize: "full" },
  cinematic: { label: "电影英雄", labelEn: "Cinematic Hero", focalLength: 24, position: [5.4, 1.1, 7.4], target: [0, 1.9, 0], shotSize: "full" },
  ecommerce: { label: "电商模特", labelEn: "E-commerce", focalLength: 50, position: [0, 2.25, 8.7], target: [0, 1.65, 0], shotSize: "full" },
};

const shotDistance: Record<ShotSize, number> = { close: 3.8, medium: 5.1, full: 8.5, long: 11.5 };
const shotLabels: Record<ShotSize, string> = { close: "特写", medium: "半身", full: "全身", long: "远景" };
const shotLabelsEn: Record<ShotSize, string> = { close: "close-up", medium: "medium", full: "full-body", long: "long" };
const directionLabelsEn: Record<PoseDirection, string> = {
  front: "front",
  "front-left": "front-left three-quarter",
  "front-right": "front-right three-quarter",
  side: "side",
  back: "back",
  "look-back": "looking back",
};
const intensityLabelsEn: Record<PoseIntensity, string> = { static: "static", light: "subtle", medium: "dynamic", strong: "strong dynamic" };
const cameraPresetLabelsEn: Record<CameraPresetId, string> = {
  commercial: "commercial photography",
  cinematic: "cinematic hero camera",
  ecommerce: "e-commerce model photography",
  custom: "custom camera",
};
const lightingPresetLabelsEn: Record<LightingPresetId, string> = {
  studio: "commercial studio lighting",
  cinematic: "cinematic side rim lighting",
  night: "blue and orange night lighting",
  soft: "soft portrait lighting",
  custom: "custom lighting",
};

const lightingPresets: Record<Exclude<LightingPresetId, "custom">, {
  label: string;
  labelEn: string;
  key: number;
  fill: number;
  rim: number;
  exposure: number;
  background: string;
  keyColor: number;
  fillColor: number;
  rimColor: number;
}> = {
  studio: { label: "商业棚拍", labelEn: "Studio", key: 4.6, fill: 1.35, rim: 2.1, exposure: 1.05, background: "#eef0f4", keyColor: 0xffffff, fillColor: 0xe8f1ff, rimColor: 0xcbd5ff },
  cinematic: { label: "电影侧逆光", labelEn: "Cinematic Rim", key: 3.8, fill: 0.55, rim: 4.2, exposure: 0.95, background: "#dfe4ec", keyColor: 0xffd8b5, fillColor: 0x92a9ce, rimColor: 0x9ab7ff },
  night: { label: "蓝橙夜景", labelEn: "Blue & Orange", key: 3.4, fill: 0.7, rim: 4.8, exposure: 0.9, background: "#cbd4df", keyColor: 0xffb06b, fillColor: 0x6f91d6, rimColor: 0x7aa7ff },
  soft: { label: "柔光人像", labelEn: "Soft Portrait", key: 3.1, fill: 2.2, rim: 1.1, exposure: 1.08, background: "#f1f2f4", keyColor: 0xfff5e9, fillColor: 0xf0f5ff, rimColor: 0xe3e7ff },
};

type JointPose = {
  hips: [number, number, number];
  torso: [number, number, number];
  chest: [number, number, number];
  neck: [number, number, number];
  head: [number, number, number];
  leftShoulder: [number, number, number];
  leftArm: [number, number, number];
  leftForearm: [number, number, number];
  leftHand: [number, number, number];
  rightShoulder: [number, number, number];
  rightArm: [number, number, number];
  rightForearm: [number, number, number];
  rightHand: [number, number, number];
  leftLeg: [number, number, number];
  leftShin: [number, number, number];
  leftFoot: [number, number, number];
  rightLeg: [number, number, number];
  rightShin: [number, number, number];
  rightFoot: [number, number, number];
};

const zeroRotation: [number, number, number] = [0, 0, 0];
const jointPose = (values: Partial<JointPose> = {}): JointPose => ({
  hips: zeroRotation,
  torso: zeroRotation,
  chest: zeroRotation,
  neck: zeroRotation,
  head: zeroRotation,
  leftShoulder: zeroRotation,
  leftArm: zeroRotation,
  leftForearm: zeroRotation,
  leftHand: zeroRotation,
  rightShoulder: zeroRotation,
  rightArm: zeroRotation,
  rightForearm: zeroRotation,
  rightHand: zeroRotation,
  leftLeg: zeroRotation,
  leftShin: zeroRotation,
  leftFoot: zeroRotation,
  rightLeg: zeroRotation,
  rightShin: zeroRotation,
  rightFoot: zeroRotation,
  ...values,
});

const jointPoses: JointPose[] = [
  jointPose(),
  jointPose({ torso: [0, 5, -7], head: [0, -8, 5], leftArm: [8, -8, -42], leftForearm: [2, 0, 82], rightArm: [-4, 4, 22], rightForearm: [0, 0, -18], leftLeg: [0, 0, -6], rightLeg: [0, 0, 8] }),
  jointPose({ torso: [-8, 0, 0], head: [8, 0, 0], leftArm: [4, 2, -54], leftForearm: [0, 0, 72], rightArm: [-4, -2, 54], rightForearm: [0, 0, -72], leftLeg: [-4, 0, -12], rightLeg: [4, 0, 12] }),
  jointPose({ torso: [15, -6, -6], head: [-12, 12, 4], leftArm: [58, 0, -18], leftForearm: [-34, 0, 14], rightArm: [-62, 0, 18], rightForearm: [36, 0, -14], leftLeg: [-58, 0, -10], leftShin: [72, 0, 5], rightLeg: [54, 0, 12], rightShin: [8, 0, -4] }),
  jointPose({ torso: [2, 4, 2], head: [-2, -6, 0], leftArm: [38, 0, -10], leftForearm: [18, 0, 18], rightArm: [-36, 0, 10], rightForearm: [-24, 0, -18], leftLeg: [-38, 0, -6], leftShin: [30, 0, 2], rightLeg: [36, 0, 7], rightShin: [-18, 0, -2] }),
  jointPose({ torso: [-12, 0, 0], head: [8, 0, 0], leftArm: [-46, -8, -56], leftForearm: [32, 0, 34], rightArm: [-42, 8, 58], rightForearm: [28, 0, -34], leftLeg: [-70, 0, -18], leftShin: [96, 0, 6], rightLeg: [-44, 0, 22], rightShin: [108, 0, -8] }),
  jointPose({ torso: [18, 2, -3], head: [-10, -10, 3], leftArm: [28, 0, -28], leftForearm: [24, 0, 64], rightArm: [12, 0, 36], rightForearm: [18, 0, -64], leftLeg: [-12, 0, -14], leftShin: [18, 0, 3], rightLeg: [72, 0, 16], rightShin: [-104, 0, -6] }),
  jointPose({ torso: [5, -8, -4], head: [-3, 14, 3], leftArm: [-26, 4, -58], leftForearm: [0, 0, 94], rightArm: [-18, -4, 48], rightForearm: [0, 0, -88], leftLeg: [-30, 0, -14], leftShin: [42, 0, 4], rightLeg: [28, 0, 14], rightShin: [-28, 0, -4] }),
  jointPose({ torso: [12, 10, -7], head: [-8, -14, 4], leftArm: [-82, -4, -18], leftForearm: [10, 0, 16], rightArm: [12, 4, 46], rightForearm: [0, 0, -96], leftLeg: [-42, 0, -10], leftShin: [44, 0, 3], rightLeg: [38, 0, 12], rightShin: [-26, 0, -3] }),
  jointPose({ torso: [-4, 2, 0], head: [3, -4, 0], leftArm: [-36, 0, -74], leftForearm: [-20, 0, 22], rightArm: [-42, 0, 76], rightForearm: [-18, 0, -22], leftLeg: [-12, 0, -8], leftShin: [18, 0, 2], rightLeg: [16, 0, 9], rightShin: [-20, 0, -2] }),
  jointPose({ torso: [8, -8, -5], head: [-6, 12, 3], leftArm: [-22, 4, -46], leftForearm: [-24, 0, 76], rightArm: [-88, -4, 22], rightForearm: [-10, 0, -20], leftLeg: [-50, 0, -16], leftShin: [58, 0, 5], rightLeg: [24, 0, 18], rightShin: [-16, 0, -4] }),
  jointPose({ torso: [-5, 0, 0], head: [6, 0, 0], leftArm: [-8, 0, -34], leftForearm: [-40, 0, 26], rightArm: [-8, 0, 34], rightForearm: [-40, 0, -26], leftLeg: [-8, 0, -8], rightLeg: [-8, 0, 8] }),
  jointPose({ torso: [0, 0, 0], head: [0, 0, 0], leftArm: [0, 0, -88], rightArm: [0, 0, 88], leftLeg: [0, 0, -10], rightLeg: [0, 0, 10] }),
  jointPose({ torso: [0, -4, 4], head: [0, 12, -3], leftArm: [0, 0, -22], leftForearm: [0, 0, 28], rightArm: [-72, 0, 54], rightForearm: [0, 0, -82], leftLeg: [0, 0, -5], rightLeg: [0, 0, 6] }),
  jointPose({ torso: [4, 8, -5], head: [-8, -14, 8], leftArm: [-28, 0, -18], leftForearm: [0, 0, 112], rightArm: [6, 0, 24], rightForearm: [0, 0, -70], leftLeg: [-4, 0, -7], rightLeg: [4, 0, 8] }),
  jointPose({ torso: [0, -4, 16], head: [0, 12, -12], leftArm: [-28, 0, -74], leftForearm: [0, 0, 52], rightArm: [22, 0, 48], rightForearm: [0, 0, -86], leftLeg: [-30, 0, -22], leftShin: [38, 0, 6], rightLeg: [38, 0, 18], rightShin: [-30, 0, -5] }),
  jointPose({ torso: [-4, 18, -10], head: [8, -30, 8], leftArm: [-70, 0, -34], leftForearm: [12, 0, 60], rightArm: [-28, 0, 78], rightForearm: [-22, 0, -34], leftLeg: [-46, 0, -12], leftShin: [66, 0, 5], rightLeg: [16, 0, 24], rightShin: [-18, 0, -6] }),
  jointPose({ torso: [0, -6, 8], head: [0, 16, -5], leftArm: [-18, 0, -46], leftForearm: [0, 0, 78], rightArm: [-30, 0, 62], rightForearm: [0, 0, -48], leftLeg: [-8, 0, -8], leftShin: [14, 0, 2], rightLeg: [-76, 0, 72], rightShin: [42, 0, -16] }),
  jointPose({ torso: [0, 10, 5], head: [0, -32, -5], leftArm: [-12, 6, -34], leftForearm: [0, -8, 54], rightArm: [22, -6, 38], rightForearm: [-16, 8, -82], leftLeg: [0, -4, -6], leftShin: [0, 0, 5], rightLeg: [0, 4, 7], rightShin: [0, 0, -5] }),
  jointPose({ torso: [24, 0, -4], head: [-16, 0, 3], leftArm: [32, 0, -48], leftForearm: [34, 0, 76], rightArm: [28, 0, 46], rightForearm: [30, 0, -72], leftLeg: [46, 0, -18], leftShin: [-72, 0, 8], rightLeg: [38, 0, 20], rightShin: [-64, 0, -8] }),
];

const cloneJointPose = (source: JointPose): JointPose => ({
  hips: [...source.hips],
  torso: [...source.torso],
  chest: [...source.chest],
  neck: [...source.neck],
  head: [...source.head],
  leftShoulder: [...source.leftShoulder],
  leftArm: [...source.leftArm],
  leftForearm: [...source.leftForearm],
  leftHand: [...source.leftHand],
  rightShoulder: [...source.rightShoulder],
  rightArm: [...source.rightArm],
  rightForearm: [...source.rightForearm],
  rightHand: [...source.rightHand],
  leftLeg: [...source.leftLeg],
  leftShin: [...source.leftShin],
  leftFoot: [...source.leftFoot],
  rightLeg: [...source.rightLeg],
  rightShin: [...source.rightShin],
  rightFoot: [...source.rightFoot],
});

// V2 authoring follows the document's basePose + key bone differences model.
// Each category function starts from one readable base and only overrides the
// joints that give the named action its meaning.
const poseWithBase = (base: JointPose, values: Partial<JointPose> = {}): JointPose => ({
  ...cloneJointPose(base),
  ...values,
});

function createStandingJointPose(name: string): JointPose {
  const base = jointPose({
    hips: [0, 0, 0], torso: [0, 0, -1], chest: [0, 0, 1], head: [0, 0, 1],
    leftShoulder: [0, 0, -3], rightShoulder: [0, 0, 3],
    leftArm: [2, 0, -14], leftForearm: [2, 0, 18],
    rightArm: [2, 0, 14], rightForearm: [2, 0, -18],
    leftLeg: [0, 0, -9], rightLeg: [4, 0, 11],
  });
  switch (name) {
    case "双脚并拢站立": return poseWithBase(base, { torso: [0, 0, 0], leftLeg: [0, 0, 0], rightLeg: [0, 0, 0], leftArm: [0, 0, -10], rightArm: [0, 0, 10] });
    case "双脚分开站立": return poseWithBase(base, { torso: [0, 0, -2], leftLeg: [0, 0, -24], rightLeg: [0, 0, 24] });
    case "单腿微屈站立": return poseWithBase(base, { torso: [0, 0, -3], leftLeg: [0, 0, -10], rightLeg: [-14, 0, 15], rightShin: [-26, 0, -4] });
    case "重心左移": return poseWithBase(base, { torso: [0, 0, -7], leftLeg: [0, 0, -12], rightLeg: [14, 0, 16], rightShin: [-24, 0, -4] });
    case "重心右移": return poseWithBase(base, { torso: [0, 0, 7], leftLeg: [14, 0, -16], leftShin: [-24, 0, 4], rightLeg: [0, 0, 12] });
    case "前后脚站立": return poseWithBase(base, { torso: [0, -4, -2], leftLeg: [-14, 0, -11], leftShin: [8, 0, 3], rightLeg: [16, 0, 12], rightShin: [-10, 0, -3] });
    case "交叉腿站立": return poseWithBase(base, { torso: [0, 5, -4], leftLeg: [0, 10, -11], rightLeg: [-10, -12, 11], rightShin: [-18, 0, -3] });
    case "单手叉腰": return poseWithBase(base, { torso: [0, 5, -5], head: [0, -7, 4], leftArm: [8, -8, -42], leftForearm: [2, 0, 82], rightLeg: [8, 0, 12] });
    case "双手叉腰": return poseWithBase(base, { torso: [0, 0, -4], leftArm: [8, -8, -42], leftForearm: [2, 0, 82], rightArm: [8, 8, 42], rightForearm: [2, 0, -82], leftLeg: [0, 0, -9], rightLeg: [0, 0, 9] });
    case "双手插兜": return poseWithBase(base, { torso: [0, 3, -4], leftArm: [12, 0, -22], leftForearm: [4, 0, 62], rightArm: [12, 0, 22], rightForearm: [4, 0, -62], leftLeg: [0, 0, -9], rightLeg: [0, 0, 10] });
    case "单手插兜": return poseWithBase(base, { torso: [0, 4, -4], leftArm: [12, 0, -22], leftForearm: [4, 0, 62], rightArm: [0, 0, 18], rightForearm: [2, 0, -20], leftLeg: [0, 0, -9], rightLeg: [7, 0, 12] });
    case "双臂抱胸": return poseWithBase(base, { torso: [0, 4, -2], leftArm: [-42, 8, 37], leftForearm: [-18, 0, 55], rightArm: [-18, -8, -37], rightForearm: [8, 0, -55] });
    case "双手背后": return poseWithBase(base, { torso: [-2, 0, 2], leftArm: [18, 10, -28], leftForearm: [0, 0, 74], rightArm: [18, -10, 28], rightForearm: [0, 0, -74] });
    case "双手身前交叠": return poseWithBase(base, { torso: [1, 0, -2], leftArm: [12, 0, -20], leftForearm: [2, 0, 58], rightArm: [12, 0, 20], rightForearm: [2, 0, -58] });
    case "单手扶下巴": return poseWithBase(base, { torso: [3, 7, -4], head: [-8, -12, 6], leftArm: [30, 0, -35], leftForearm: [8, 0, 112] });
    case "单手扶脸": return poseWithBase(base, { torso: [2, 5, -3], head: [-7, -10, 5], leftArm: [26, 0, -42], leftForearm: [6, 0, 122] });
    case "单手摸头": return poseWithBase(base, { torso: [1, 4, -3], head: [-5, -8, 4], leftArm: [-18, 0, -72], leftForearm: [4, 0, 126] });
    case "单手举起": return poseWithBase(base, { torso: [-2, -3, -2], head: [-8, 8, 2], rightArm: [-24, 0, 136], rightForearm: [0, 0, 20] });
    case "双臂张开": return poseWithBase(base, { torso: [-3, 0, 0], leftArm: [0, 0, -92], leftForearm: [0, 0, 16], rightArm: [0, 0, 92], rightForearm: [0, 0, -16], leftLeg: [0, 0, -12], rightLeg: [0, 0, 12] });
    case "侧身站立": return poseWithBase(base, { hips: [0, 78, 0], torso: [0, 8, -3], head: [0, -8, 3], leftLeg: [0, 0, -10], rightLeg: [8, 0, 12] });
    case "侧身回眸": return poseWithBase(base, { hips: [0, 74, 0], torso: [0, 18, -3], chest: [0, 12, 1], neck: [0, -18, 0], head: [-3, -48, 4], leftArm: [2, 0, -18], rightArm: [4, 0, 22], leftLeg: [0, 0, -10], rightLeg: [10, 0, 13] });
    case "背身站立": return poseWithBase(base, { hips: [0, 180, 0], torso: [0, 0, 1], head: [0, 0, 0], leftArm: [1, 0, -16], rightArm: [1, 0, 16] });
    case "背身回头": return poseWithBase(base, { hips: [0, 180, 0], torso: [0, -18, 0], chest: [0, -16, 0], neck: [0, 28, 0], head: [-2, 54, 4], leftArm: [2, 0, -16], rightArm: [4, 0, 20], leftLeg: [0, 0, -8], rightLeg: [6, 0, 10] });
    default: return base;
  }
}

function createWalkingJointPose(name: string): JointPose {
  const base = jointPose({
    torso: [4, 0, -1], head: [-3, 0, 1],
    leftArm: [28, 0, -22], leftForearm: [10, 0, 38],
    rightArm: [-26, 0, 22], rightForearm: [-8, 0, -36],
    leftLeg: [-30, 0, -10], leftShin: [30, 0, 3],
    rightLeg: [28, 0, 11], rightShin: [-18, 0, -3],
  });
  switch (name) {
    case "向前迈步": return poseWithBase(base, { torso: [8, -2, -2], leftArm: [34, 0, -25], rightArm: [-32, 0, 25], leftLeg: [-48, 0, -14], leftShin: [42, 0, 5], rightLeg: [42, 0, 15], rightShin: [-28, 0, -5] });
    case "大步行走": return poseWithBase(base, { torso: [8, -3, -3], leftArm: [38, 0, -28], leftForearm: [12, 0, 48], rightArm: [-36, 0, 28], rightForearm: [-12, 0, -48], leftLeg: [-52, 0, -16], leftShin: [44, 0, 5], rightLeg: [46, 0, 17], rightShin: [-28, 0, -5] });
    case "缓慢行走": return poseWithBase(base, { torso: [2, 0, 0], leftArm: [16, 0, -16], leftForearm: [6, 0, 28], rightArm: [-14, 0, 16], rightForearm: [-6, 0, -26], leftLeg: [-20, 0, -8], leftShin: [20, 0, 2], rightLeg: [18, 0, 9], rightShin: [-12, 0, -2] });
    case "轻快行走": return poseWithBase(base, { torso: [6, 2, -2], head: [-5, -2, 1], leftArm: [36, 0, -30], leftForearm: [14, 0, 52], rightArm: [-34, 0, 30], rightForearm: [-12, 0, -50], leftLeg: [-42, 0, -14], leftShin: [50, 0, 5], rightLeg: [34, 0, 15], rightShin: [-24, 0, -4] });
    case "模特猫步": return poseWithBase(base, { torso: [2, 7, -5], head: [-2, -8, 4], leftArm: [18, 0, -18], leftForearm: [6, 0, 30], rightArm: [-16, 0, 18], rightForearm: [-6, 0, -30], leftLeg: [-42, 8, -7], leftShin: [34, 0, 3], rightLeg: [38, -8, 8], rightShin: [-20, 0, -3] });
    case "双手插兜行走": return poseWithBase(base, { torso: [4, 3, -4], leftArm: [12, 0, -22], leftForearm: [4, 0, 62], rightArm: [12, 0, 22], rightForearm: [4, 0, -62], leftLeg: [-30, 0, -10], rightLeg: [26, 0, 11] });
    case "单手插兜行走": return poseWithBase(base, { torso: [4, 3, -3], leftArm: [12, 0, -22], leftForearm: [4, 0, 62], rightArm: [-30, 0, 24], rightForearm: [-8, 0, -42] });
    case "边走边回头": return poseWithBase(base, { torso: [8, 20, -3], head: [-5, 64, 3], leftArm: [30, 0, -24], rightArm: [-28, 0, 24], leftLeg: [-36, 0, -12], rightLeg: [30, 0, 13] });
    case "侧向行走": return poseWithBase(base, { hips: [0, 72, 0], torso: [4, 8, -2], head: [-3, -8, 1], leftArm: [24, 0, -34], leftForearm: [8, 0, 42], rightArm: [-18, 0, 34], rightForearm: [-6, 0, -40], leftLeg: [-28, 0, -18], rightLeg: [24, 0, 19] });
    case "低头行走": return poseWithBase(base, { torso: [8, 0, 2], head: [22, 0, 0], leftArm: [18, 0, -18], rightArm: [-16, 0, 18], leftLeg: [-26, 0, -9], rightLeg: [22, 0, 10] });
    case "挥手行走": return poseWithBase(base, { torso: [4, -4, -2], head: [-3, 10, 1], rightArm: [-12, 0, 120], rightForearm: [0, 0, 54], leftLeg: [-34, 0, -11], rightLeg: [30, 0, 12] });
    default: return base;
  }
}

function createSquattingJointPose(name: string): JointPose {
  const base = jointPose({
    torso: [20, 0, -2], head: [-12, 0, 2],
    leftArm: [18, 0, -28], leftForearm: [8, 0, 54], rightArm: [18, 0, 28], rightForearm: [8, 0, -54],
    leftLeg: [-62, 0, -19], leftShin: [92, 0, 6], rightLeg: [-62, 0, 19], rightShin: [92, 0, -6],
  });
  switch (name) {
    case "半蹲": return poseWithBase(base, { torso: [12, 0, -1], leftLeg: [-42, 0, -16], leftShin: [66, 0, 5], rightLeg: [-42, 0, 16], rightShin: [66, 0, -5] });
    case "深蹲": return poseWithBase(base, { torso: [28, 0, -3], head: [-15, 0, 3], leftLeg: [-82, 0, -23], leftShin: [108, 0, 7], rightLeg: [-82, 0, 23], rightShin: [108, 0, -7] });
    case "双腿分开蹲": return poseWithBase(base, { leftLeg: [-68, 0, -30], leftShin: [96, 0, 9], rightLeg: [-68, 0, 30], rightShin: [96, 0, -9] });
    case "双腿并拢蹲": return poseWithBase(base, { torso: [24, 0, -2], leftLeg: [-70, 0, -8], leftShin: [98, 0, 3], rightLeg: [-70, 0, 8], rightShin: [98, 0, -3] });
    case "单腿侧伸低蹲": return poseWithBase(base, { torso: [28, 8, -4], head: [-16, -8, 3], leftLeg: [-82, 0, -16], leftShin: [108, 0, 6], rightLeg: [-16, 0, 48], rightShin: [6, 0, -14] });
    case "双手撑膝蹲": return poseWithBase(base, { torso: [32, 0, -4], leftArm: [38, 0, -30], leftForearm: [24, 0, 48], rightArm: [38, 0, 30], rightForearm: [24, 0, -48] });
    case "单手撑膝蹲": return poseWithBase(base, { torso: [28, 5, -4], leftArm: [38, 0, -30], leftForearm: [24, 0, 48], rightArm: [8, 0, 24], rightForearm: [4, 0, -30] });
    case "单手触地蹲": return poseWithBase(base, { torso: [38, 8, -5], head: [-18, -8, 3], leftArm: [54, 0, -34], leftForearm: [18, 0, 42], rightArm: [-8, 0, 50], rightForearm: [2, 0, -52], leftLeg: [-76, 0, -20], rightLeg: [-58, 0, 24] });
    case "抱膝蹲": return poseWithBase(base, { torso: [34, 0, -3], head: [-16, 0, 2], leftArm: [32, 0, -34], leftForearm: [12, 0, 74], rightArm: [32, 0, 34], rightForearm: [12, 0, -74], leftLeg: [-78, 0, -18], leftShin: [104, 0, 6], rightLeg: [-78, 0, 18], rightShin: [104, 0, -6] });
    case "运动准备半蹲": return poseWithBase(base, { torso: [24, -4, -4], head: [-15, 5, 3], leftArm: [24, 0, -38], leftForearm: [8, 0, 74], rightArm: [24, 0, 38], rightForearm: [8, 0, -74], leftLeg: [-50, 0, -22], leftShin: [76, 0, 7], rightLeg: [-50, 0, 22], rightShin: [76, 0, -7] });
    case "防御低蹲": return poseWithBase(base, { torso: [30, -8, -5], head: [-17, 10, 3], leftArm: [-12, 0, -66], leftForearm: [0, 0, -118], rightArm: [-12, 0, 66], rightForearm: [0, 0, 118], leftLeg: [-74, 0, -24], leftShin: [100, 0, 8], rightLeg: [-68, 0, 26], rightShin: [96, 0, -8] });
    default: return base;
  }
}

function createKneelingJointPose(name: string): JointPose {
  const base = jointPose({
    torso: [8, 0, -2], head: [-5, 0, 2], leftArm: [8, 0, -12], leftForearm: [0, 0, 20], rightArm: [8, 0, 12], rightForearm: [0, 0, -20],
    leftLeg: [8, 0, -13], leftShin: [96, 0, 4], rightLeg: [8, 0, 13], rightShin: [96, 0, -4],
  });
  switch (name) {
    case "跪坐": return poseWithBase(base, { torso: [2, 0, -1], leftLeg: [18, 0, -12], leftShin: [108, 0, 4], rightLeg: [18, 0, 12], rightShin: [108, 0, -4] });
    case "单膝跪地": return poseWithBase(base, { torso: [10, -3, -2], leftLeg: [8, 0, -14], leftShin: [102, 0, 5], rightLeg: [-76, 0, 18], rightShin: [94, 0, -6] });
    case "单膝半跪": return poseWithBase(base, { torso: [14, 2, -3], leftLeg: [4, 0, -15], leftShin: [98, 0, 5], rightLeg: [-64, 0, 20], rightShin: [82, 0, -6] });
    case "求婚式单膝跪": return poseWithBase(base, { torso: [-1, 3, -1], head: [-4, -5, 2], leftArm: [-10, 0, -30], leftForearm: [0, 0, 88], rightArm: [-10, 0, 30], rightForearm: [0, 0, -88], leftLeg: [6, 0, -14], leftShin: [102, 0, 5], rightLeg: [-78, 0, 18], rightShin: [96, 0, -6] });
    case "跪姿身体前倾": return poseWithBase(base, { torso: [30, 0, -4], head: [-18, 0, 3], leftArm: [18, 0, -24], leftForearm: [6, 0, 48], rightArm: [18, 0, 24], rightForearm: [6, 0, -48] });
    case "跪姿身体后仰": return poseWithBase(base, { torso: [-22, 0, 4], head: [14, 0, -3], leftArm: [-6, 0, -34], leftForearm: [0, 0, 34], rightArm: [-6, 0, 34], rightForearm: [0, 0, -34] });
    case "跪姿回头": return poseWithBase(base, { torso: [8, 20, -2], head: [-5, 70, 3], leftArm: [8, 0, -16], rightArm: [8, 0, 20] });
    case "双手撑地跪姿": return poseWithBase(base, { torso: [42, 0, -5], head: [-22, 0, 3], leftArm: [48, 0, -38], leftForearm: [8, 0, 34], rightArm: [48, 0, 38], rightForearm: [8, 0, -34], leftLeg: [4, 0, -16], rightLeg: [4, 0, 16] });
    case "单手撑地跪姿": return poseWithBase(base, { torso: [38, 10, -5], head: [-20, -10, 3], leftArm: [52, 0, -40], leftForearm: [10, 0, 38], rightArm: [-8, 0, 48], rightForearm: [0, 0, -70], leftLeg: [6, 0, -16], rightLeg: [-54, 0, 22], rightShin: [82, 0, -6] });
    case "战斗半跪": return poseWithBase(base, { torso: [18, -8, -4], head: [-12, 10, 3], leftArm: [-16, 0, -62], leftForearm: [0, 0, -116], rightArm: [-8, 0, 64], rightForearm: [0, 0, 110], leftLeg: [4, 0, -16], leftShin: [100, 0, 5], rightLeg: [-66, 0, 22], rightShin: [84, 0, -7] });
    case "英雄落地": return poseWithBase(base, { torso: [34, -8, -6], head: [-20, 10, 4], leftArm: [44, 0, -44], leftForearm: [12, 0, 54], rightArm: [-12, 0, 70], rightForearm: [0, 0, 106], leftLeg: [4, 0, -18], leftShin: [104, 0, 6], rightLeg: [-74, 0, 24], rightShin: [92, 0, -8] });
    default: return base;
  }
}

function createLeaningJointPose(name: string): JointPose {
  const base = jointPose({
    hips: [-8, 0, 0], torso: [-4, 0, 3], head: [4, -5, -3], leftArm: [2, 0, -20], leftForearm: [2, 0, 28], rightArm: [6, 0, 26], rightForearm: [2, 0, -42],
    leftLeg: [-4, 0, -12], rightLeg: [18, 0, 16], rightShin: [-28, 0, -4],
  });
  switch (name) {
    case "单肩靠墙": return poseWithBase(base, { hips: [-5, 20, 6], torso: [-8, 18, 12], head: [5, -15, -8], leftShoulder: [0, 0, -14], leftArm: [0, 0, -28], rightLeg: [22, 0, 20] });
    case "侧身靠墙": return poseWithBase(base, { hips: [-4, 68, 0], torso: [-5, 10, 5], head: [4, -10, -4], leftLeg: [-4, 0, -16], rightLeg: [18, 0, 20] });
    case "单手撑墙": return poseWithBase(base, { torso: [16, 8, -3], head: [-10, -8, 2], leftArm: [-52, 0, -44], leftForearm: [-6, 0, 26], rightArm: [4, 0, 24], rightForearm: [2, 0, -32], leftLeg: [-8, 0, -12], rightLeg: [14, 0, 14] });
    case "双手撑墙": return poseWithBase(base, { torso: [20, 0, -4], head: [-12, 0, 2], leftArm: [-52, 0, -42], leftForearm: [-6, 0, 24], rightArm: [-52, 0, 42], rightForearm: [-6, 0, -24], leftLeg: [-12, 0, -14], rightLeg: [18, 0, 16] });
    case "单手撑桌": return poseWithBase(base, { torso: [28, 8, -4], head: [-16, -8, 3], leftArm: [26, 0, -36], leftForearm: [16, 0, 48], rightArm: [4, 0, 24], rightForearm: [2, 0, -32], leftLeg: [-6, 0, -12], rightLeg: [10, 0, 13] });
    case "双手撑桌": return poseWithBase(base, { torso: [30, 0, -5], head: [-17, 0, 3], leftArm: [28, 0, -38], leftForearm: [18, 0, 50], rightArm: [28, 0, 38], rightForearm: [18, 0, -50], leftLeg: [-6, 0, -12], rightLeg: [10, 0, 13] });
    case "身体倚桌": return poseWithBase(base, { hips: [6, 0, 0], torso: [24, 6, -4], chest: [6, 0, -1], head: [-17, -8, 3], leftArm: [24, 0, -34], leftForearm: [16, 0, 46], rightArm: [20, 0, 32], rightForearm: [14, 0, -44], rightLeg: [10, 0, 15] });
    case "倚靠栏杆": return poseWithBase(base, { torso: [-8, 8, 4], head: [4, -8, -3], leftArm: [18, 0, -34], leftForearm: [8, 0, 48], rightArm: [10, 0, 26], rightForearm: [4, 0, -38], leftLeg: [-2, 0, -12], rightLeg: [16, 0, 16] });
    case "双手扶栏杆": return poseWithBase(base, { torso: [12, 0, -3], head: [-8, 0, 2], leftArm: [18, 0, -36], leftForearm: [10, 0, 52], rightArm: [18, 0, 36], rightForearm: [10, 0, -52], leftLeg: [-4, 0, -12], rightLeg: [10, 0, 13] });
    case "臀部倚桌": return poseWithBase(base, { hips: [-14, 0, 0], torso: [-8, 0, 7], head: [8, 0, -5], leftArm: [2, 0, -24], rightArm: [2, 0, 24], leftLeg: [-12, 8, -18], leftShin: [8, 0, 4], rightLeg: [28, -8, 22], rightShin: [-38, 0, -6] });
    case "坐姿侧靠": return poseWithBase(base, { torso: [-8, 18, 6], head: [5, -16, -4], leftArm: [18, -6, -30], leftForearm: [8, 0, 42], rightArm: [6, 4, 24], rightForearm: [4, 0, -34], leftLeg: [-70, 12, -16], leftShin: [78, 0, 6], rightLeg: [-66, 14, 18], rightShin: [74, 0, -6] });
    default: return base;
  }
}

function createSeatedJointPose(name: string): JointPose {
  const pose = jointPose({
    torso: [2, 0, 0],
    head: [-2, 0, 0],
    leftArm: [12, 0, -10],
    leftForearm: [8, 0, 42],
    rightArm: [12, 0, 10],
    rightForearm: [8, 0, -42],
    leftLeg: [-72, 0, -9],
    leftShin: [76, 0, 3],
    rightLeg: [-72, 0, 9],
    rightShin: [76, 0, -3],
  });

  switch (name) {
    case "自然正坐":
      break;
    case "放松坐姿":
      pose.torso = [-3, 5, 0]; pose.head = [2, -6, 0];
      pose.leftArm = [4, -4, -18]; pose.leftForearm = [5, 0, 32];
      pose.rightLeg = [-68, 0, 15]; pose.rightShin = [82, 0, -4];
      break;
    case "双腿并拢坐":
      pose.torso = [0, 0, 0]; pose.head = [0, 0, 0];
      pose.leftLeg = [-82, 0, 0]; pose.rightLeg = [-82, 0, 0];
      pose.leftShin = [84, 0, 0]; pose.rightShin = [84, 0, 0];
      break;
    case "双腿打开坐":
    case "双腿分开坐":
      pose.torso = [-3, 0, 1]; pose.head = [2, 0, -1];
      pose.leftArm = [8, 0, -18]; pose.rightArm = [8, 0, 18];
      pose.leftLeg = [-68, 0, -32]; pose.rightLeg = [-68, 0, 32];
      pose.leftShin = [72, 0, 9]; pose.rightShin = [72, 0, -9];
      break;
    case "双腿斜放坐":
      pose.torso = [2, 7, 1]; pose.head = [-2, -7, -1];
      pose.leftLeg = [-72, 16, -14]; pose.leftShin = [78, 0, 6];
      pose.rightLeg = [-68, 18, 8]; pose.rightShin = [74, 0, 4];
      break;
    case "双腿前伸坐":
      pose.leftLeg = [-44, 0, -9]; pose.leftShin = [10, 0, 2];
      pose.rightLeg = [-44, 0, 9]; pose.rightShin = [10, 0, -2];
      pose.torso = [2, -3, 0];
      break;
    case "单腿屈膝坐":
    case "单腿前伸坐":
      pose.rightLeg = [-48, 0, 13]; pose.rightShin = [22, 0, -2];
      pose.torso = [1, -4, 0];
      break;
    case "双腿屈膝坐":
      pose.leftLeg = [-54, 0, -18]; pose.leftShin = [98, 0, 6];
      pose.rightLeg = [-54, 0, 18]; pose.rightShin = [98, 0, -6];
      break;
    case "双腿交叉坐":
    case "沙发双腿交叉":
      pose.leftLeg = [-74, 13, -12]; pose.leftShin = [76, 0, 6];
      pose.rightLeg = [-74, -13, 12]; pose.rightShin = [76, 0, -6];
      if (name.startsWith("沙发")) { pose.torso = [-3, 5, 0]; pose.head = [2, -5, 0]; }
      break;
    case "翘腿坐":
    case "翘二郎腿":
      pose.leftLeg = [-72, 0, -8]; pose.leftShin = [78, 0, 3];
      pose.rightLeg = [-100, -22, -30]; pose.rightShin = [104, 0, -8];
      pose.torso = [0, 5, 0];
      break;
    case "身体前倾坐":
    case "手撑膝盖坐":
      pose.hips = [6, 0, 0]; pose.torso = [18, 0, 0]; pose.chest = [6, 0, 0]; pose.head = [-14, 0, 0];
      pose.leftLeg = [-66, 0, -15]; pose.rightLeg = [-66, 0, 15];
      break;
    case "身体后仰坐":
    case "身体后靠坐":
      // A mild spinal lean reads as reclining without folding the head behind the torso.
      pose.torso = [-7, 0, 0]; pose.head = [6, 0, 0];
      pose.leftArm = [2, -4, -22]; pose.leftForearm = [4, 0, 28];
      pose.rightArm = [2, 4, 22]; pose.rightForearm = [4, 0, -28];
      pose.leftLeg = [-68, 0, -13]; pose.rightLeg = [-68, 0, 15];
      break;
    case "双手放腿上":
      pose.torso = [5, 0, 0]; pose.head = [-4, 0, 0];
      pose.leftArm = [24, 0, -18]; pose.leftForearm = [18, 0, 54];
      pose.rightArm = [24, 0, 18]; pose.rightForearm = [18, 0, -54];
      pose.leftLeg = [-76, 0, -12]; pose.rightLeg = [-76, 0, 12];
      break;
    case "单手托腮坐":
      pose.torso = [7, 4, 0]; pose.head = [-5, -8, 3];
      pose.rightArm = [10, 0, 16]; pose.rightForearm = [8, 0, -38];
      break;
    case "单手撑椅坐":
      pose.torso = [-1, 8, 0]; pose.head = [1, -8, 0];
      pose.leftArm = [18, -8, -30]; pose.leftForearm = [10, 0, 48];
      pose.rightLeg = [-68, 0, 17]; pose.rightShin = [80, 0, -4];
      break;
    case "双臂抱胸坐":
      pose.leftArm = [-42, 8, 37]; pose.leftForearm = [-18, 0, 55];
      pose.rightArm = [-18, -8, -37]; pose.rightForearm = [8, 0, -55];
      break;
    case "盘腿坐":
      pose.torso = [7, 0, 0]; pose.head = [-6, 0, 0];
      pose.leftLeg = [-96, 28, -48]; pose.leftShin = [104, 0, -18];
      pose.rightLeg = [-96, -28, 48]; pose.rightShin = [104, 0, 18];
      break;
    case "后手撑地坐":
      pose.torso = [-13, 0, 0]; pose.head = [10, 0, 0];
      pose.leftArm = [40, 0, -34]; pose.leftForearm = [8, 0, 38];
      pose.rightArm = [40, 0, 34]; pose.rightForearm = [8, 0, -38];
      pose.leftLeg = [-55, 0, -20]; pose.leftShin = [92, 0, 6];
      pose.rightLeg = [-55, 0, 20]; pose.rightShin = [92, 0, -6];
      break;
    case "侧坐":
      pose.torso = [2, 12, 2]; pose.head = [-2, -12, -2];
      pose.leftLeg = [-72, 20, -17]; pose.leftShin = [76, 0, 7];
      pose.rightLeg = [-72, 17, -5]; pose.rightShin = [76, 0, 4];
      break;
    case "反向坐椅":
      pose.torso = [9, 0, 0]; pose.head = [-7, 0, 0];
      pose.leftLeg = [-68, 0, -22]; pose.rightLeg = [-68, 0, 22];
      pose.leftArm = [-18, 0, -26]; pose.leftForearm = [0, 0, 88];
      pose.rightArm = [-18, 0, 26]; pose.rightForearm = [0, 0, -88];
      break;
    case "回头坐姿":
      pose.torso = [2, 12, 0]; pose.head = [-2, -36, 0];
      pose.leftArm = [8, -5, -18]; pose.rightArm = [8, 5, 18];
      break;
    case "高凳标准坐":
      pose.leftLeg = [-68, 0, -9]; pose.leftShin = [58, 0, 3];
      pose.rightLeg = [-68, 0, 9]; pose.rightShin = [58, 0, -3];
      break;
    case "单脚落地高凳":
      pose.leftShin = [78, 0, 3]; pose.rightShin = [48, 0, -3];
      pose.rightLeg = [-66, 0, 14];
      break;
    case "双脚悬空":
      pose.leftShin = [48, 0, 4]; pose.rightShin = [48, 0, -4];
      pose.leftLeg = [-68, 0, -12]; pose.rightLeg = [-68, 0, 12];
      break;
    case "一腿伸直高凳":
      pose.leftShin = [52, 0, 3];
      pose.rightLeg = [-42, 0, 13]; pose.rightShin = [10, 0, -2];
      pose.torso = [0, -5, 0];
      break;
    case "单腿踩凳":
      pose.rightLeg = [-98, 20, 35]; pose.rightShin = [58, 0, 10];
      pose.leftLeg = [-66, 0, -13]; pose.leftShin = [62, 0, 3];
      pose.torso = [6, 5, 0]; pose.head = [-5, -6, 0];
      break;
    case "身体侧倾高凳":
      pose.torso = [3, 12, 8]; pose.head = [-2, -11, -6];
      pose.leftArm = [8, -8, -24]; pose.rightArm = [18, 4, 16];
      pose.leftShin = [55, 0, 4]; pose.rightShin = [64, 0, -4];
      break;
    case "沙发放松坐":
      pose.torso = [-4, 6, 0]; pose.head = [3, -6, 0];
      pose.leftArm = [0, -4, -30]; pose.leftForearm = [6, 0, 24];
      pose.rightArm = [4, 4, 26]; pose.rightForearm = [6, 0, -30];
      pose.leftLeg = [-66, 0, -17]; pose.rightLeg = [-66, 0, 18];
      break;
    case "沙发半躺":
      pose.torso = [-11, 7, 0]; pose.head = [10, -6, 0];
      pose.leftArm = [-2, -4, -34]; pose.leftForearm = [4, 0, 24];
      pose.rightLeg = [-43, 0, 15]; pose.rightShin = [18, 0, -3];
      break;
    case "沙发单手撑头":
      pose.torso = [-2, 7, 0]; pose.head = [2, -8, 3];
      pose.rightArm = [4, 0, 22]; pose.rightForearm = [6, 0, -34];
      pose.leftLeg = [-68, 0, -15]; pose.rightLeg = [-68, 0, 16];
      break;
    case "沙发双臂展开":
      pose.torso = [-4, 0, 0]; pose.head = [3, 0, 0];
      pose.leftArm = [0, 0, -70]; pose.leftForearm = [6, 0, 30];
      pose.rightArm = [0, 0, 70]; pose.rightForearm = [6, 0, -30];
      pose.leftLeg = [-66, 0, -17]; pose.rightLeg = [-66, 0, 17];
      break;
    case "沙发身体后仰":
      pose.torso = [-7, 0, 0]; pose.head = [6, 0, 0];
      pose.leftArm = [-1, -4, -32]; pose.leftForearm = [4, 0, 25];
      pose.rightArm = [-1, 4, 32]; pose.rightForearm = [4, 0, -25];
      pose.leftLeg = [-66, 0, -15]; pose.rightLeg = [-66, 0, 16];
      break;
    default:
      break;
  }

  return pose;
}

function createGroundJointPose(name: string): JointPose {
  const pose = jointPose({
    torso: [4, 0, 0],
    head: [-4, 0, 0],
    leftArm: [12, 0, -18],
    leftForearm: [6, 0, 34],
    rightArm: [12, 0, 18],
    rightForearm: [6, 0, -34],
    leftLeg: [-76, 0, -10],
    leftShin: [78, 0, 4],
    rightLeg: [-76, 0, 10],
    rightShin: [78, 0, -4],
  });

  switch (name) {
    case "盘腿坐地":
      pose.torso = [7, 0, 0]; pose.head = [-6, 0, 0];
      pose.leftArm = [20, 0, -24]; pose.leftForearm = [16, 0, 62];
      pose.rightArm = [20, 0, 24]; pose.rightForearm = [16, 0, -62];
      pose.leftLeg = [-90, 0, -42]; pose.leftShin = [104, 0, -72];
      pose.rightLeg = [-90, 0, 42]; pose.rightShin = [104, 0, 72];
      break;
    case "双腿伸直坐地":
      pose.torso = [6, 0, 0]; pose.head = [-5, 0, 0];
      pose.leftArm = [14, 0, -24]; pose.leftForearm = [8, 0, 42];
      pose.rightArm = [14, 0, 24]; pose.rightForearm = [8, 0, -42];
      pose.leftLeg = [-88, 0, -7]; pose.leftShin = [4, 0, 1];
      pose.rightLeg = [-88, 0, 7]; pose.rightShin = [4, 0, -1];
      break;
    case "单腿曲起坐地":
      pose.torso = [7, -5, 0]; pose.head = [-6, 6, 0];
      pose.leftLeg = [-88, 0, -10]; pose.leftShin = [5, 0, 2];
      pose.rightLeg = [-52, -12, 24]; pose.rightShin = [102, 0, -7];
      pose.leftArm = [16, 0, -24]; pose.leftForearm = [10, 0, 48];
      pose.rightArm = [24, 0, 30]; pose.rightForearm = [18, 0, -58];
      break;
    case "双腿曲起坐地":
      pose.torso = [8, 0, 0]; pose.head = [-7, 0, 0];
      pose.leftLeg = [-54, 0, -22]; pose.leftShin = [102, 0, 7];
      pose.rightLeg = [-54, 0, 22]; pose.rightShin = [102, 0, -7];
      pose.leftArm = [22, 0, -26]; pose.leftForearm = [18, 0, 56];
      pose.rightArm = [22, 0, 26]; pose.rightForearm = [18, 0, -56];
      break;
    case "侧坐地面":
      pose.torso = [5, 12, 2]; pose.head = [-4, -12, -2];
      pose.leftLeg = [-86, 22, -28]; pose.leftShin = [98, 0, 20];
      pose.rightLeg = [-76, 28, -8]; pose.rightShin = [94, 0, 14];
      pose.leftArm = [18, -8, -24]; pose.leftForearm = [14, 0, 52];
      pose.rightArm = [24, 4, 28]; pose.rightForearm = [18, 0, -56];
      break;
    case "手撑地面坐":
      pose.torso = [-3, 0, 0]; pose.head = [3, 0, 0];
      pose.leftLeg = [-62, 0, -19]; pose.leftShin = [92, 0, 6];
      pose.rightLeg = [-62, 0, 19]; pose.rightShin = [92, 0, -6];
      pose.leftArm = [34, 0, -32]; pose.leftForearm = [16, 0, 48];
      pose.rightArm = [34, 0, 32]; pose.rightForearm = [16, 0, -48];
      break;
    case "后仰撑地":
      pose.torso = [-15, 0, 0]; pose.head = [12, 0, 0];
      pose.leftLeg = [-55, 0, -20]; pose.leftShin = [92, 0, 6];
      pose.rightLeg = [-55, 0, 20]; pose.rightShin = [92, 0, -6];
      pose.leftArm = [42, 0, -34]; pose.leftForearm = [8, 0, 38];
      pose.rightArm = [42, 0, 34]; pose.rightForearm = [8, 0, -38];
      break;
    case "半躺":
      pose.torso = [-23, 8, 0]; pose.head = [18, -7, 0];
      pose.leftLeg = [-80, 0, -12]; pose.leftShin = [12, 0, 2];
      pose.rightLeg = [-48, 0, 20]; pose.rightShin = [86, 0, -6];
      pose.leftArm = [34, -8, -36]; pose.leftForearm = [8, 0, 42];
      pose.rightArm = [6, 4, 22]; pose.rightForearm = [8, 0, -36];
      break;
    case "平躺":
      pose.torso = [0, 0, 0]; pose.head = [0, 0, 0];
      pose.leftArm = [0, 0, -18]; pose.leftForearm = [0, 0, 6];
      pose.rightArm = [0, 0, 18]; pose.rightForearm = [0, 0, -6];
      pose.leftLeg = [-4, 0, -6]; pose.leftShin = [3, 0, 1];
      pose.rightLeg = [-4, 0, 6]; pose.rightShin = [3, 0, -1];
      break;
    case "曲腿躺卧":
      pose.torso = [0, 0, 0]; pose.head = [0, -6, 0];
      pose.leftArm = [0, 0, -24]; pose.leftForearm = [0, 0, 12];
      pose.rightArm = [0, 0, 24]; pose.rightForearm = [0, 0, -12];
      pose.leftLeg = [-7, 0, -8]; pose.leftShin = [5, 0, 1];
      pose.rightLeg = [-54, -8, 20]; pose.rightShin = [88, 0, -6];
      break;
    case "侧躺":
      pose.torso = [0, 0, 5]; pose.head = [0, -10, -5];
      pose.leftArm = [-36, 0, -46]; pose.leftForearm = [0, 0, 78];
      pose.rightArm = [12, 0, 28]; pose.rightForearm = [4, 0, -44];
      pose.leftLeg = [-6, 0, -12]; pose.leftShin = [8, 0, 3];
      pose.rightLeg = [-34, 0, 24]; pose.rightShin = [64, 0, -8];
      break;
    case "趴卧":
      pose.torso = [0, 0, -2]; pose.head = [-12, 10, 0];
      pose.leftArm = [-48, 0, -42]; pose.leftForearm = [0, 0, 92];
      pose.rightArm = [-48, 0, 42]; pose.rightForearm = [0, 0, -92];
      pose.leftLeg = [3, 0, -7]; pose.leftShin = [6, 0, 1];
      pose.rightLeg = [-12, 0, 9]; pose.rightShin = [24, 0, -3];
      break;
    default:
      break;
  }

  return pose;
}

function createRunningJointPose(name: string): JointPose {
  const jog = jointPose({
    hips: [7, 0, 0], torso: [10, -4, -2], chest: [4, 0, -1], head: [-8, 5, 1],
    leftArm: [-4, 0, -42], leftForearm: [2, 0, -92], rightArm: [16, 0, 38], rightForearm: [2, 0, -78],
    leftLeg: [-42, 0, -15], leftShin: [62, 0, 5], rightLeg: [30, 0, 16], rightShin: [10, 0, -4],
  });
  switch (name) {
    case "正常跑步": return poseWithBase(jog, { hips: [10, 0, 0], torso: [17, -4, -3], chest: [5, 0, -1], leftArm: [-12, 0, -48], leftForearm: [2, 0, -104], rightArm: [22, 0, 42], rightForearm: [2, 0, -84], leftLeg: [-56, 0, -18], leftShin: [78, 0, 6], rightLeg: [44, 0, 19], rightShin: [14, 0, -5] });
    case "快速奔跑": return poseWithBase(jog, { torso: [21, -6, -4], head: [-13, 7, 2], leftArm: [-18, 0, -52], leftForearm: [2, 0, -116], rightArm: [24, 0, 44], rightForearm: [2, 0, -86], leftLeg: [-58, 0, -18], leftShin: [82, 0, 6], rightLeg: [46, 0, 19], rightShin: [10, 0, -5] });
    case "全力冲刺": return poseWithBase(jog, { hips: [14, 0, 0], torso: [20, -8, -5], chest: [7, -2, -1], head: [-18, 9, 3], leftArm: [-26, 0, -58], leftForearm: [2, 0, -126], rightArm: [30, 0, 48], rightForearm: [2, 0, -92], leftLeg: [-68, 0, -20], leftShin: [88, 0, 6], leftFoot: [-16, 0, 0], rightLeg: [56, 0, 20], rightShin: [8, 0, -6], rightFoot: [12, 0, 0] });
    case "冲刺起步": return jointPose({ hips: [20, 0, 0], torso: [32, -6, -5], chest: [10, 0, -1], head: [-34, 7, 3], leftArm: [34, 0, -32], leftForearm: [20, 0, 68], rightArm: [30, 0, 34], rightForearm: [18, 0, -64], leftLeg: [-82, 0, -21], leftShin: [110, 0, 7], leftFoot: [-18, 0, 0], rightLeg: [-34, 0, 20], rightShin: [62, 0, -6], rightFoot: [14, 0, 0] });
    case "起跑准备": return jointPose({ hips: [22, 0, 0], torso: [34, 0, -5], chest: [10, 0, -1], head: [-38, 0, 3], leftArm: [40, 0, -34], leftForearm: [22, 0, 70], rightArm: [40, 0, 34], rightForearm: [22, 0, -70], leftLeg: [-72, 0, -24], leftShin: [104, 0, 8], leftFoot: [-18, 0, 0], rightLeg: [-48, 0, 24], rightShin: [78, 0, -8], rightFoot: [14, 0, 0] });
    case "身体前倾奔跑": return poseWithBase(jog, { torso: [32, -2, -5], head: [-20, 3, 3], leftArm: [-18, 0, -54], leftForearm: [2, 0, -118], rightArm: [28, 0, 46], rightForearm: [2, 0, -88], leftLeg: [-56, 0, -18], leftShin: [80, 0, 6], rightLeg: [44, 0, 18] });
    case "大跨步奔跑": return poseWithBase(jog, { torso: [22, -3, -4], head: [-14, 4, 2], leftArm: [-22, 0, -56], leftForearm: [2, 0, -120], rightArm: [28, 0, 46], rightForearm: [2, 0, -90], leftLeg: [-78, 0, -19], leftShin: [38, 0, 6], rightLeg: [68, 0, 20], rightShin: [8, 0, -6] });
    case "转弯奔跑": return poseWithBase(jog, { torso: [20, 28, -8], head: [-12, -20, 5], leftArm: [-18, -8, -58], leftForearm: [2, 0, -112], rightArm: [24, 8, 52], rightForearm: [2, 0, -90], leftLeg: [-52, -10, -22], leftShin: [76, 0, 7], rightLeg: [38, 12, 24], rightShin: [18, 0, -7] });
    case "回头奔跑": return poseWithBase(jog, { torso: [17, 22, -4], head: [-9, 76, 4], leftArm: [22, 0, -44], leftForearm: [4, 0, 88], rightArm: [-18, 0, 48], rightForearm: [2, 0, 118], leftLeg: [-54, 0, -18], leftShin: [78, 0, 6], rightLeg: [38, 0, 18], rightShin: [18, 0, -5] });
    case "侧向奔跑": return poseWithBase(jog, { hips: [8, 66, 0], torso: [12, 10, -4], head: [-10, -10, 2], leftArm: [-22, 0, -54], leftForearm: [2, 0, -118], rightArm: [24, 0, 44], rightForearm: [2, 0, -84], leftLeg: [42, 0, -26], leftShin: [12, 0, 8], rightLeg: [-58, 0, 28], rightShin: [84, 0, -9] });
    case "急停姿态": return jointPose({ torso: [34, 10, -6], head: [-21, -9, 4], leftArm: [-12, 0, -72], leftForearm: [4, 0, -130], rightArm: [-12, 0, 72], rightForearm: [4, 0, 130], leftLeg: [-74, 0, -26], leftShin: [100, 0, 8], rightLeg: [-28, 0, 26], rightShin: [56, 0, -8] });
    default: return jog;
  }
}

function createLyingJointPose(name: string): JointPose {
  const pose = jointPose({
    hips: [0, 0, 90],
    head: [0, 0, 0],
    leftArm: [0, 0, -24], leftForearm: [0, 0, 8],
    rightArm: [0, 0, 24], rightForearm: [0, 0, -8],
    leftLeg: [-4, 0, -7], leftShin: [3, 0, 1],
    rightLeg: [-4, 0, 7], rightShin: [3, 0, -1],
  });
  if (name === "自然仰躺") {
    pose.torso = [0, 3, 0]; pose.head = [2, -4, 0];
    pose.leftArm = [2, 0, -30]; pose.leftForearm = [2, 0, 16];
    pose.rightLeg = [-12, -4, 12]; pose.rightShin = [18, 0, -3];
  }
  if (/单腿屈膝/.test(name)) {
    pose.rightLeg = [-54, -8, 20]; pose.rightShin = [88, 0, -6];
  }
  if (/双腿屈膝/.test(name)) {
    pose.leftLeg = [-52, 8, -18]; pose.leftShin = [86, 0, 6];
    pose.rightLeg = [-52, -8, 18]; pose.rightShin = [86, 0, -6];
  }
  if (/双手张开/.test(name)) {
    pose.leftArm = [0, 0, -74]; pose.rightArm = [0, 0, 74];
  }
  if (/双手枕头/.test(name)) {
    pose.leftArm = [-52, 0, -76]; pose.leftForearm = [0, 0, 118];
    pose.rightArm = [-52, 0, 76]; pose.rightForearm = [0, 0, -118];
  }
  if (/侧卧/.test(name)) {
    pose.hips = [/左/.test(name) ? -78 : 78, 0, 90];
    pose.torso = [0, 0, /左/.test(name) ? -8 : 8];
    pose.head = [0, /回头/.test(name) ? 38 : -10, /左/.test(name) ? 8 : -8];
    pose.leftArm = [-50, 0, -48]; pose.leftForearm = [0, 0, 98];
    pose.rightArm = [10, 0, 30]; pose.rightForearm = [4, 0, -44];
    pose.leftLeg = [/蜷缩/.test(name) ? -48 : 6, 0, -14];
    pose.leftShin = [/蜷缩/.test(name) ? 82 : 8, 0, 3];
    pose.rightLeg = [/蜷缩/.test(name) ? -58 : -28, 0, 22];
    pose.rightShin = [/蜷缩/.test(name) ? 92 : 58, 0, -8];
  }
  if (/半躺支撑|单肘撑起/.test(name)) {
    pose.torso = [-24, 8, 0]; pose.head = [17, -7, 0];
    pose.leftArm = [32, -8, -38]; pose.leftForearm = [6, 0, 46];
    pose.rightLeg = [-44, 0, 20]; pose.rightShin = [82, 0, -6];
  }
  return pose;
}

function createProneJointPose(name: string): JointPose {
  const pose = jointPose({
    hips: [0, 180, 90],
    torso: [0, 0, -2], head: [-14, /回头/.test(name) ? 46 : 10, 0],
    leftArm: [-48, 0, -42], leftForearm: [0, 0, 92],
    rightArm: [-48, 0, 42], rightForearm: [0, 0, -92],
    leftLeg: [3, 0, -7], leftShin: [6, 0, 1],
    rightLeg: [3, 0, 8], rightShin: [6, 0, -1],
  });
  if (name === "自然俯卧") pose.head = [-6, 5, 0];
  if (name === "趴地抬头") { pose.torso = [-6, 0, -2]; pose.head = [-28, 6, 1]; }
  if (/双肘撑起/.test(name)) pose.torso = [-14, 0, -3];
  if (/单肘撑起/.test(name)) {
    pose.torso = [-12, 8, -3]; pose.leftArm = [-48, 0, -42]; pose.rightArm = [4, 0, 26]; pose.rightForearm = [0, 0, -40];
  }
  if (/双手撑起上身/.test(name)) {
    pose.torso = [-28, 0, -4]; pose.leftArm = [-12, 0, -52]; pose.leftForearm = [0, 0, 18]; pose.rightArm = [-12, 0, 52]; pose.rightForearm = [0, 0, -18];
  }
  if (/单腿屈起/.test(name)) pose.rightShin = [78, 0, -2];
  if (/双腿屈起/.test(name)) { pose.leftShin = [78, 0, 2]; pose.rightShin = [78, 0, -2]; }
  if (/向前伸手/.test(name)) {
    pose.leftArm = [-76, 0, -10]; pose.leftForearm = [0, 0, 8]; pose.rightArm = [-76, 0, 10]; pose.rightForearm = [0, 0, -8];
  }
  if (/低姿观察/.test(name)) { pose.torso = [-8, 0, -3]; pose.head = [-24, 22, 2]; }
  return pose;
}

function createGroundActionJointPose(name: string): JointPose {
  const fourPoint = jointPose({
    hips: [0, 0, 90],
    torso: [12, 0, -3], head: [-14, 0, 2],
    leftArm: [-28, 0, -50], leftForearm: [0, 0, 74], rightArm: [-28, 0, 50], rightForearm: [0, 0, -74],
    leftLeg: [-48, 0, -16], leftShin: [88, 0, 5], rightLeg: [-48, 0, 16], rightShin: [88, 0, -5],
  });
  switch (name) {
    case "向前爬行": return poseWithBase(fourPoint, { torso: [15, -5, -4], head: [-16, 6, 3], leftArm: [-42, 0, -54], leftForearm: [0, 0, 86], rightArm: [-12, 0, 46], rightForearm: [0, 0, -58], leftLeg: [-62, 0, -18], leftShin: [98, 0, 6], rightLeg: [-26, 0, 20], rightShin: [66, 0, -6] });
    case "熊爬姿态": return poseWithBase(fourPoint, { torso: [2, 0, -4], head: [-12, 0, 3], leftArm: [-10, 0, -52], leftForearm: [0, 0, 28], rightArm: [-10, 0, 52], rightForearm: [0, 0, -28], leftLeg: [-28, 0, -22], leftShin: [52, 0, 7], rightLeg: [-28, 0, 22], rightShin: [52, 0, -7] });
    case "平板支撑": return jointPose({ hips: [0, 0, 90], torso: [2, 0, -2], head: [-10, 0, 2], leftArm: [-32, 0, -38], leftForearm: [0, 0, 112], leftHand: [10, 0, 0], rightArm: [-32, 0, 38], rightForearm: [0, 0, -112], rightHand: [10, 0, 0], leftLeg: [3, 0, -13], leftShin: [4, 0, 3], leftFoot: [-10, 0, 0], rightLeg: [3, 0, 13], rightShin: [4, 0, -3], rightFoot: [-10, 0, 0] });
    case "俯卧撑准备": return jointPose({ hips: [0, 0, 90], torso: [3, 0, -3], head: [-13, 0, 2], leftArm: [-12, 0, -56], leftForearm: [0, 0, 14], rightArm: [-12, 0, 56], rightForearm: [0, 0, -14], leftLeg: [4, 0, -15], leftShin: [5, 0, 3], leftFoot: [-12, 0, 0], rightLeg: [4, 0, 15], rightShin: [5, 0, -3], rightFoot: [-12, 0, 0] });
    case "俯卧撑低位": return jointPose({ hips: [0, 0, 90], torso: [-5, 0, -3], head: [-5, 0, 2], leftArm: [-46, 0, -50], leftForearm: [0, 0, 92], rightArm: [-46, 0, 50], rightForearm: [0, 0, -92], leftLeg: [4, 0, -14], leftShin: [5, 0, 3], leftFoot: [-12, 0, 0], rightLeg: [4, 0, 14], rightShin: [5, 0, -3], rightFoot: [-12, 0, 0] });
    case "坐地后撑": return createGroundJointPose("后仰撑地");
    case "跌坐": return poseWithBase(createGroundJointPose("手撑地面坐"), { torso: [8, -7, -3], head: [-4, 8, 2], leftLeg: [-72, 0, -22], leftShin: [100, 0, 7], rightLeg: [-44, 0, 24], rightShin: [76, 0, -7] });
    case "跌倒侧撑": return poseWithBase(createGroundJointPose("手撑地面坐"), { torso: [6, 28, 7], head: [-3, -24, -5], leftArm: [48, -8, -40], leftForearm: [12, 0, 40], rightArm: [-2, 6, 32], rightForearm: [2, 0, -38], leftLeg: [-64, 16, -28], leftShin: [88, 0, 9], rightLeg: [-34, 20, 26], rightShin: [66, 0, -8] });
    case "倒地支撑": return poseWithBase(createGroundJointPose("手撑地面坐"), { torso: [22, 18, -5], head: [-14, -14, 3], leftArm: [52, -8, -42], leftForearm: [12, 0, 42], rightArm: [-14, 4, 48], rightForearm: [0, 0, -68], leftLeg: [-62, 0, -20], leftShin: [92, 0, 6], rightLeg: [-28, 0, 24], rightShin: [58, 0, -7] });
    case "翻滚准备": return jointPose({ torso: [34, 8, -7], head: [18, -12, 4], leftArm: [-18, 0, -40], leftForearm: [0, 0, 78], rightArm: [-12, 0, 42], rightForearm: [0, 0, -76], leftLeg: [-72, 0, -25], leftShin: [102, 0, 8], rightLeg: [-68, 0, 27], rightShin: [100, 0, -8] });
    case "地面翻滚": return jointPose({ torso: [24, 36, -10], head: [16, -32, 6], leftArm: [-34, -8, -48], leftForearm: [0, 0, 92], rightArm: [-10, 8, 42], rightForearm: [0, 0, -76], leftLeg: [-62, -10, -28], leftShin: [96, 0, 9], rightLeg: [-48, 12, 30], rightShin: [86, 0, -9] });
    case "滑跪": return jointPose({ torso: [18, -5, -4], head: [-10, 6, 2], leftArm: [-18, 0, -68], leftForearm: [0, 0, -42], rightArm: [-18, 0, 68], rightForearm: [0, 0, 42], leftLeg: [-8, 0, -16], leftShin: [102, 0, 6], rightLeg: [12, 0, 16], rightShin: [102, 0, -6] });
    case "低姿移动": return poseWithBase(fourPoint, { torso: [4, -12, -5], head: [-8, 16, 3], leftArm: [-38, 0, -56], leftForearm: [0, 0, 80], rightArm: [-10, 0, 46], rightForearm: [0, 0, -50], leftLeg: [-68, 0, -24], leftShin: [100, 0, 8], rightLeg: [-22, 0, 26], rightShin: [58, 0, -8] });
    case "倒地起身": return poseWithBase(createGroundJointPose("手撑地面坐"), { torso: [38, 8, -6], head: [-22, -6, 4], leftArm: [48, -8, -38], leftForearm: [10, 0, 42], rightArm: [-12, 0, 52], rightForearm: [0, 0, -72], leftLeg: [-72, 0, -20], leftShin: [96, 0, 6], rightLeg: [-18, 0, 22], rightShin: [48, 0, -7] });
    case "单手撑地起身": return poseWithBase(createGroundJointPose("手撑地面坐"), { torso: [42, 18, -7], head: [-24, -14, 4], leftArm: [54, -8, -42], leftForearm: [12, 0, 44], rightArm: [-18, 6, 56], rightForearm: [0, 0, -76], leftLeg: [-68, 0, -22], leftShin: [92, 0, 7], rightLeg: [-12, 0, 24], rightShin: [42, 0, -8] });
    default: return fourPoint;
  }
}

function createJumpingJointPose(name: string): JointPose {
  if (/向前跳跃/.test(name)) {
    return jointPose({
      torso: [18, -4, -3], head: [-9, 4, 2],
      leftArm: [-12, 0, -68], leftForearm: [2, 0, -108],
      rightArm: [24, 0, 52], rightForearm: [4, 0, -76],
      leftLeg: [-52, 0, -16], leftShin: [64, 0, 5],
      rightLeg: [38, 0, 17], rightShin: [-32, 0, -5],
    });
  }
  if (/大跨步跳跃/.test(name)) {
    return jointPose({
      torso: [16, 2, -4], head: [-8, -2, 2],
      leftArm: [-20, 0, -76], leftForearm: [0, 0, -104],
      rightArm: [18, 0, 66], rightForearm: [0, 0, -88],
      leftLeg: [-74, 0, -12], leftShin: [18, 0, 3],
      rightLeg: [60, 0, 14], rightShin: [12, 0, -3],
    });
  }
  if (/单腿起跳/.test(name)) {
    return jointPose({
      torso: [12, -5, -3], head: [-7, 5, 2],
      leftArm: [14, 0, -72], leftForearm: [0, 0, -82],
      rightArm: [-14, 0, 78], rightForearm: [0, 0, 92],
      leftLeg: [-80, 0, -18], leftShin: [94, 0, 5],
      rightLeg: [16, 0, 12], rightShin: [-18, 0, -4],
    });
  }
  if (/双腿腾空/.test(name)) {
    return jointPose({
      torso: [14, 0, -2], head: [-8, 0, 1],
      leftArm: [24, 0, -82], leftForearm: [0, 0, -72],
      rightArm: [24, 0, 82], rightForearm: [0, 0, 72],
      leftLeg: [-48, 0, -20], leftShin: [72, 0, 5],
      rightLeg: [-48, 0, 20], rightShin: [72, 0, -5],
    });
  }
  if (/抱膝跳/.test(name)) {
    return jointPose({
      torso: [22, 0, -3], head: [-10, 0, 2],
      leftArm: [34, 0, -36], leftForearm: [18, 0, 72],
      rightArm: [34, 0, 36], rightForearm: [18, 0, -72],
      leftLeg: [-82, 0, -24], leftShin: [104, 0, 7],
      rightLeg: [-82, 0, 24], rightShin: [104, 0, -7],
    });
  }
  if (/张腿跳/.test(name)) {
    return jointPose({
      torso: [2, 0, -2], head: [-6, 0, 1],
      leftArm: [-8, 0, -96], leftForearm: [0, 0, -18],
      rightArm: [-8, 0, 96], rightForearm: [0, 0, 18],
      leftLeg: [-26, 0, -52], leftShin: [18, 0, 6],
      rightLeg: [-26, 0, 52], rightShin: [18, 0, -6],
    });
  }
  if (/腾空转身/.test(name)) {
    return jointPose({
      torso: [8, 34, -6], head: [-7, -30, 4],
      leftArm: [-10, -8, -86], leftForearm: [0, 0, -64],
      rightArm: [16, 8, 70], rightForearm: [0, 0, 88],
      leftLeg: [-50, -10, -22], leftShin: [72, 0, 6],
      rightLeg: [-28, 12, 24], rightShin: [58, 0, -6],
    });
  }
  if (/向上伸手跳/.test(name)) {
    return jointPose({
      torso: [-4, 0, -2], head: [-14, 0, 1],
      leftArm: [-46, 0, -136], leftForearm: [2, 0, -12],
      rightArm: [-46, 0, 136], rightForearm: [2, 0, 12],
      leftLeg: [-32, 0, -16], leftShin: [52, 0, 4],
      rightLeg: [-40, 0, 17], rightShin: [62, 0, -4],
    });
  }
  if (/跨越障碍/.test(name)) {
    return jointPose({
      torso: [24, -3, -4], head: [-10, 3, 2],
      leftArm: [18, 0, -88], leftForearm: [0, 0, -62],
      rightArm: [-12, 0, 82], rightForearm: [0, 0, 96],
      leftLeg: [-88, 0, -16], leftShin: [22, 0, 4],
      rightLeg: [20, 0, 18], rightShin: [84, 0, -5],
    });
  }
  if (/跳跃落地/.test(name)) {
    return jointPose({
      torso: [28, 0, -4], head: [-10, 0, 2],
      leftArm: [-8, 0, -74], leftForearm: [0, 0, -46],
      rightArm: [-8, 0, 74], rightForearm: [0, 0, 46],
      leftLeg: [-58, 0, -20], leftShin: [88, 0, 6],
      rightLeg: [-54, 0, 20], rightShin: [84, 0, -6],
    });
  }
  if (/落地缓冲/.test(name)) {
    return jointPose({
      torso: [40, 0, -5], head: [-16, 0, 3],
      leftArm: [28, 0, -66], leftForearm: [10, 0, -52],
      rightArm: [28, 0, 66], rightForearm: [10, 0, 52],
      leftLeg: [-78, 0, -22], leftShin: [106, 0, 7],
      rightLeg: [-78, 0, 22], rightShin: [106, 0, -7],
    });
  }
  return jointPose({
    torso: [10, 0, -2], head: [-7, 0, 1],
    leftArm: [18, 0, -42], leftForearm: [4, 0, 58],
    rightArm: [18, 0, 42], rightForearm: [4, 0, -58],
    leftLeg: [-40, 0, -14], leftShin: [68, 0, 4],
    rightLeg: [-34, 0, 14], rightShin: [62, 0, -4],
  });
}

function createSemanticJointPose(item: PoseItem): JointPose {
  // V2 does not infer poses by overlapping tags. Every primary category now
  // resolves through its own authored parameter table, so the title is the
  // single source of truth for the skeleton shape.
  switch (item.category) {
    case "standing": return createStandingJointPose(item.name);
    case "walking": return createWalkingJointPose(item.name);
    case "running": return createRunningJointPose(item.name);
    case "jumping": return createJumpingJointPose(item.name);
    case "squatting": return createSquattingJointPose(item.name);
    case "sitting": return createSeatedJointPose(item.name);
    case "kneeling": return createKneelingJointPose(item.name);
    case "lying": return createLyingJointPose(item.name);
    case "prone": return createProneJointPose(item.name);
    case "leaning": return createLeaningJointPose(item.name);
    case "ground": return createGroundActionJointPose(item.name);
    default: return jointPose();
  }
}
const poseItemByEngineIndex = new Map(poseItems.map((item) => [item.enginePoseIndex, item]));

type HumanoidBoneName =
  | "Hips"
  | "Spine"
  | "Chest"
  | "Neck"
  | "Head"
  | "LeftShoulder"
  | "LeftUpperArm"
  | "LeftLowerArm"
  | "LeftHand"
  | "RightShoulder"
  | "RightUpperArm"
  | "RightLowerArm"
  | "RightHand"
  | "LeftUpperLeg"
  | "LeftLowerLeg"
  | "LeftFoot"
  | "RightUpperLeg"
  | "RightLowerLeg"
  | "RightFoot";

type BonePoseParameter = {
  rotation: [number, number, number];
  // Optional model-independent translation, expressed in shoulder-width units.
  // Only the Hips bone uses it for airborne root motion; mesh transforms remain untouched.
  position?: [number, number, number];
};

type PoseRuntimeParameter = {
  id: string;
  nameCn: string;
  nameEn: string;
  category: PoseCategory;
  tags: string[];
  direction: PoseDirection;
  intensity: PoseIntensity;
  styleTags: PoseStyle[];
  basePose: string;
  bones: Partial<Record<HumanoidBoneName, BonePoseParameter>>;
  notes: string;
};

const jointToBone: Record<keyof JointPose, HumanoidBoneName> = {
  hips: "Hips",
  torso: "Spine",
  chest: "Chest",
  neck: "Neck",
  head: "Head",
  leftShoulder: "LeftShoulder",
  leftArm: "LeftUpperArm",
  leftForearm: "LeftLowerArm",
  leftHand: "LeftHand",
  rightShoulder: "RightShoulder",
  rightArm: "RightUpperArm",
  rightForearm: "RightLowerArm",
  rightHand: "RightHand",
  leftLeg: "LeftUpperLeg",
  leftShin: "LeftLowerLeg",
  leftFoot: "LeftFoot",
  rightLeg: "RightUpperLeg",
  rightShin: "RightLowerLeg",
  rightFoot: "RightFoot",
};

const basePoseNameByCategory: Record<PoseCategory, string> = {
  standing: "自然站立",
  walking: "自然行走",
  running: "自然慢跑",
  jumping: "原地起跳",
  squatting: "自然蹲姿",
  sitting: "自然正坐",
  kneeling: "双膝跪地",
  lying: "自然仰躺",
  prone: "自然俯卧",
  leaning: "背靠墙站立",
  ground: "四点支撑",
};

const categoryBaseItems = Object.fromEntries(
  (Object.keys(basePoseNameByCategory) as PoseCategory[]).map((category) => [
    category,
    poseItems.find((item) => item.category === category && item.name === basePoseNameByCategory[category])!,
  ]),
) as Record<PoseCategory, PoseItem>;

const categoryBaseParentId: Record<PoseCategory, string> = {
  standing: "t_pose",
  walking: categoryBaseItems.standing.id,
  running: categoryBaseItems.walking.id,
  jumping: categoryBaseItems.standing.id,
  squatting: categoryBaseItems.standing.id,
  sitting: categoryBaseItems.standing.id,
  kneeling: categoryBaseItems.standing.id,
  lying: categoryBaseItems.standing.id,
  prone: categoryBaseItems.lying.id,
  leaning: categoryBaseItems.standing.id,
  ground: categoryBaseItems.standing.id,
};

function getBasePoseId(item: PoseItem) {
  const categoryBase = categoryBaseItems[item.category];
  return item.id === categoryBase.id ? categoryBaseParentId[item.category] : categoryBase.id;
}

function getAuthoredPoseById(id: string): JointPose {
  if (id === "t_pose") return jointPose();
  const item = poseItems.find((candidate) => candidate.id === id);
  return item ? createSemanticJointPose(item) : jointPose();
}

function rotationsMatch(left: [number, number, number], right: [number, number, number]) {
  return left.every((value, axis) => Math.abs(value - right[axis]) < 0.001);
}

function buildPoseRuntimeParameter(item: PoseItem): PoseRuntimeParameter {
  const basePoseId = getBasePoseId(item);
  const basePose = getAuthoredPoseById(basePoseId);
  const authoredPose = createSemanticJointPose(item);
  const bones: PoseRuntimeParameter["bones"] = {};
  (Object.keys(jointToBone) as Array<keyof JointPose>).forEach((joint) => {
    if (!rotationsMatch(authoredPose[joint], basePose[joint])) {
      bones[jointToBone[joint]] = { rotation: [...authoredPose[joint]] };
    }
  });
  if (item.category === "jumping" && !/落地|缓冲/.test(item.name)) {
    const hips = bones.Hips ?? { rotation: [...authoredPose.hips] };
    hips.position = [0, /向上伸手|双腿腾空|抱膝/.test(item.name) ? 1.15 : 0.82, 0];
    bones.Hips = hips;
  }
  return {
    id: item.id,
    nameCn: item.name,
    nameEn: item.nameEn,
    category: item.category,
    tags: [...item.tags],
    direction: item.direction,
    intensity: item.intensity,
    styleTags: [...item.style],
    basePose: basePoseId,
    bones,
    notes: "Skeleton-only Euler parameters; converted to Quaternion when applied. Model transform is stored independently.",
  };
}

const poseParametersById = new Map<string, PoseRuntimeParameter>();

function resolvePoseRuntimeParameter(parameter: PoseRuntimeParameter, trail = new Set<string>()): JointPose {
  if (trail.has(parameter.id)) return jointPose();
  const nextTrail = new Set(trail).add(parameter.id);
  const parent = parameter.basePose === "t_pose" ? undefined : poseParametersById.get(parameter.basePose);
  const pose = parent ? resolvePoseRuntimeParameter(parent, nextTrail) : jointPose();
  (Object.entries(jointToBone) as Array<[keyof JointPose, HumanoidBoneName]>).forEach(([joint, bone]) => {
    const transform = parameter.bones[bone];
    if (transform) pose[joint] = [...transform.rotation];
  });
  return pose;
}

const poseParametersByEngineIndex = new Map<number, PoseRuntimeParameter>();
const semanticJointPoses: JointPose[] = [];
// Bump this whenever authored pose parameters change. It forces both the live
// artboard and the generated covers to discard poses left by Fast Refresh.
const poseSolverRevision = "pose-engine-v2-skeleton-only-2";
poseItems.forEach((item) => {
  const parameter = buildPoseRuntimeParameter(item);
  poseParametersByEngineIndex.set(item.enginePoseIndex, parameter);
  poseParametersById.set(item.id, parameter);
});
poseItems.forEach((item) => {
  const parameter = poseParametersByEngineIndex.get(item.enginePoseIndex)!;
  semanticJointPoses[item.enginePoseIndex] = resolvePoseRuntimeParameter(parameter);
});

function rotateAround(point: THREE.Vector3, pivot: THREE.Vector3, rotation: [number, number, number]) {
  const euler = new THREE.Euler(...rotation.map(THREE.MathUtils.degToRad) as [number, number, number], "XYZ");
  return point.sub(pivot).applyEuler(euler).add(pivot);
}

type RigidComponent = { vertices: number[]; center: THREE.Vector3 };

type ComponentRegion = {
  nx: number;
  ny: number;
  left: boolean;
  isArm: boolean;
  isHead: boolean;
  isLeg: boolean;
};

function getComponentRegion(component: RigidComponent, bounds: { min: THREE.Vector3; max: THREE.Vector3 }): ComponentRegion {
  const size = bounds.max.clone().sub(bounds.min);
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const ny = (component.center.y - bounds.min.y) / Math.max(size.y, 0.0001);
  const nx = (component.center.x - centerX) / Math.max(size.x / 2, 0.0001);
  return {
    nx,
    ny,
    left: nx < 0,
    isArm: ny > 0.34 && ny < 0.82 && Math.abs(nx) > 0.68,
    isHead: ny >= 0.84,
    isLeg: ny < 0.59 && Math.abs(nx) <= 0.68,
  };
}

function prepareRigidPoseGeometry(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const normal = geometry.getAttribute("normal") as THREE.BufferAttribute | undefined;
  const index = geometry.getIndex();
  if (!position || !index) return;

  geometry.computeBoundingBox();
  const parent = Array.from({ length: position.count }, (_, vertex) => vertex);
  const find = (vertex: number): number => parent[vertex] === vertex ? vertex : (parent[vertex] = find(parent[vertex]));
  const unite = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };

  for (let offset = 0; offset < index.count; offset += 3) {
    const a = index.getX(offset);
    const b = index.getX(offset + 1);
    const c = index.getX(offset + 2);
    unite(a, b);
    unite(b, c);
  }

  const groups = new Map<number, number[]>();
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const root = find(vertex);
    const vertices = groups.get(root) ?? [];
    vertices.push(vertex);
    groups.set(root, vertices);
  }

  const components: RigidComponent[] = [...groups.values()].map((vertices) => {
    const center = new THREE.Vector3();
    vertices.forEach((vertex) => center.add(new THREE.Vector3(position.getX(vertex), position.getY(vertex), position.getZ(vertex))));
    return { vertices, center: center.multiplyScalar(1 / vertices.length) };
  });

  geometry.userData.poseboardBasePosition = new Float32Array(position.array as ArrayLike<number>);
  geometry.userData.poseboardBaseNormal = normal ? new Float32Array(normal.array as ArrayLike<number>) : undefined;
  geometry.userData.poseboardBounds = {
    min: geometry.boundingBox!.min.clone(),
    max: geometry.boundingBox!.max.clone(),
  };
  geometry.userData.poseboardComponents = components;
}

function mirrorRotation(rotation: [number, number, number]): [number, number, number] {
  return [rotation[0], -rotation[1], -rotation[2]];
}

function mirrorJointPose(source: JointPose): JointPose {
  return jointPose({
    hips: mirrorRotation(source.hips),
    torso: mirrorRotation(source.torso),
    chest: mirrorRotation(source.chest),
    neck: mirrorRotation(source.neck),
    head: mirrorRotation(source.head),
    leftShoulder: mirrorRotation(source.rightShoulder),
    leftArm: mirrorRotation(source.rightArm),
    leftForearm: mirrorRotation(source.rightForearm),
    leftHand: mirrorRotation(source.rightHand),
    rightShoulder: mirrorRotation(source.leftShoulder),
    rightArm: mirrorRotation(source.leftArm),
    rightForearm: mirrorRotation(source.leftForearm),
    rightHand: mirrorRotation(source.leftHand),
    leftLeg: mirrorRotation(source.rightLeg),
    leftShin: mirrorRotation(source.rightShin),
    leftFoot: mirrorRotation(source.rightFoot),
    rightLeg: mirrorRotation(source.leftLeg),
    rightShin: mirrorRotation(source.leftShin),
    rightFoot: mirrorRotation(source.leftFoot),
  });
}

type RigJoint = keyof JointPose;

type RigBinding = {
  root: THREE.Object3D;
  humanoidBones: Partial<Record<HumanoidBoneName, THREE.Bone>>;
  bonesByName: Map<string, THREE.Bone>;
  restQuaternions: Map<THREE.Bone, THREE.Quaternion>;
  restPositions: Map<THREE.Bone, THREE.Vector3>;
  restRootPosition: THREE.Vector3;
};

type ArmBoneSide = "left" | "right";
type ArmIKAnchor = "head" | "chest" | "pelvis";
type ArmIKTarget = {
  side: ArmBoneSide;
  anchor: ArmIKAnchor;
  // Body-space offsets measured in shoulder widths: sideways, upward, forward.
  offset: [number, number, number];
  // Elbow guide measured from the shoulder in the same body-space basis.
  pole: [number, number, number];
  // Direction of the fingers in body space after the wrist reaches its target.
  handDirection: [number, number, number];
};

const humanoidBoneOrder: HumanoidBoneName[] = [
  "Hips", "Spine", "Chest", "Neck", "Head",
  "LeftShoulder", "LeftUpperArm", "LeftLowerArm", "LeftHand",
  "RightShoulder", "RightUpperArm", "RightLowerArm", "RightHand",
  "LeftUpperLeg", "LeftLowerLeg", "LeftFoot",
  "RightUpperLeg", "RightLowerLeg", "RightFoot",
];

const humanoidBoneAliases: Record<HumanoidBoneName, readonly string[]> = {
  Hips: ["pelvis", "Hips", "mixamorigHips", "mixamorig:Hips"],
  Spine: ["spine_01", "Spine", "mixamorigSpine", "mixamorig:Spine"],
  Chest: ["spine_03", "Chest", "UpperChest", "mixamorigSpine2", "mixamorig:Spine2"],
  Neck: ["neck_01", "Neck", "mixamorigNeck", "mixamorig:Neck"],
  Head: ["Head", "head", "mixamorigHead", "mixamorig:Head"],
  LeftShoulder: ["clavicle_l", "LeftShoulder", "mixamorigLeftShoulder", "mixamorig:LeftShoulder"],
  LeftUpperArm: ["upperarm_l", "LeftUpperArm", "LeftArm", "mixamorigLeftArm", "mixamorig:LeftArm"],
  LeftLowerArm: ["lowerarm_l", "LeftLowerArm", "LeftForeArm", "mixamorigLeftForeArm", "mixamorig:LeftForeArm"],
  LeftHand: ["hand_l", "LeftHand", "mixamorigLeftHand", "mixamorig:LeftHand"],
  RightShoulder: ["clavicle_r", "RightShoulder", "mixamorigRightShoulder", "mixamorig:RightShoulder"],
  RightUpperArm: ["upperarm_r", "RightUpperArm", "RightArm", "mixamorigRightArm", "mixamorig:RightArm"],
  RightLowerArm: ["lowerarm_r", "RightLowerArm", "RightForeArm", "mixamorigRightForeArm", "mixamorig:RightForeArm"],
  RightHand: ["hand_r", "RightHand", "mixamorigRightHand", "mixamorig:RightHand"],
  LeftUpperLeg: ["thigh_l", "LeftUpperLeg", "LeftUpLeg", "mixamorigLeftUpLeg", "mixamorig:LeftUpLeg"],
  LeftLowerLeg: ["calf_l", "LeftLowerLeg", "LeftLeg", "mixamorigLeftLeg", "mixamorig:LeftLeg"],
  LeftFoot: ["foot_l", "LeftFoot", "mixamorigLeftFoot", "mixamorig:LeftFoot"],
  RightUpperLeg: ["thigh_r", "RightUpperLeg", "RightUpLeg", "mixamorigRightUpLeg", "mixamorig:RightUpLeg"],
  RightLowerLeg: ["calf_r", "RightLowerLeg", "RightLeg", "mixamorigRightLeg", "mixamorig:RightLeg"],
  RightFoot: ["foot_r", "RightFoot", "mixamorigRightFoot", "mixamorig:RightFoot"],
};

const rigJointOrder: RigJoint[] = [
  "hips",
  "torso",
  "chest",
  "neck",
  "head",
  "leftShoulder",
  "leftArm",
  "leftForearm",
  "leftHand",
  "rightShoulder",
  "rightArm",
  "rightForearm",
  "rightHand",
  "leftLeg",
  "leftShin",
  "leftFoot",
  "rightLeg",
  "rightShin",
  "rightFoot",
];

const rigJointRotationLimits: Record<RigJoint, [[number, number], [number, number], [number, number]]> = {
  hips: [[-120, 120], [-180, 180], [-120, 120]],
  torso: [[-55, 55], [-50, 50], [-35, 35]],
  chest: [[-45, 45], [-55, 55], [-40, 40]],
  neck: [[-35, 35], [-55, 55], [-30, 30]],
  head: [[-45, 45], [-85, 85], [-35, 35]],
  leftShoulder: [[-35, 35], [-35, 35], [-45, 45]],
  leftArm: [[-110, 110], [-60, 60], [-140, 140]],
  leftForearm: [[-60, 60], [-45, 45], [-140, 140]],
  leftHand: [[-45, 45], [-45, 45], [-65, 65]],
  rightShoulder: [[-35, 35], [-35, 35], [-45, 45]],
  rightArm: [[-110, 110], [-60, 60], [-140, 140]],
  rightForearm: [[-60, 60], [-45, 45], [-140, 140]],
  rightHand: [[-45, 45], [-45, 45], [-65, 65]],
  leftLeg: [[-115, 95], [-50, 50], [-60, 60]],
  leftShin: [[-115, 115], [-25, 25], [-25, 25]],
  leftFoot: [[-55, 55], [-35, 35], [-35, 35]],
  rightLeg: [[-115, 95], [-50, 50], [-60, 60]],
  rightShin: [[-115, 115], [-25, 25], [-25, 25]],
  rightFoot: [[-55, 55], [-35, 35], [-35, 35]],
};

type PoseAuditFinding = { id: string; name: string; issue: string };

function buildPoseEngineAudit() {
  const findings: PoseAuditFinding[] = [];
  const exactFingerprints = new Map<string, PoseItem[]>();
  const vectors = new Map<string, number[]>();

  poseItems.forEach((item) => {
    const pose = semanticJointPoses[item.enginePoseIndex];
    const parameter = poseParametersByEngineIndex.get(item.enginePoseIndex);
    if (!pose || !parameter) {
      findings.push({ id: item.id, name: item.name, issue: "missing-runtime-parameter" });
      return;
    }
    const vector = rigJointOrder.flatMap((joint) => pose[joint]);
    const hipsPosition = parameter.bones.Hips?.position ?? [0, 0, 0];
    vector.push(...hipsPosition.map((value) => value * 30));
    const ikTargets = getArmIKTargets(item, false);
    (["left", "right"] as ArmBoneSide[]).forEach((side) => {
      const target = ikTargets.find((candidate) => candidate.side === side);
      vector.push(...(target ? [...target.offset, ...target.pole, ...target.handDirection].map((value) => value * 30) : Array(9).fill(0)));
    });
    vectors.set(item.id, vector);
    const fingerprint = JSON.stringify(vector);
    exactFingerprints.set(fingerprint, [...(exactFingerprints.get(fingerprint) ?? []), item]);

    rigJointOrder.forEach((joint) => {
      pose[joint].forEach((value, axis) => {
        const [minimum, maximum] = rigJointRotationLimits[joint][axis];
        if (!Number.isFinite(value) || value < minimum || value > maximum) {
          findings.push({ id: item.id, name: item.name, issue: `${joint}[${axis}]=${value} outside ${minimum}..${maximum}` });
        }
      });
    });

    if (item.category === "lying" && Math.abs(pose.hips[2]) < 70) findings.push({ id: item.id, name: item.name, issue: "lying-pose-not-horizontal" });
    if (item.category === "prone" && (Math.abs(pose.hips[1]) < 150 || Math.abs(pose.hips[2]) < 70)) findings.push({ id: item.id, name: item.name, issue: "prone-pose-not-face-down" });
    if (item.category === "running" && pose.hips[0] + pose.torso[0] < 12) findings.push({ id: item.id, name: item.name, issue: "running-pose-lacks-forward-drive" });
    if (item.name === "单手叉腰" && getArmIKTargets(item, false).length !== 1) findings.push({ id: item.id, name: item.name, issue: "hand-on-hip-IK-missing" });
    if (item.name === "全力冲刺" && (getArmIKTargets(item, false).length !== 2 || pose.hips[0] < 10)) findings.push({ id: item.id, name: item.name, issue: "sprint-chain-incomplete" });
  });

  const exactDuplicates = [...exactFingerprints.values()]
    .filter((items) => items.length > 1)
    .map((items) => items.map((item) => item.name));
  const nearDuplicates: string[][] = [];
  (Object.keys(basePoseNameByCategory) as PoseCategory[]).forEach((category) => {
    const items = poseItems.filter((item) => item.category === category);
    for (let left = 0; left < items.length; left += 1) {
      for (let right = left + 1; right < items.length; right += 1) {
        const a = vectors.get(items[left].id)!;
        const b = vectors.get(items[right].id)!;
        const deltas = a.map((value, index) => Math.abs(value - b[index]));
        const rms = Math.sqrt(deltas.reduce((sum, value) => sum + value * value, 0) / deltas.length);
        if (rms < 2.4 && Math.max(...deltas) < 11) nearDuplicates.push([items[left].name, items[right].name]);
      }
    }
  });

  return {
    revision: poseSolverRevision,
    checked: poseItems.length,
    uniqueIds: new Set(poseItems.map((item) => item.id)).size,
    exactDuplicates,
    nearDuplicates,
    findings,
    criticalTests: {
      naturalStanding: findings.every((finding) => finding.name !== "自然站立"),
      singleHandOnHip: findings.every((finding) => finding.name !== "单手叉腰"),
      fullSprint: findings.every((finding) => finding.name !== "全力冲刺"),
    },
  };
}

const poseEngineAudit = buildPoseEngineAudit();
(globalThis as typeof globalThis & { __POSEBOARD_ENGINE_AUDIT__?: typeof poseEngineAudit }).__POSEBOARD_ENGINE_AUDIT__ = poseEngineAudit;

function getSafeRigJointRotation(joint: RigJoint, source: [number, number, number], safetyFactor: number): [number, number, number] {
  const limits = rigJointRotationLimits[joint];
  return source.map((value, axis) => THREE.MathUtils.clamp(value * safetyFactor, limits[axis][0], limits[axis][1])) as [number, number, number];
}

function normalizeBoneName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function createHumanoidBoneMapping(bonesByName: Map<string, THREE.Bone>) {
  const normalizedBones = new Map<string, THREE.Bone>();
  bonesByName.forEach((bone, name) => normalizedBones.set(normalizeBoneName(name), bone));
  const humanoidBones: Partial<Record<HumanoidBoneName, THREE.Bone>> = {};
  humanoidBoneOrder.forEach((standardName) => {
    const aliases = humanoidBoneAliases[standardName];
    const bone = aliases.map((alias) => bonesByName.get(alias) ?? normalizedBones.get(normalizeBoneName(alias))).find(Boolean);
    if (bone) humanoidBones[standardName] = bone;
  });
  return humanoidBones;
}

function createRigBinding(root: THREE.Object3D): RigBinding | null {
  const bonesByName = new Map<string, THREE.Bone>();
  root.traverse((child) => {
    if (child instanceof THREE.Bone) bonesByName.set(child.name, child);
  });

  const humanoidBones = createHumanoidBoneMapping(bonesByName);
  const missingBones = humanoidBoneOrder.filter((name) => !humanoidBones[name]);
  root.userData.poseboardBoneMapping = Object.fromEntries(
    humanoidBoneOrder.flatMap((name) => humanoidBones[name] ? [[name, humanoidBones[name]!.name]] : []),
  );
  root.userData.poseboardMissingBones = missingBones;
  if (missingBones.length > 0) return null;

  const restQuaternions = new Map<THREE.Bone, THREE.Quaternion>();
  const restPositions = new Map<THREE.Bone, THREE.Vector3>();
  bonesByName.forEach((bone) => {
    restQuaternions.set(bone, bone.quaternion.clone());
    restPositions.set(bone, bone.position.clone());
  });
  const rig = { root, humanoidBones, bonesByName, restQuaternions, restPositions, restRootPosition: root.position.clone() };
  root.userData.poseboardIK = {
    hand: (side: ArmBoneSide, target: [number, number, number], pole: [number, number, number]) =>
      solveRigEffectorTarget(rig, side === "left" ? "LeftHand" : "RightHand", target, pole),
    foot: (side: ArmBoneSide, target: [number, number, number], pole: [number, number, number]) =>
      solveRigEffectorTarget(rig, side === "left" ? "LeftFoot" : "RightFoot", target, pole),
    head: (target: [number, number, number]) => applyHeadIKTarget(rig, target),
  };
  return rig;
}

function resetRigPose(rig: RigBinding) {
  rig.restQuaternions.forEach((quaternion, bone) => bone.quaternion.copy(quaternion));
  rig.restPositions.forEach((position, bone) => bone.position.copy(position));
  rig.root.position.copy(rig.restRootPosition);
  rig.root.updateMatrixWorld(true);
}

function groundRigInParentSpace(rig: RigBinding) {
  rig.root.updateMatrixWorld(true);
  const parentInverse = rig.root.parent
    ? rig.root.parent.matrixWorld.clone().invert()
    : new THREE.Matrix4().identity();
  const bounds = new THREE.Box3().makeEmpty();
  const point = new THREE.Vector3();

  rig.root.traverse((child) => {
    if (!(child instanceof THREE.SkinnedMesh)) return;
    child.skeleton.update();
    child.computeBoundingBox();
    const box = child.boundingBox;
    if (!box) return;
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          point.set(x, y, z).applyMatrix4(child.matrixWorld).applyMatrix4(parentInverse);
          bounds.expandByPoint(point);
        }
      }
    }
  });

  if (bounds.isEmpty() || !Number.isFinite(bounds.min.y)) return;
  rig.root.position.y -= bounds.min.y;
  rig.root.updateMatrixWorld(true);
  rig.root.userData.poseboardGroundCorrection = -bounds.min.y;
}

function applyRigJointRotation(rig: RigBinding, joint: RigJoint, rotation: [number, number, number]) {
  const bone = rig.humanoidBones[jointToBone[joint]];
  const parent = bone?.parent;
  if (!bone || !parent || rotation.every((value) => Math.abs(value) < 0.001)) return;

  rig.root.updateMatrixWorld(true);
  const rootWorld = rig.root.getWorldQuaternion(new THREE.Quaternion());
  const parentWorld = parent.getWorldQuaternion(new THREE.Quaternion());
  const parentInRig = rootWorld.clone().invert().multiply(parentWorld);
  const deltaInRig = new THREE.Quaternion().setFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(rotation[0]),
    THREE.MathUtils.degToRad(rotation[1]),
    THREE.MathUtils.degToRad(rotation[2]),
    "XYZ",
  ));
  const localDelta = parentInRig.clone().invert().multiply(deltaInRig).multiply(parentInRig);
  bone.quaternion.premultiply(localDelta);
  bone.updateMatrixWorld(true);
}

function applyRigBoneTranslation(
  rig: RigBinding,
  boneName: HumanoidBoneName,
  translationInShoulderWidths: [number, number, number],
) {
  const bone = rig.humanoidBones[boneName];
  const parent = bone?.parent;
  const rest = bone ? rig.restPositions.get(bone) : undefined;
  const leftShoulder = getRigBonePosition(rig, "LeftUpperArm");
  const rightShoulder = getRigBonePosition(rig, "RightUpperArm");
  if (!bone || !parent || !rest || !leftShoulder || !rightShoulder) return;

  const shoulderWidth = Math.max(leftShoulder.distanceTo(rightShoulder), 0.001);
  const deltaInRig = new THREE.Vector3(...translationInShoulderWidths).multiplyScalar(shoulderWidth);
  const rootWorld = rig.root.getWorldQuaternion(new THREE.Quaternion());
  const parentWorldInverse = parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  const deltaInParent = deltaInRig.applyQuaternion(rootWorld).applyQuaternion(parentWorldInverse);
  bone.position.copy(rest).add(deltaInParent);
  bone.updateMatrixWorld(true);
}

function getRigBonePosition(rig: RigBinding, source: HumanoidBoneName | THREE.Bone) {
  const bone = typeof source === "string" ? rig.humanoidBones[source] : source;
  if (!bone) return null;
  const worldPosition = bone.getWorldPosition(new THREE.Vector3());
  return rig.root.worldToLocal(worldPosition);
}

function mirrorArmIKTargets(targets: ArmIKTarget[]) {
  return targets.map((target): ArmIKTarget => ({
    ...target,
    side: target.side === "left" ? "right" : "left",
    offset: [-target.offset[0], target.offset[1], target.offset[2]],
    pole: [-target.pole[0], target.pole[1], target.pole[2]],
    handDirection: [-target.handDirection[0], target.handDirection[1], target.handDirection[2]],
  }));
}

function getArmIKTargets(item: PoseItem | undefined, mirrored: boolean): ArmIKTarget[] {
  if (!item) return [];
  const name = item.name;
  let targets: ArmIKTarget[] = [];

  if (/起跑准备|冲刺起步/.test(name)) {
    // Sprinter start: both hands reach below and slightly ahead of the pelvis.
    // Separate X/Z offsets keep the palms from overlapping each other.
    targets = [
      { side: "left", anchor: "chest", offset: [0.48, -1.28, 0.92], pole: [0.9, -0.62, 0.72], handDirection: [0, 0, -1] },
      { side: "right", anchor: "chest", offset: [-0.48, -1.28, 1.02], pole: [-0.9, -0.62, 0.78], handDirection: [0, 0, -1] },
    ];
  } else if (/双手叉腰/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.46, 0.42, 0.12], pole: [1.22, 0.58, -0.08], handDirection: [0, -1, 0.08] },
      { side: "right", anchor: "pelvis", offset: [-0.46, 0.42, 0.12], pole: [-1.22, 0.58, -0.08], handDirection: [0, -1, 0.08] },
    ];
  } else if (/单手叉腰/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.46, 0.42, 0.12], pole: [1.22, 0.58, -0.08], handDirection: [0, -1, 0.08] },
    ];
  } else if (/双手插兜/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.27, 0.54, 0.24], pole: [0.96, 0.38, 0.38], handDirection: [0, -1, 0.12] },
      { side: "right", anchor: "pelvis", offset: [-0.27, 0.54, 0.24], pole: [-0.96, 0.38, 0.38], handDirection: [0, -1, 0.12] },
    ];
  } else if (/单手插兜/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.27, 0.54, 0.24], pole: [0.96, 0.38, 0.38], handDirection: [0, -1, 0.12] },
    ];
  } else if (/双手身前交叠/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [-0.08, 0.62, 0.42], pole: [0.84, 0.18, 0.48], handDirection: [-1, 0.05, 0] },
      { side: "right", anchor: "pelvis", offset: [0.08, 0.56, 0.5], pole: [-0.84, 0.12, 0.56], handDirection: [1, 0.05, 0] },
    ];
  } else if (item.category === "running" && /急停|侧向|回头|转弯/.test(name)) {
    // These poses intentionally use their authored asymmetric arm rotations.
    // Applying the generic running IK here would erase the named action.
    targets = [];
  } else if (item.category === "running") {
    // A readable contralateral running swing: one bent arm in front of the
    // chest and the opposite hand behind the hip. This replaces the previous
    // unconstrained rotations that put a palm over the face or above the head.
    targets = [
      { side: "left", anchor: "chest", offset: [0.38, 0.02, 0.42], pole: [0.9, -0.18, 0.52], handDirection: [0, 0, 1] },
      { side: "right", anchor: "pelvis", offset: [-0.48, 0.24, -0.36], pole: [-0.9, -0.18, -0.35], handDirection: [0, 0, -1] },
    ];
  } else if (/双手抱胸|双臂抱胸|手臂交叉/.test(name)) {
    // Keep one forearm slightly farther forward so the crossed arms layer instead
    // of occupying the same plane or entering the chest.
    targets = [
      { side: "left", anchor: "chest", offset: [-0.1, 0.11, 0.42], pole: [0.9, -0.12, 0.5], handDirection: [-1, 0.08, 0] },
      { side: "right", anchor: "chest", offset: [0.1, -0.02, 0.58], pole: [-0.9, -0.2, 0.64], handDirection: [1, 0.08, 0] },
    ];
  } else if (name === "盘腿坐") {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.34, -0.17, 0.5], pole: [0.8, -0.16, 0.5], handDirection: [0, 0, 1] },
      { side: "right", anchor: "pelvis", offset: [-0.34, -0.17, 0.5], pole: [-0.8, -0.16, 0.5], handDirection: [0, 0, 1] },
    ];
  } else if (/身体前倾坐|手撑膝盖坐/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.34, -0.2, 0.78], pole: [0.78, -0.14, 0.5], handDirection: [0, 0, 1] },
      { side: "right", anchor: "pelvis", offset: [-0.34, -0.2, 0.78], pole: [-0.78, -0.14, 0.5], handDirection: [0, 0, 1] },
    ];
  } else if (/单手撑地起身|倒地支撑/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.46, -0.38, -0.22], pole: [0.86, -0.34, 0.16], handDirection: [0, 0, -1] },
      { side: "right", anchor: "pelvis", offset: [-0.46, -0.38, -0.22], pole: [-0.86, -0.34, 0.16], handDirection: [0, 0, -1] },
    ];
  } else if (/坐地后撑|后手撑地坐/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.5, -0.3, -0.5], pole: [0.92, -0.22, -0.06], handDirection: [0, 0, -1] },
      { side: "right", anchor: "pelvis", offset: [-0.5, -0.3, -0.5], pole: [-0.92, -0.22, -0.06], handDirection: [0, 0, -1] },
    ];
  } else if (name === "半躺支撑") {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.5, -0.24, -0.46], pole: [0.9, -0.2, -0.02], handDirection: [0, 0, -1] },
    ];
  } else if (/双手放腿上/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.3, -0.08, 0.48], pole: [0.76, -0.05, 0.45], handDirection: [0, 0, 1] },
      { side: "right", anchor: "pelvis", offset: [-0.3, -0.08, 0.48], pole: [-0.76, -0.05, 0.45], handDirection: [0, 0, 1] },
    ];
  } else if (/单手撑椅坐/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.58, -0.12, -0.22], pole: [0.88, -0.18, 0.16], handDirection: [0, 0, -1] },
    ];
  } else if (/单手托腮坐/.test(name)) {
    targets = [
      { side: "left", anchor: "head", offset: [0.24, -0.38, 0.22], pole: [0.58, -0.82, 0.34], handDirection: [0, 1, 0.03] },
    ];
  } else if (/反向坐椅/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.25, 0.08, 0.7], pole: [0.86, 0.02, 0.52], handDirection: [-1, 0, 0] },
      { side: "right", anchor: "pelvis", offset: [-0.25, 0.08, 0.7], pole: [-0.86, 0.02, 0.52], handDirection: [1, 0, 0] },
    ];
  } else if (/沙发单手撑头/.test(name)) {
    targets = [
      { side: "left", anchor: "head", offset: [0.5, 0.05, 0.03], pole: [0.88, -0.32, 0.16], handDirection: [0, 1, 0.02] },
    ];
  } else if (/沙发双臂展开/.test(name)) {
    targets = [
      { side: "left", anchor: "chest", offset: [1.52, 0.02, 0.02], pole: [0.9, -0.18, 0.12], handDirection: [1, 0, 0] },
      { side: "right", anchor: "chest", offset: [-1.52, 0.02, 0.02], pole: [-0.9, -0.18, 0.12], handDirection: [-1, 0, 0] },
    ];
  } else if (/双手整理头发/.test(name)) {
    targets = [
      { side: "left", anchor: "head", offset: [0.34, 0.34, 0.16], pole: [0.92, -0.18, 0.45], handDirection: [-0.3, -1, 0.08] },
      { side: "right", anchor: "head", offset: [-0.34, 0.34, 0.16], pole: [-0.92, -0.18, 0.45], handDirection: [0.3, -1, 0.08] },
    ];
  } else if (/双手捧脸|双手捂脸|双手捂嘴/.test(name)) {
    const mouth = /捂嘴/.test(name);
    targets = [
      { side: "left", anchor: "head", offset: [0.32, mouth ? -0.2 : -0.12, 0.25], pole: [0.92, -0.24, 0.5], handDirection: [0, 1, 0.05] },
      { side: "right", anchor: "head", offset: [-0.32, mouth ? -0.2 : -0.12, 0.27], pole: [-0.92, -0.24, 0.52], handDirection: [0, 1, 0.05] },
    ];
  } else if (/单手遮脸/.test(name)) {
    targets = [{ side: "left", anchor: "head", offset: [0.05, 0.02, 0.34], pole: [0.9, -0.24, 0.54], handDirection: [0, 1, 0.04] }];
  } else if (/单手摸发/.test(name)) {
    targets = [{ side: "left", anchor: "head", offset: [0.28, 0.43, 0.16], pole: [0.92, -0.1, 0.48], handDirection: [-0.15, -1, 0.08] }];
  } else if (/单手扶头|手扶头/.test(name)) {
    targets = [{ side: "left", anchor: "head", offset: [0.33, 0.2, 0.17], pole: [0.94, -0.18, 0.48], handDirection: [0, -1, 0.08] }];
  } else if (/手扶下巴|扶下巴|托腮/.test(name)) {
    targets = [{ side: "left", anchor: "head", offset: [0.2, -0.25, 0.29], pole: [0.82, -0.36, 0.58], handDirection: [0, 1, 0.04] }];
  } else if (/手扶颈部|扶颈/.test(name)) {
    targets = [{ side: "left", anchor: "head", offset: [0.25, -0.08, 0.24], pole: [0.88, -0.3, 0.52], handDirection: [0, -1, 0.04] }];
  } else if (/手扶脸/.test(name)) {
    targets = [{ side: "left", anchor: "head", offset: [0.56, 0.18, 0.34], pole: [1.3, 0.1, 0.7], handDirection: [0, 1, 0.04] }];
  } else if (/指向镜头/.test(name)) {
    targets = [{ side: "right", anchor: "chest", offset: [-0.08, -0.04, 1.55], pole: [-0.72, -0.72, 0.68], handDirection: [0, 0, 1] }];
  } else if (/耳机|打电话/.test(name)) {
    targets = [{ side: "left", anchor: "head", offset: [0.35, 0.1, 0.17], pole: [0.94, -0.2, 0.5], handDirection: [0, 1, 0.04] }];
  } else if (/腰间持物/.test(name)) {
    targets = [
      { side: "left", anchor: "pelvis", offset: [0.22, 0.48, 0.43], pole: [0.78, -0.02, 0.52], handDirection: [-1, 0.08, 0] },
      { side: "right", anchor: "pelvis", offset: [-0.22, 0.48, 0.43], pole: [-0.78, -0.02, 0.52], handDirection: [1, 0.08, 0] },
    ];
  } else if (/胸前持物/.test(name)) {
    targets = [
      { side: "left", anchor: "chest", offset: [0.16, -0.08, 0.46], pole: [0.82, -0.24, 0.54], handDirection: [-1, 0.08, 0] },
      { side: "right", anchor: "chest", offset: [-0.16, -0.08, 0.46], pole: [-0.82, -0.24, 0.54], handDirection: [1, 0.08, 0] },
    ];
  } else if (/双手托举商品|双手持物|看书|看手机|拿相机/.test(name)) {
    const low = /看书|看手机/.test(name);
    targets = [
      { side: "left", anchor: "chest", offset: [0.15, low ? -0.2 : -0.08, 0.5], pole: [0.86, -0.24, 0.58], handDirection: [-1, 0.08, 0] },
      { side: "right", anchor: "chest", offset: [-0.15, low ? -0.2 : -0.08, 0.5], pole: [-0.86, -0.24, 0.58], handDirection: [1, 0.08, 0] },
    ];
  }

  return mirrored ? mirrorArmIKTargets(targets) : targets;
}

function aimRigBoneAt(bone: THREE.Bone, child: THREE.Bone, targetWorld: THREE.Vector3, restQuaternion: THREE.Quaternion) {
  const parent = bone.parent;
  if (!parent) return;
  const boneWorld = bone.getWorldPosition(new THREE.Vector3());
  const desiredWorld = targetWorld.clone().sub(boneWorld).normalize();
  const parentWorldInverse = parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  const desiredInParent = desiredWorld.applyQuaternion(parentWorldInverse).normalize();
  const restDirectionInParent = child.position.clone().normalize().applyQuaternion(restQuaternion);
  const aim = new THREE.Quaternion().setFromUnitVectors(restDirectionInParent, desiredInParent);
  bone.quaternion.copy(aim.multiply(restQuaternion));
  bone.updateMatrixWorld(true);
}

type TwoBoneEffector = "LeftHand" | "RightHand" | "LeftFoot" | "RightFoot";

const effectorChains: Record<TwoBoneEffector, [HumanoidBoneName, HumanoidBoneName, HumanoidBoneName]> = {
  LeftHand: ["LeftUpperArm", "LeftLowerArm", "LeftHand"],
  RightHand: ["RightUpperArm", "RightLowerArm", "RightHand"],
  LeftFoot: ["LeftUpperLeg", "LeftLowerLeg", "LeftFoot"],
  RightFoot: ["RightUpperLeg", "RightLowerLeg", "RightFoot"],
};

function solveTwoBoneRigChain(
  rig: RigBinding,
  chain: [HumanoidBoneName, HumanoidBoneName, HumanoidBoneName],
  targetWorld: THREE.Vector3,
  poleWorld: THREE.Vector3,
) {
  const upper = rig.humanoidBones[chain[0]];
  const lower = rig.humanoidBones[chain[1]];
  const end = rig.humanoidBones[chain[2]];
  if (!upper || !lower || !end) return false;
  const upperRest = rig.restQuaternions.get(upper);
  const lowerRest = rig.restQuaternions.get(lower);
  if (!upperRest || !lowerRest) return false;

  rig.root.updateMatrixWorld(true);
  const upperWorld = upper.getWorldPosition(new THREE.Vector3());
  const lowerWorld = lower.getWorldPosition(new THREE.Vector3());
  const endWorld = end.getWorldPosition(new THREE.Vector3());
  const upperLength = Math.max(upperWorld.distanceTo(lowerWorld), 0.001);
  const lowerLength = Math.max(lowerWorld.distanceTo(endWorld), 0.001);
  const reach = targetWorld.clone().sub(upperWorld);
  const rawDistance = Math.max(reach.length(), 0.001);
  const minDistance = Math.abs(upperLength - lowerLength) + 0.006;
  const maxDistance = upperLength + lowerLength - 0.006;
  const distance = THREE.MathUtils.clamp(rawDistance, minDistance, maxDistance);
  const direction = reach.normalize();
  const reachableTarget = upperWorld.clone().addScaledVector(direction, distance);
  const along = (upperLength * upperLength - lowerLength * lowerLength + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(upperLength * upperLength - along * along, 0));
  const poleDirection = poleWorld.clone().sub(upperWorld);
  poleDirection.addScaledVector(direction, -poleDirection.dot(direction));
  if (poleDirection.lengthSq() < 1e-8) poleDirection.set(0, 0, 1).transformDirection(rig.root.matrixWorld);
  poleDirection.normalize();
  const solvedMiddle = upperWorld.clone().addScaledVector(direction, along).addScaledVector(poleDirection, height);

  aimRigBoneAt(upper, lower, solvedMiddle, upperRest);
  rig.root.updateMatrixWorld(true);
  aimRigBoneAt(lower, end, reachableTarget, lowerRest);
  rig.root.updateMatrixWorld(true);
  return true;
}

function solveRigEffectorTarget(
  rig: RigBinding,
  effector: TwoBoneEffector,
  targetInRig: [number, number, number],
  poleInRig: [number, number, number],
) {
  const targetWorld = rig.root.localToWorld(new THREE.Vector3(...targetInRig));
  const poleWorld = rig.root.localToWorld(new THREE.Vector3(...poleInRig));
  return solveTwoBoneRigChain(rig, effectorChains[effector], targetWorld, poleWorld);
}

function applyHeadIKTarget(rig: RigBinding, targetInRig: [number, number, number]) {
  const headPosition = getRigBonePosition(rig, "Head");
  if (!headPosition) return false;
  const direction = new THREE.Vector3(...targetInRig).sub(headPosition).normalize();
  const yaw = THREE.MathUtils.radToDeg(Math.atan2(direction.x, Math.max(Math.abs(direction.z), 0.0001) * Math.sign(direction.z || 1)));
  const pitch = THREE.MathUtils.radToDeg(-Math.atan2(direction.y, Math.hypot(direction.x, direction.z)));
  applyRigJointRotation(rig, "neck", [pitch * 0.38, yaw * 0.38, 0]);
  applyRigJointRotation(rig, "head", [pitch * 0.62, yaw * 0.62, 0]);
  rig.root.updateMatrixWorld(true);
  return true;
}

const ikControlBoneMap: Record<IKControlId, HumanoidBoneName> = {
  hips: "Hips",
  chest: "Chest",
  head: "Head",
  leftShoulder: "LeftUpperArm",
  rightShoulder: "RightUpperArm",
  leftElbow: "LeftLowerArm",
  rightElbow: "RightLowerArm",
  leftHand: "LeftHand",
  rightHand: "RightHand",
  leftHandDirection: "LeftHand",
  rightHandDirection: "RightHand",
  leftHip: "LeftUpperLeg",
  rightHip: "RightUpperLeg",
  leftKnee: "LeftLowerLeg",
  rightKnee: "RightLowerLeg",
  leftFoot: "LeftFoot",
  rightFoot: "RightFoot",
  leftFootDirection: "LeftFoot",
  rightFootDirection: "RightFoot",
};

const ikDirectionControlConfig: Partial<Record<IKControlId, { bone: HumanoidBoneName; child: string; distance: number }>> = {
  leftHandDirection: { bone: "LeftHand", child: "middle_01_l", distance: 0.34 },
  rightHandDirection: { bone: "RightHand", child: "middle_01_r", distance: 0.34 },
  leftFootDirection: { bone: "LeftFoot", child: "ball_l", distance: 0.42 },
  rightFootDirection: { bone: "RightFoot", child: "ball_r", distance: 0.42 },
};

function getIKControlPosition(rig: RigBinding, control: IKControlId, targets: IKTargetMap) {
  const stored = targets[control];
  const directionConfig = ikDirectionControlConfig[control];
  if (directionConfig) {
    if (stored) return new THREE.Vector3(...stored);
    const origin = getRigBonePosition(rig, directionConfig.bone);
    const child = rig.bonesByName.get(directionConfig.child);
    const childPosition = child ? getRigBonePosition(rig, child) : null;
    if (!origin) return null;
    const direction = childPosition?.clone().sub(origin).normalize() ?? new THREE.Vector3(0, 0, 1);
    return origin.clone().addScaledVector(direction, directionConfig.distance);
  }
  if ((control === "leftHand" || control === "rightHand" || control === "leftFoot" || control === "rightFoot" || control === "head") && stored) {
    return new THREE.Vector3(...stored);
  }
  return getRigBonePosition(rig, ikControlBoneMap[control]);
}

function getIKPole(rig: RigBinding, control: "leftHand" | "rightHand" | "leftFoot" | "rightFoot", target: [number, number, number]): [number, number, number] {
  const isLeft = control.startsWith("left");
  const isHand = control.endsWith("Hand");
  const rootBone = isHand
    ? (isLeft ? "LeftUpperArm" : "RightUpperArm")
    : (isLeft ? "LeftUpperLeg" : "RightUpperLeg");
  const root = getRigBonePosition(rig, rootBone) ?? new THREE.Vector3();
  const pole = root.clone().lerp(new THREE.Vector3(...target), 0.48);
  pole.x += isLeft ? 0.48 : -0.48;
  pole.z += isHand ? 0.62 : 0.48;
  if (!isHand) pole.y -= 0.1;
  return [pole.x, pole.y, pole.z];
}

function aimEditorJoint(
  rig: RigBinding,
  boneName: HumanoidBoneName,
  childName: HumanoidBoneName,
  target: [number, number, number] | undefined,
) {
  if (!target) return;
  const bone = rig.humanoidBones[boneName];
  const child = rig.humanoidBones[childName];
  const rest = bone ? rig.restQuaternions.get(bone) : undefined;
  if (!bone || !child || !rest) return;
  aimRigBoneAt(bone, child, rig.root.localToWorld(new THREE.Vector3(...target)), rest);
}

function aimEditorEndDirection(
  rig: RigBinding,
  boneName: HumanoidBoneName,
  childRawName: string,
  target: [number, number, number] | undefined,
) {
  if (!target) return;
  const bone = rig.humanoidBones[boneName];
  const child = rig.bonesByName.get(childRawName);
  const rest = bone ? rig.restQuaternions.get(bone) : undefined;
  if (!bone || !child || !rest) return;
  aimRigBoneAt(bone, child, rig.root.localToWorld(new THREE.Vector3(...target)), rest);
}

function moveRigBoneToTarget(rig: RigBinding, boneName: HumanoidBoneName, target: [number, number, number] | undefined) {
  if (!target) return;
  const bone = rig.humanoidBones[boneName];
  if (!bone?.parent) return;
  rig.root.updateMatrixWorld(true);
  const targetWorld = rig.root.localToWorld(new THREE.Vector3(...target));
  bone.position.copy(bone.parent.worldToLocal(targetWorld));
  bone.updateMatrixWorld(true);
}

function solveEditorPole(
  rig: RigBinding,
  effector: TwoBoneEffector,
  pole: [number, number, number] | undefined,
  effectorTarget: [number, number, number] | undefined,
) {
  if (!pole) return;
  const current = effectorTarget ?? getRigBonePosition(rig, effector)?.toArray() as [number, number, number] | undefined;
  if (current) solveRigEffectorTarget(rig, effector, current, pole);
}

function applyEditorIKTargets(rig: RigBinding, targets: IKTargetMap) {
  moveRigBoneToTarget(rig, "Hips", targets.hips);
  aimEditorJoint(rig, "Spine", "Chest", targets.chest);
  aimEditorJoint(rig, "LeftUpperArm", "LeftLowerArm", targets.leftShoulder);
  aimEditorJoint(rig, "RightUpperArm", "RightLowerArm", targets.rightShoulder);
  aimEditorJoint(rig, "LeftUpperLeg", "LeftLowerLeg", targets.leftHip);
  aimEditorJoint(rig, "RightUpperLeg", "RightLowerLeg", targets.rightHip);

  solveEditorPole(rig, "LeftHand", targets.leftElbow, targets.leftHand);
  solveEditorPole(rig, "RightHand", targets.rightElbow, targets.rightHand);
  solveEditorPole(rig, "LeftFoot", targets.leftKnee, targets.leftFoot);
  solveEditorPole(rig, "RightFoot", targets.rightKnee, targets.rightFoot);

  if (targets.leftHand) solveRigEffectorTarget(rig, "LeftHand", targets.leftHand, targets.leftElbow ?? getIKPole(rig, "leftHand", targets.leftHand));
  if (targets.rightHand) solveRigEffectorTarget(rig, "RightHand", targets.rightHand, targets.rightElbow ?? getIKPole(rig, "rightHand", targets.rightHand));
  if (targets.leftFoot) solveRigEffectorTarget(rig, "LeftFoot", targets.leftFoot, targets.leftKnee ?? getIKPole(rig, "leftFoot", targets.leftFoot));
  if (targets.rightFoot) solveRigEffectorTarget(rig, "RightFoot", targets.rightFoot, targets.rightKnee ?? getIKPole(rig, "rightFoot", targets.rightFoot));

  aimEditorEndDirection(rig, "LeftHand", "middle_01_l", targets.leftHandDirection);
  aimEditorEndDirection(rig, "RightHand", "middle_01_r", targets.rightHandDirection);
  aimEditorEndDirection(rig, "LeftFoot", "ball_l", targets.leftFootDirection);
  aimEditorEndDirection(rig, "RightFoot", "ball_r", targets.rightFootDirection);
  if (targets.head) applyHeadIKTarget(rig, targets.head);

  rig.root.updateMatrixWorld(true);
  if (targets.leftFoot || targets.rightFoot) groundRigInParentSpace(rig);
}

function applySemanticBoneDelta(rig: RigBinding, boneName: HumanoidBoneName, rotation: [number, number, number]) {
  const bone = rig.humanoidBones[boneName];
  if (!bone) return;
  const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation.map(THREE.MathUtils.degToRad) as [number, number, number], "XYZ"));
  bone.quaternion.multiply(delta).normalize();
}

function applySemanticPoseModifiers(rig: RigBinding, modifiers: SemanticPoseModifiers) {
  if (modifiers.bodyLean === "forward") {
    applySemanticBoneDelta(rig, "Spine", [8, 0, 0]);
    applySemanticBoneDelta(rig, "Chest", [5, 0, 0]);
  } else if (modifiers.bodyLean === "backward") {
    applySemanticBoneDelta(rig, "Spine", [-8, 0, 0]);
    applySemanticBoneDelta(rig, "Chest", [-5, 0, 0]);
  } else if (modifiers.bodyLean === "side") {
    applySemanticBoneDelta(rig, "Spine", [0, 0, 8]);
  }
  if (modifiers.bodyDirection === "side") applySemanticBoneDelta(rig, "Hips", [0, 48, 0]);
  if (modifiers.torso === "turn") applySemanticBoneDelta(rig, "Chest", [0, 12, 0]);
  if (modifiers.torso === "twist") applySemanticBoneDelta(rig, "Chest", [0, 18, 0]);
  if (modifiers.head === "look_back") {
    applySemanticBoneDelta(rig, "Neck", [0, 22, 0]);
    applySemanticBoneDelta(rig, "Head", [0, 26, 0]);
  } else if (modifiers.head === "look_down") {
    applySemanticBoneDelta(rig, "Head", [14, 0, 0]);
  } else if (modifiers.head === "look_up") {
    applySemanticBoneDelta(rig, "Head", [-14, 0, 0]);
  }
  if (modifiers.rightHand === "holding_weapon") applySemanticBoneDelta(rig, "RightHand", [0, 0, -20]);
  if (modifiers.leftHand === "holding_weapon") applySemanticBoneDelta(rig, "LeftHand", [0, 0, 20]);
  rig.root.updateMatrixWorld(true);
}

function applyArmIKTarget(rig: RigBinding, target: ArmIKTarget, safetyFactor: number) {
  const upperArm = rig.humanoidBones[target.side === "left" ? "LeftUpperArm" : "RightUpperArm"];
  const lowerArm = rig.humanoidBones[target.side === "left" ? "LeftLowerArm" : "RightLowerArm"];
  const hand = rig.humanoidBones[target.side === "left" ? "LeftHand" : "RightHand"];
  const middleFinger = rig.bonesByName.get(`middle_01_${target.side === "left" ? "l" : "r"}`);
  const leftShoulder = getRigBonePosition(rig, "LeftUpperArm");
  const rightShoulder = getRigBonePosition(rig, "RightUpperArm");
  const head = getRigBonePosition(rig, "Head");
  const chest = getRigBonePosition(rig, "Chest");
  const pelvis = getRigBonePosition(rig, "Hips");
  if (!upperArm || !lowerArm || !hand || !leftShoulder || !rightShoulder || !head || !chest || !pelvis) return false;

  const handRest = rig.restQuaternions.get(hand);
  if (!handRest) return false;

  const shoulderWidth = Math.max(leftShoulder.distanceTo(rightShoulder), 0.001);
  const sideAxis = leftShoulder.clone().sub(rightShoulder).normalize();
  const upAxis = head.clone().sub(pelvis).normalize();
  const forwardAxis = sideAxis.clone().cross(upAxis).normalize();
  if (forwardAxis.dot(new THREE.Vector3(0, 0, 1)) < 0) forwardAxis.negate();
  const anchor = target.anchor === "head" ? head : target.anchor === "chest" ? chest : pelvis;
  // If a target triggers the collision fallback, move it forward rather than
  // shrinking the gesture back through the body.
  const clearance = (1 - safetyFactor) * 0.34;
  const targetLocal = anchor.clone()
    .addScaledVector(sideAxis, target.offset[0] * shoulderWidth)
    .addScaledVector(upAxis, target.offset[1] * shoulderWidth)
    .addScaledVector(forwardAxis, (target.offset[2] + clearance) * shoulderWidth);
  const shoulderLocal = getRigBonePosition(rig, upperArm);
  if (!shoulderLocal) return false;
  const poleLocal = shoulderLocal.clone()
    .addScaledVector(sideAxis, target.pole[0] * shoulderWidth)
    .addScaledVector(upAxis, target.pole[1] * shoulderWidth)
    .addScaledVector(forwardAxis, (target.pole[2] + clearance * 0.5) * shoulderWidth);

  const targetWorld = rig.root.localToWorld(targetLocal.clone());
  const poleWorld = rig.root.localToWorld(poleLocal.clone());
  const effector: TwoBoneEffector = target.side === "left" ? "LeftHand" : "RightHand";
  if (!solveTwoBoneRigChain(rig, effectorChains[effector], targetWorld, poleWorld)) return false;
  if (middleFinger) {
    const fingerDirectionLocal = sideAxis.clone().multiplyScalar(target.handDirection[0])
      .addScaledVector(upAxis, target.handDirection[1])
      .addScaledVector(forwardAxis, target.handDirection[2])
      .normalize();
    const fingerDirectionWorld = fingerDirectionLocal.transformDirection(rig.root.matrixWorld);
    const solvedHandWorld = hand.getWorldPosition(new THREE.Vector3());
    aimRigBoneAt(hand, middleFinger, solvedHandWorld.add(fingerDirectionWorld), handRest);
    rig.root.updateMatrixWorld(true);
  }
  return true;
}

function pointInsideEllipsoid(point: THREE.Vector3, center: THREE.Vector3, radii: THREE.Vector3) {
  const offset = point.clone().sub(center);
  return (offset.x * offset.x) / (radii.x * radii.x)
    + (offset.y * offset.y) / (radii.y * radii.y)
    + (offset.z * offset.z) / (radii.z * radii.z) < 1;
}

function sampledSegmentDistance(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3) {
  const first = new THREE.Line3(a, b);
  const second = new THREE.Line3(c, d);
  let closest = Number.POSITIVE_INFINITY;
  const sample = new THREE.Vector3();
  const target = new THREE.Vector3();
  for (let step = 0; step <= 8; step += 1) {
    const alpha = step / 8;
    first.at(alpha, sample);
    second.closestPointToPoint(sample, true, target);
    closest = Math.min(closest, sample.distanceTo(target));
    second.at(alpha, sample);
    first.closestPointToPoint(sample, true, target);
    closest = Math.min(closest, sample.distanceTo(target));
  }
  return closest;
}

type RigCollisionProfile = {
  allowArmPairContact: boolean;
  allowHeadContact: boolean;
  allowLegPairContact: boolean;
  allowTorsoContact: boolean;
};

function getRigSelfCollision(rig: RigBinding, profile: RigCollisionProfile): string | null {
  rig.root.updateMatrixWorld(true);
  const pelvis = getRigBonePosition(rig, "Hips");
  const chest = getRigBonePosition(rig, "Chest");
  const head = getRigBonePosition(rig, "Head");
  const leftShoulder = getRigBonePosition(rig, "LeftUpperArm");
  const leftElbow = getRigBonePosition(rig, "LeftLowerArm");
  const leftHand = getRigBonePosition(rig, "LeftHand");
  const rightShoulder = getRigBonePosition(rig, "RightUpperArm");
  const rightElbow = getRigBonePosition(rig, "RightLowerArm");
  const rightHand = getRigBonePosition(rig, "RightHand");
  const leftHip = getRigBonePosition(rig, "LeftUpperLeg");
  const leftKnee = getRigBonePosition(rig, "LeftLowerLeg");
  const leftFoot = getRigBonePosition(rig, "LeftFoot");
  const rightHip = getRigBonePosition(rig, "RightUpperLeg");
  const rightKnee = getRigBonePosition(rig, "RightLowerLeg");
  const rightFoot = getRigBonePosition(rig, "RightFoot");
  if (!pelvis || !chest || !head || !leftShoulder || !leftElbow || !leftHand || !rightShoulder || !rightElbow || !rightHand || !leftHip || !leftKnee || !leftFoot || !rightHip || !rightKnee || !rightFoot) return null;

  const torsoCenter = pelvis.clone().lerp(chest, 0.52);
  // Use the inner torso core rather than the outer surface so contact poses such
  // as folded arms can sit in front of the chest without being mistaken for a hit.
  const torsoRadii = new THREE.Vector3(0.12, 0.24, 0.09);
  const torsoSamples = [
    leftElbow.clone().lerp(leftHand, 0.35),
    leftElbow.clone().lerp(leftHand, 0.68),
    leftHand,
    rightElbow.clone().lerp(rightHand, 0.35),
    rightElbow.clone().lerp(rightHand, 0.68),
    rightHand,
  ];
  if (!profile.allowTorsoContact && torsoSamples.some((point) => pointInsideEllipsoid(point, torsoCenter, torsoRadii))) return "arm-torso";

  const headClearance = 0.155;
  if (!profile.allowHeadContact && (leftHand.distanceTo(head) < headClearance || rightHand.distanceTo(head) < headClearance)) return "hand-head";
  if (!profile.allowArmPairContact && leftHand.distanceTo(rightHand) < 0.09) return "hand-hand";
  if (!profile.allowArmPairContact && sampledSegmentDistance(leftElbow, leftHand, rightElbow, rightHand) < 0.085) return "forearm-forearm";
  // Paired legs share nearby anatomical origins. A raw capsule distance marks
  // even the model's bind stance as colliding, so V2 checks anatomical side
  // ordering at the distal limb instead. An unexpected Left/Right inversion is
  // a reliable signal of a crossed-through limb; close parallel legs are valid.
  const sideAxis = leftHip.clone().sub(rightHip).normalize();
  const leftThighDistal = leftHip.clone().lerp(leftKnee, 0.72);
  const rightThighDistal = rightHip.clone().lerp(rightKnee, 0.72);
  const leftShinDistal = leftKnee.clone().lerp(leftFoot, 0.72);
  const rightShinDistal = rightKnee.clone().lerp(rightFoot, 0.72);
  if (!profile.allowLegPairContact && leftThighDistal.clone().sub(rightThighDistal).dot(sideAxis) < -0.01) return "thigh-thigh";
  if (!profile.allowLegPairContact && leftShinDistal.clone().sub(rightShinDistal).dot(sideAxis) < -0.01) return "shin-shin";
  return null;
}

function applyRigPose(rig: RigBinding, poseIndex: number, mirrored = false) {
  const sourcePose = semanticJointPoses[poseIndex] ?? jointPoses[0];
  const pose = mirrored ? mirrorJointPose(sourcePose) : sourcePose;
  const poseItem = poseItemByEngineIndex.get(poseIndex);
  const safetyText = poseItem ? `${poseItem.name} ${poseItem.tags.join(" ")}` : "";
  const armIKTargets = getArmIKTargets(poseItem, mirrored);
  const ikSides = new Set(armIKTargets.map(({ side }) => side));
  const collisionProfile: RigCollisionProfile = {
    allowArmPairContact: /抱胸|交叉|交叠|鼓掌|捧脸|捂脸|捂嘴|整理头发|持物|托举|看书|看手机|拿相机|蹲|趴卧/.test(safetyText),
    allowHeadContact: /托腮|扶下巴|扶脸|扶头|撑头|摸发|整理头发|扶颈|捧脸|捂脸|捂嘴|遮脸|耳机|打电话|侧躺|趴卧/.test(safetyText),
    allowLegPairContact: /交叉|二郎|翘腿|并拢|盘腿|抱膝|侧躺|趴卧/.test(safetyText) || poseItem?.direction === "back",
    // Targeted hand contacts must still remain outside the torso volume.
    allowTorsoContact: armIKTargets.length === 0 && (/抱胸|交叉|持物|托举|看手机|看书|相机|手表|胸前|蹲|撑地|后仰|半躺/.test(safetyText) || poseItem?.category === "prone"),
  };
  // Safety correction is deliberately shallow. The old engine repeatedly scaled
  // every joint down to zero, which avoided some contacts by destroying the named
  // action. V2 preserves the authored pose and only allows a small clearance pass.
  const safetyFactors = [1, 0.94, 0.88];
  let fallbackReason: string | null = null;
  for (const safetyFactor of safetyFactors) {
    resetRigPose(rig);
    rigJointOrder.forEach((joint) => {
      const anatomicalSide = joint === "leftShoulder" || joint === "leftArm" || joint === "leftForearm" || joint === "leftHand"
        ? "left"
        : joint === "rightShoulder" || joint === "rightArm" || joint === "rightForearm" || joint === "rightHand"
          ? "right"
          : null;
      if (anatomicalSide && ikSides.has(anatomicalSide)) return;
      // The V1 authoring table was produced while raw .l/.r bones were swapped.
      // Convert those limb-local rotations into the standard anatomical frame
      // after mapping, rather than swapping the actual skeleton again.
      const authoredRotation = anatomicalSide || joint === "leftLeg" || joint === "leftShin" || joint === "leftFoot" || joint === "rightLeg" || joint === "rightShin" || joint === "rightFoot"
        ? mirrorRotation(pose[joint])
        : pose[joint];
      const rotation = getSafeRigJointRotation(joint, authoredRotation, safetyFactor);
      // The supplied character is authored in a T-pose, while PoseBoard presets use
      // relaxed arms as their zero position. Fold that bind-pose offset into shoulders.
      if (joint === "leftArm") rotation[2] -= 90;
      if (joint === "rightArm") rotation[2] += 90;
      applyRigJointRotation(rig, joint, rotation);
    });
    armIKTargets.forEach((target) => applyArmIKTarget(rig, target, safetyFactor));
    rig.root.updateMatrixWorld(true);
    const collision = getRigSelfCollision(rig, collisionProfile);
    if (!collision || safetyFactor === safetyFactors[safetyFactors.length - 1]) {
      rig.root.userData.poseboardSafetyFactor = safetyFactor;
      rig.root.userData.poseboardCollisionFallbackReason = collision ?? fallbackReason;
      break;
    }
    fallbackReason = collision;
  }
  groundRigInParentSpace(rig);
  const hipsPosition = poseParametersByEngineIndex.get(poseIndex)?.bones.Hips?.position;
  if (hipsPosition) {
    const mirroredPosition: [number, number, number] = mirrored
      ? [-hipsPosition[0], hipsPosition[1], hipsPosition[2]]
      : hipsPosition;
    applyRigBoneTranslation(rig, "Hips", mirroredPosition);
    rig.root.updateMatrixWorld(true);
  }
}

(globalThis as typeof globalThis & {
  __POSEBOARD_ENGINE_DEBUG__?: {
    createRigBinding: typeof createRigBinding;
    applyRigPose: typeof applyRigPose;
    poses: typeof poseItems;
  };
}).__POSEBOARD_ENGINE_DEBUG__ = { createRigBinding, applyRigPose, poses: poseItems };

function createMannequinMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xf5f5f3, roughness: 0.76, metalness: 0.03 });
}

function applyRigidPose(mesh: THREE.Mesh, poseIndex: number, mirrored = false) {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const normal = geometry.getAttribute("normal") as THREE.BufferAttribute | undefined;
  const base = geometry.userData.poseboardBasePosition as Float32Array | undefined;
  const baseNormal = geometry.userData.poseboardBaseNormal as Float32Array | undefined;
  const bounds = geometry.userData.poseboardBounds as { min: THREE.Vector3; max: THREE.Vector3 } | undefined;
  const components = geometry.userData.poseboardComponents as RigidComponent[] | undefined;
  if (!base || !bounds || !components || !position) return;

  const sourcePose = semanticJointPoses[poseIndex] ?? jointPoses[0];
  const pose = mirrored ? mirrorJointPose(sourcePose) : sourcePose;
  const size = bounds.max.clone().sub(bounds.min);
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const centerZ = (bounds.min.z + bounds.max.z) / 2;
  const toPoint = (nx: number, ny: number, nz = 0) => new THREE.Vector3(centerX + nx * size.x, bounds.min.y + ny * size.y, centerZ + nz * size.z);

  const rotateNormal = (vector: THREE.Vector3, rotation: [number, number, number]) => vector.applyEuler(new THREE.Euler(...rotation.map(THREE.MathUtils.degToRad) as [number, number, number], "XYZ"));

  components.forEach((component) => {
    const { ny, left, isArm, isHead, isLeg } = getComponentRegion(component, bounds);

    component.vertices.forEach((vertex) => {
      const source = new THREE.Vector3(base[vertex * 3], base[vertex * 3 + 1], base[vertex * 3 + 2]);
      let posed = source.clone();
      const posedNormal = baseNormal && normal ? new THREE.Vector3(baseNormal[vertex * 3], baseNormal[vertex * 3 + 1], baseNormal[vertex * 3 + 2]) : null;

      if (isArm) {
        const shoulder = toPoint(left ? -0.39 : 0.39, 0.7);
        const elbow = toPoint(left ? -0.43 : 0.43, 0.53);
        const upper = left ? pose.leftArm : pose.rightArm;
        const lower = left ? pose.leftForearm : pose.rightForearm;
        posed = rotateAround(posed, shoulder, upper);
        if (posedNormal) rotateNormal(posedNormal, upper);
        if (ny < 0.54) {
          const movedElbow = rotateAround(elbow.clone(), shoulder, upper);
          posed = rotateAround(posed, movedElbow, lower);
          if (posedNormal) rotateNormal(posedNormal, lower);
        }
      } else if (isLeg) {
        const hip = toPoint(left ? -0.18 : 0.18, 0.56);
        const knee = toPoint(left ? -0.24 : 0.24, 0.28);
        const upper = left ? pose.leftLeg : pose.rightLeg;
        const lower = left ? pose.leftShin : pose.rightShin;
        posed = rotateAround(posed, hip, upper);
        if (posedNormal) rotateNormal(posedNormal, upper);
        if (ny < 0.3) {
          const movedKnee = rotateAround(knee.clone(), hip, upper);
          posed = rotateAround(posed, movedKnee, lower);
          if (posedNormal) rotateNormal(posedNormal, lower);
        }
      } else {
        posed = rotateAround(posed, toPoint(0, 0.56), pose.torso);
        if (posedNormal) rotateNormal(posedNormal, pose.torso);
        if (isHead) {
          posed = rotateAround(posed, toPoint(0, 0.86), pose.head);
          if (posedNormal) rotateNormal(posedNormal, pose.head);
        }
      }

      position.setXYZ(vertex, posed.x, posed.y, posed.z);
      if (posedNormal && normal) normal.setXYZ(vertex, posedNormal.x, posedNormal.y, posedNormal.z);
    });
  });

  position.needsUpdate = true;
  if (normal) normal.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

function generatePoseThumbnails(model: THREE.Object3D, poseIndices: number[]) {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(256, 200, false);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9ebef);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x78808f, 2.5));
  const light = new THREE.DirectionalLight(0xffffff, 4.2);
  light.position.set(4, 7, 5);
  light.castShadow = true;
  scene.add(light);
  const camera = new THREE.PerspectiveCamera(presetCameraFov, 1.28, 0.05, 50);
  camera.position.set(...presetCameraPosition);
  camera.lookAt(...presetCameraTarget);

  const thumbnails: Record<number, string> = {};
  poseIndices.forEach((poseIndex) => {
    const item = poseItemByEngineIndex.get(poseIndex);
    if (!item) return;
    const root = new THREE.Group();
    const clone = cloneSkeleton(model);
    const rig = createRigBinding(clone);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry = child.geometry.clone();
        if (!rig) prepareRigidPoseGeometry(child.geometry);
        child.material = createMannequinMaterial();
        child.castShadow = true;
        child.receiveShadow = true;
        if (!rig) applyRigidPose(child, poseIndex);
      }
    });
    if (rig) applyRigPose(rig, poseIndex);
    root.add(clone);
    scene.add(root);
    renderer.render(scene, camera);
    thumbnails[poseIndex] = canvas.toDataURL("image/jpeg", 0.88);
    scene.remove(root);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
      }
    });
  });

  renderer.dispose();
  return thumbnails;
}

function cloneState(state: EditorState): EditorState {
  return {
    ...state,
    position: [...state.position],
    rotation: [...state.rotation],
    perspectiveGrid: clonePerspectiveGrid(state.perspectiveGrid ?? initialPerspectiveGrid),
    semanticModifiers: { ...state.semanticModifiers },
    ikTargets: Object.fromEntries(
      Object.entries(state.ikTargets).map(([key, value]) => [key, value ? [...value] : value]),
    ) as IKTargetMap,
  };
}

function cloneIKTargets(targets: IKTargetMap): IKTargetMap {
  return Object.fromEntries(
    Object.entries(targets).map(([key, value]) => [key, value ? [...value] : value]),
  ) as IKTargetMap;
}

function readSavedPoseRecords(value: unknown): SavedPoseRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Partial<SavedPoseRecord>;
    const basePose = poseItems.find((pose) => pose.id === record.basePoseId);
    if (!basePose || typeof record.id !== "string" || typeof record.name !== "string" || typeof record.nameEn !== "string") return [];
    const rawTargets = record.ikTargets && typeof record.ikTargets === "object" ? record.ikTargets : {};
    const ikTargets = Object.fromEntries(
      Object.entries(rawTargets).filter((entry): entry is [string, [number, number, number]] => (
        Array.isArray(entry[1]) && entry[1].length === 3 && entry[1].every((part) => typeof part === "number" && Number.isFinite(part))
      )),
    ) as IKTargetMap;
    return [{
      id: record.id,
      basePoseId: basePose.id,
      name: record.name,
      nameEn: record.nameEn,
      category: basePose.category,
      ikTargets,
      semanticModifiers: record.semanticModifiers && typeof record.semanticModifiers === "object" ? { ...record.semanticModifiers } : {},
      mirrored: Boolean(record.mirrored),
      thumbnail: typeof record.thumbnail === "string" ? record.thumbnail : "",
      updatedAt: typeof record.updatedAt === "number" ? record.updatedAt : 1,
    }];
  }).slice(0, 48);
}

function capturePoseThumbnail(source: HTMLCanvasElement | undefined): string {
  if (!source || !source.width || !source.height) return "";
  const output = document.createElement("canvas");
  output.width = 256;
  output.height = 200;
  const context = output.getContext("2d");
  if (!context) return "";
  context.fillStyle = "#e9ebef";
  context.fillRect(0, 0, output.width, output.height);
  const sourceRatio = source.width / source.height;
  const targetRatio = output.width / output.height;
  let sx = 0;
  let sy = 0;
  let sw = source.width;
  let sh = source.height;
  if (sourceRatio > targetRatio) {
    sw = source.height * targetRatio;
    sx = (source.width - sw) / 2;
  } else {
    sh = source.width / targetRatio;
    sy = (source.height - sh) / 2;
  }
  context.drawImage(source, sx, sy, sw, sh, 0, 0, output.width, output.height);
  return output.toDataURL("image/jpeg", 0.82);
}

type ModelEditState = Pick<EditorState, "pose" | "mirrored" | "position" | "rotation" | "scale" | "visible" | "ikTargets" | "semanticModifiers">;
type ModelListItem = { id: string; name: string };

function getModelEditState(state: EditorState): ModelEditState {
  return {
    pose: state.pose,
    mirrored: state.mirrored,
    position: [...state.position],
    rotation: [...state.rotation],
    scale: state.scale,
    visible: state.visible,
    semanticModifiers: { ...state.semanticModifiers },
    ikTargets: Object.fromEntries(
      Object.entries(state.ikTargets).map(([key, value]) => [key, value ? [...value] : value]),
    ) as IKTargetMap,
  };
}

function cloneModelEditState(state: ModelEditState): ModelEditState {
  return getModelEditState({ ...initialState, ...state });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function Home() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const poseGridRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const groundGridRef = useRef<THREE.Group | null>(null);
  const controlPointRefs = useRef<Partial<Record<IKControlId, HTMLButtonElement>>>({});
  const modelRootRef = useRef<THREE.Group | null>(null);
  const templateModelRef = useRef<THREE.Object3D | null>(null);
  const modelRootsRef = useRef<Record<string, THREE.Group>>({});
  const modelMeshesRef = useRef<Record<string, THREE.Mesh[]>>({});
  const modelRigsRef = useRef<Record<string, RigBinding | null>>({});
  const modelStatesRef = useRef<Record<string, ModelEditState>>({});
  const modelCounterRef = useRef(2);
  const selectedModelIdRef = useRef("model-1");
  const deformableMeshesRef = useRef<THREE.Mesh[]>([]);
  const frameRef = useRef<number | null>(null);
  const historyRef = useRef<EditorState[]>([]);
  const futureRef = useRef<EditorState[]>([]);
  const editorLatestRef = useRef<EditorState>(cloneState(initialState));
  const continuousEditRef = useRef<EditorState | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const randomCursorRef = useRef(73);
  const poseThumbnailsRef = useRef<Record<number, string>>({});
  const languageRef = useRef<Language>("en");

  const [language, setLanguage] = useState<Language>("en");
  const [editor, setEditor] = useState<EditorState>(cloneState(initialState));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoom] = useState(76);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<PoseCategoryTab>("all");
  const [direction, setDirection] = useState<PoseDirection | "any">("any");
  const [intensity, setIntensity] = useState<PoseIntensity | "any">("any");
  const [hand, setHand] = useState<PoseHand | "any">("any");
  const [body, setBody] = useState<PoseBody | "any">("any");
  const [style, setStyle] = useState<PoseStyle | "any">("any");
  const [quickView, setQuickView] = useState<QuickView>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [savedPoses, setSavedPoses] = useState<SavedPoseRecord[]>([]);
  const [selectedPoseId, setSelectedPoseId] = useState(defaultPose.id);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"library" | "inspector" | null>(null);
  const [toast, setToast] = useState("");
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [exporting, setExporting] = useState(false);
  const [modelList, setModelList] = useState<ModelListItem[]>([{ id: "model-1", name: "机器人 01" }]);
  const [selectedModelId, setSelectedModelId] = useState("model-1");
  const [toolMode, setToolMode] = useState<ToolMode>("translate");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("model");
  const [activeIKControl, setActiveIKControl] = useState<IKControlId | null>(null);
  const [promptToPoseOpen, setPromptToPoseOpen] = useState(false);
  const [poseText, setPoseText] = useState<string>(promptToPoseExamplesEn[0]);
  const [promptToPoseResult, setPromptToPoseResult] = useState<PromptToPoseResult | null>(null);
  const [sourcePosePrompt, setSourcePosePrompt] = useState("");
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptPlatform, setPromptPlatform] = useState<PromptPlatform>("midjourney");
  const [poseThumbnails, setPoseThumbnails] = useState<Record<number, string>>({});
  const [modelInfo, setModelInfo] = useState({ loaded: false, hasSkeleton: false, label: "正在加载 GLB…" });

  const isZh = language === "zh";
  const text = (english: string, chinese: string) => isZh ? chinese : english;
  const poseDisplayName = (pose: PoseItem) => isZh ? pose.name : pose.nameEn;
  const categoryDisplayName = (value: PoseCategory) => isZh ? getPoseCategoryLabel(value) : getPoseCategoryLabelEn(value);
  const tabDisplayName = (value: PoseCategoryTab) => isZh ? getPoseTabLabel(value) : compactPoseTabLabelsEn[value];
  const quickViewDisplayName = (value: Exclude<QuickView, null>) => value === "featured" ? text("Featured", "常用") : text("Recent", "最近");
  const modelDisplayName = (model?: ModelListItem) => {
    const sequence = model?.name.match(/\d+/)?.[0] ?? "01";
    return text(`Character ${sequence}`, `角色 ${sequence}`);
  };
  const modelStatusLabel = modelInfo.loaded
    ? modelInfo.hasSkeleton
      ? text("Quaternius Humanoid · 65 bones · 19 mapped", "Quaternius Humanoid · 65 骨骼 · 19 核心映射")
      : text("Pose Preview · Prototype mapping", "姿态预览 · 原型映射")
    : modelInfo.label.includes("失败")
      ? text("GLB failed to load", "GLB 加载失败")
      : text("Loading GLB…", "正在加载 GLB…");
  const poseMeta = (pose: PoseItem) => {
    if (isZh) return [getPoseCategoryLabel(pose.category), ...pose.tags].slice(0, 3).join(" · ");
    const detail = pose.hand.find((value) => value !== "natural");
    const bodyDetail = pose.body.find((value) => value !== "upright");
    const styleDetail = pose.style.find((value) => value !== "natural" && value !== "daily") ?? pose.style[0];
    return [...new Set([
      poseCategoryLabelsEn[pose.category],
      detail ? handLabelsEn[detail] : bodyDetail ? bodyLabelsEn[bodyDetail] : poseIntensityLabelsEn[pose.intensity],
      styleDetail ? styleLabelsEn[styleDetail] : poseDirectionLabelsEn[pose.direction],
    ])].join(" · ");
  };
  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setPoseText((current) => {
      const chineseIndex = promptToPoseExamples.indexOf(current as (typeof promptToPoseExamples)[number]);
      const englishIndex = promptToPoseExamplesEn.indexOf(current as (typeof promptToPoseExamplesEn)[number]);
      if (nextLanguage === "en" && chineseIndex >= 0) return promptToPoseExamplesEn[chineseIndex];
      if (nextLanguage === "zh" && englishIndex >= 0) return promptToPoseExamples[englishIndex];
      return current;
    });
    setPromptToPoseResult(null);
  };

  const savedPoseItems = useMemo(() => savedPoses.flatMap((saved) => {
    const basePose = poseItems.find((pose) => pose.id === saved.basePoseId);
    if (!basePose) return [];
    return [{
      ...basePose,
      id: saved.id,
      name: saved.name,
      nameEn: saved.nameEn,
      tags: ["已保存修改", ...basePose.tags],
      aliases: ["saved", "custom", "已保存", "自定义", ...basePose.aliases],
      featured: false,
      thumbnail: saved.thumbnail || basePose.thumbnail,
    } satisfies PoseItem];
  }), [savedPoses]);
  const savedPoseById = useMemo(() => new Map(savedPoses.map((saved) => [saved.id, saved])), [savedPoses]);
  const allPoseItems = useMemo(() => [...savedPoseItems, ...poseItems], [savedPoseItems]);
  const selectedPose = useMemo(() => allPoseItems.find((pose) => pose.id === selectedPoseId) ?? defaultPose, [allPoseItems, selectedPoseId]);
  const selectedSavedPose = savedPoseById.get(selectedPoseId);
  const hasJointEdits = Object.keys(editor.ikTargets).length > 0;
  const hasUnsavedJointEdits = selectedSavedPose
    ? JSON.stringify({ ikTargets: editor.ikTargets, semanticModifiers: editor.semanticModifiers, mirrored: editor.mirrored }) !== JSON.stringify({ ikTargets: selectedSavedPose.ikTargets, semanticModifiers: selectedSavedPose.semanticModifiers, mirrored: selectedSavedPose.mirrored })
    : hasJointEdits;

  const filteredPoses = useMemo(() => {
    const keyword = debouncedQuery.trim().toLowerCase();
    let candidates = category === "saved" ? savedPoseItems : poseItems;
    if (quickView === "featured") candidates = candidates.filter((pose) => pose.featured);
    if (quickView === "recent") {
      candidates = recentIds.map((id) => allPoseItems.find((pose) => pose.id === id)).filter((pose): pose is PoseItem => Boolean(pose));
    }
    if (category === "favorites") candidates = allPoseItems.filter((pose) => favoriteIds.includes(pose.id));
    return candidates.filter((pose) => {
      const searchable = [pose.name, pose.nameEn, ...pose.aliases, ...pose.tags, pose.category, getPoseCategoryLabel(pose.category)].filter(Boolean).join(" ").toLowerCase();
      return (category === "all" || category === "favorites" || category === "saved" || pose.category === category)
        && (direction === "any" || pose.direction === direction)
        && (intensity === "any" || pose.intensity === intensity)
        && (hand === "any" || pose.hand.includes(hand))
        && (body === "any" || pose.body.includes(body))
        && (style === "any" || pose.style.includes(style))
        && (!keyword || searchable.includes(keyword));
    });
  }, [allPoseItems, body, category, debouncedQuery, direction, favoriteIds, hand, intensity, quickView, recentIds, savedPoseItems, style]);

  useEffect(() => {
    document.documentElement.lang = isZh ? "zh-CN" : "en";
  }, [isZh]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const generatedPrompt = useMemo(() => {
    const cameraLabel = editor.cameraPreset === "custom" ? "自定义镜头" : cameraPresets[editor.cameraPreset].label;
    const lightingLabel = editor.lightingPreset === "custom" ? "自定义灯光" : lightingPresets[editor.lightingPreset].label;
    const directionLabel = directionOptions.find(([, value]) => value === selectedPose.direction)?.[0] ?? "正面";
    const intensityLabel = intensityOptions.find(([, value]) => value === selectedPose.intensity)?.[0] ?? "静态";
    const platformSuffix: Record<PromptPlatform, { cn: string; en: string }> = {
      midjourney: { cn: `Midjourney，画幅 ${editor.ratio}`, en: `Midjourney, --ar ${editor.ratio.replace(":", ":")}` },
      flux: { cn: "Flux，高细节真实摄影", en: "Flux, highly detailed realistic photography" },
      "gpt-image": { cn: "GPT Image，准确人体结构与自然手部", en: "GPT Image, accurate anatomy and natural hands" },
      seedance: { cn: "Seedance，电影级动作镜头，运动连贯", en: "Seedance, cinematic action shot, coherent motion" },
      jimeng: { cn: "即梦，写实人物摄影，动作自然", en: "Jimeng, realistic character photography, natural movement" },
    };
    const tagsCn = selectedPose.tags.slice(0, 3).join("、");
    const tagsEn = [selectedPose.nameEn, selectedPose.category, ...selectedPose.style.slice(0, 2)].filter(Boolean).join(", ");
    const sourceContext = sourcePosePrompt ? `创作描述：${sourcePosePrompt}。` : "";
    const gridModeCn: Record<PerspectiveGridMode, string> = { off: "自然透视", ground: "真实地面透视", "one-point": "一点透视", "two-point": "两点透视", "three-point": "三点透视" };
    const gridModeEn: Record<PerspectiveGridMode, string> = { off: "natural perspective", ground: "ground-plane perspective", "one-point": "one-point perspective", "two-point": "two-point perspective", "three-point": "three-point perspective" };
    return {
      chinese: `${sourceContext}${selectedPose.name}人体姿态，${directionLabel}，${intensityLabel}，${tagsCn}，${cameraLabel}，${shotLabels[editor.shotSize]}景别，${editor.focalLength}mm 镜头，${gridModeCn[editor.perspectiveGrid.mode]}，${lightingLabel}，真实人体比例，骨骼与手脚自然，无穿模，8K 摄影质量，${platformSuffix[promptPlatform].cn}`,
      english: `${selectedPose.nameEn || selectedPose.name}, ${tagsEn}, ${directionLabelsEn[selectedPose.direction]} view, ${intensityLabelsEn[selectedPose.intensity]} movement, ${cameraPresetLabelsEn[editor.cameraPreset]}, ${shotLabelsEn[editor.shotSize]} shot, ${editor.focalLength}mm lens, ${gridModeEn[editor.perspectiveGrid.mode]}, ${lightingPresetLabelsEn[editor.lightingPreset]}, realistic human proportions, natural anatomy and hands, no body intersection, 8k photography, ${platformSuffix[promptPlatform].en}`,
    };
  }, [editor.cameraPreset, editor.focalLength, editor.lightingPreset, editor.perspectiveGrid.mode, editor.ratio, editor.shotSize, promptPlatform, selectedPose, sourcePosePrompt]);
  const hasActiveFilters = category !== "all" || direction !== "any" || intensity !== "any" || hand !== "any" || body !== "any" || style !== "any" || query.length > 0 || quickView !== null;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    poseThumbnailsRef.current = poseThumbnails;
  }, [poseThumbnails]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      poseThumbnailsRef.current = {};
      setPoseThumbnails({});
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const grid = poseGridRef.current;
    const template = templateModelRef.current;
    if (!grid || !template || !modelInfo.loaded) return;

    let frame = 0;
    const pending = new Set<number>();
    const observer = new IntersectionObserver((entries) => {
      const indices = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => Number((entry.target as HTMLElement).dataset.poseIndex))
        .filter((index) => Number.isInteger(index) && !poseThumbnailsRef.current[index]);
      if (!indices.length) return;
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => observer.unobserve(entry.target));
      indices.forEach((index) => pending.add(index));
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const generated = generatePoseThumbnails(template, [...pending]);
        pending.clear();
        poseThumbnailsRef.current = { ...poseThumbnailsRef.current, ...generated };
        setPoseThumbnails(poseThumbnailsRef.current);
      });
    }, { root: grid, rootMargin: "360px 0px", threshold: 0.01 });

    grid.querySelectorAll<HTMLElement>(".pose-card[data-pose-index]").forEach((card) => {
      const index = Number(card.dataset.poseIndex);
      if (!poseThumbnailsRef.current[index]) observer.observe(card);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [filteredPoses, modelInfo.loaded]);

  useEffect(() => {
    try {
      const favorites = JSON.parse(window.localStorage.getItem("poseboard.favoriteIds") ?? "[]");
      const recent = JSON.parse(window.localStorage.getItem("poseboard.recentIds") ?? "[]");
      const storedSavedPoses = readSavedPoseRecords(JSON.parse(window.localStorage.getItem("poseboard.savedPoses.v1") ?? "[]"));
      const savedProject = JSON.parse(window.localStorage.getItem("poseboard.project.v2") ?? "null") as { editor?: Partial<EditorState>; selectedPoseId?: string } | null;
      const lastSelected = window.localStorage.getItem("poseboard.lastSelectedId");
      if (Array.isArray(favorites)) setFavoriteIds(favorites.filter((id): id is string => typeof id === "string"));
      if (Array.isArray(recent)) setRecentIds(recent.filter((id): id is string => typeof id === "string").slice(0, 20));
      setSavedPoses(storedSavedPoses);
      const requestedPoseId = savedProject?.selectedPoseId ?? lastSelected;
      const restoredSavedPose = storedSavedPoses.find((pose) => pose.id === requestedPoseId);
      const restoredPose = poseItems.find((pose) => pose.id === (restoredSavedPose?.basePoseId ?? requestedPoseId) && pose.status === "ready");
      if (savedProject?.editor) {
        setEditor((current) => cloneState({
          ...current,
          ...savedProject.editor,
          perspectiveGrid: normalizePerspectiveGrid(savedProject.editor?.perspectiveGrid),
          ikTargets: savedProject.editor?.ikTargets ?? {},
          semanticModifiers: savedProject.editor?.semanticModifiers ?? {},
          pose: restoredPose?.enginePoseIndex ?? savedProject.editor?.pose ?? current.pose,
        }));
      } else if (restoredSavedPose && restoredPose) {
        setEditor((current) => cloneState({
          ...current,
          pose: restoredPose.enginePoseIndex,
          mirrored: restoredSavedPose.mirrored,
          ikTargets: restoredSavedPose.ikTargets,
          semanticModifiers: restoredSavedPose.semanticModifiers,
        }));
      }
      if (restoredSavedPose && restoredPose) {
        setSelectedPoseId(restoredSavedPose.id);
      } else if (restoredPose) {
        setSelectedPoseId(restoredPose.id);
        if (!savedProject?.editor) setEditor((current) => ({ ...current, pose: restoredPose.enginePoseIndex }));
      }
    } finally {
      setPersistenceReady(true);
    }
  }, []);

  useEffect(() => {
    if (!persistenceReady) return;
    window.localStorage.setItem("poseboard.favoriteIds", JSON.stringify(favoriteIds));
    window.localStorage.setItem("poseboard.recentIds", JSON.stringify(recentIds.slice(0, 20)));
    window.localStorage.setItem("poseboard.savedPoses.v1", JSON.stringify(savedPoses));
    window.localStorage.setItem("poseboard.lastSelectedId", selectedPoseId);
  }, [favoriteIds, persistenceReady, recentIds, savedPoses, selectedPoseId]);

  useEffect(() => {
    if (!persistenceReady) return;
    window.localStorage.setItem("poseboard.project.v2", JSON.stringify({ version: "3.1", selectedPoseId, editor }));
  }, [editor, persistenceReady, selectedPoseId]);

  useEffect(() => {
    editorLatestRef.current = editor;
  }, [editor]);

  useEffect(() => {
    selectedModelIdRef.current = selectedModelId;
  }, [selectedModelId]);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
  }, []);

  const flash = (message: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2200);
  };

  const markSaving = () => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    setSaveState("saving");
    saveTimerRef.current = window.setTimeout(() => setSaveState("saved"), 420);
  };

  const syncHistoryAvailability = () => {
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  };

  const commit = (updater: (current: EditorState) => EditorState) => {
    setEditor((current) => {
      const next = updater(cloneState(current));
      if (JSON.stringify(next) === JSON.stringify(current)) return current;
      historyRef.current.push(cloneState(current));
      if (historyRef.current.length > 60) historyRef.current.shift();
      futureRef.current = [];
      syncHistoryAvailability();
      editorLatestRef.current = next;
      markSaving();
      return next;
    });
  };

  const beginContinuousEdit = () => {
    if (!continuousEditRef.current) continuousEditRef.current = cloneState(editorLatestRef.current);
  };

  const updateContinuousEdit = (updater: (current: EditorState) => EditorState) => {
    setEditor((current) => {
      const next = updater(cloneState(current));
      editorLatestRef.current = next;
      return next;
    });
    markSaving();
  };

  const endContinuousEdit = () => {
    const before = continuousEditRef.current;
    if (!before) return;
    continuousEditRef.current = null;
    if (JSON.stringify(before) === JSON.stringify(editorLatestRef.current)) return;
    historyRef.current.push(before);
    if (historyRef.current.length > 60) historyRef.current.shift();
    futureRef.current = [];
    syncHistoryAvailability();
  };

  const undo = () => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    setEditor((current) => {
      futureRef.current.push(cloneState(current));
      return cloneState(previous);
    });
    syncHistoryAvailability();
    markSaving();
    flash(text("Undo complete", "已撤销上一步"));
  };

  const redo = () => {
    const next = futureRef.current.pop();
    if (!next) return;
    setEditor((current) => {
      historyRef.current.push(cloneState(current));
      return cloneState(next);
    });
    syncHistoryAvailability();
    markSaving();
    flash(text("Redo complete", "已重做"));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobilePanel(null);
        setPromptToPoseOpen(false);
        setPromptOpen(false);
        return;
      }
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  const selectPose = (pose: PoseItem) => {
    if (pose.status === "incompatible") {
      flash(text("This pose is not compatible with the current model", "当前模型不兼容此 Pose"));
      return;
    }
    if (pose.status === "missing") {
      flash(text("Pose asset is missing. Please try again later", "Pose 资源缺失，请稍后重试"));
      return;
    }
    const savedPose = savedPoseById.get(pose.id);
    const basePose = savedPose ? poseItems.find((item) => item.id === savedPose.basePoseId) ?? defaultPose : pose;
    commit((current) => ({
      ...current,
      pose: basePose.enginePoseIndex,
      mirrored: savedPose?.mirrored ?? false,
      ikTargets: savedPose ? cloneIKTargets(savedPose.ikTargets) : {},
      semanticModifiers: savedPose ? { ...savedPose.semanticModifiers } : {},
    }));
    setSelectedPoseId(pose.id);
    setSourcePosePrompt("");
    setRecentIds((ids) => [pose.id, ...ids.filter((id) => id !== pose.id)].slice(0, 20));
    setMobilePanel(null);
    flash(savedPose
      ? text(`Loaded saved pose “${pose.nameEn}”`, `已载入保存动作「${pose.name}」`)
      : text(`Applied “${pose.nameEn}”`, `已应用「${pose.name}」`));
  };

  const saveModifiedPose = () => {
    if (!hasUnsavedJointEdits || !modelInfo.loaded) return;
    const existing = savedPoseById.get(selectedPoseId);
    const basePose = poseItems.find((pose) => pose.id === (existing?.basePoseId ?? selectedPose.id)) ?? defaultPose;
    const nextSequence = savedPoses.filter((pose) => pose.basePoseId === basePose.id).length + 1;
    const id = existing?.id ?? `saved-${basePose.id}-${nextSequence}`;
    const record: SavedPoseRecord = {
      id,
      basePoseId: basePose.id,
      name: existing?.name ?? `${basePose.name} · 自定义 ${nextSequence}`,
      nameEn: existing?.nameEn ?? `${basePose.nameEn} · Custom ${nextSequence}`,
      category: basePose.category,
      ikTargets: cloneIKTargets(editorLatestRef.current.ikTargets),
      semanticModifiers: { ...editorLatestRef.current.semanticModifiers },
      mirrored: editorLatestRef.current.mirrored,
      thumbnail: capturePoseThumbnail(rendererRef.current?.domElement) || existing?.thumbnail || "",
      updatedAt: (existing?.updatedAt ?? 0) + 1,
    };
    setSavedPoses((poses) => existing ? poses.map((pose) => pose.id === existing.id ? record : pose) : [record, ...poses]);
    setSelectedPoseId(id);
    setRecentIds((ids) => [id, ...ids.filter((item) => item !== id)].slice(0, 20));
    setQuickView(null);
    setCategory("saved");
    flash(existing
      ? text(`Updated “${record.nameEn}” in Saved`, `已更新「${record.name}」`)
      : text(`Saved “${record.nameEn}” to this browser`, `已将「${record.name}」保存到本机缓存`));
  };

  const deleteSavedPose = (savedPose: SavedPoseRecord) => {
    const basePose = poseItems.find((pose) => pose.id === savedPose.basePoseId) ?? defaultPose;
    setSavedPoses((poses) => poses.filter((pose) => pose.id !== savedPose.id));
    setFavoriteIds((ids) => ids.filter((id) => id !== savedPose.id));
    setRecentIds((ids) => ids.filter((id) => id !== savedPose.id));
    if (selectedPoseId === savedPose.id) {
      commit((current) => ({
        ...current,
        pose: basePose.enginePoseIndex,
        mirrored: false,
        ikTargets: {},
        semanticModifiers: {},
      }));
      setSelectedPoseId(basePose.id);
      setSourcePosePrompt("");
    }
    flash(text(`Deleted “${savedPose.nameEn}” from Saved`, `已删除保存动作「${savedPose.name}」`));
  };

  const clearPoseFilters = () => {
    setQuery("");
    setQuickView(null);
    setCategory("all");
    setDirection("any");
    setIntensity("any");
    setHand("any");
    setBody("any");
    setStyle("any");
  };

  const toggleFavorite = (pose: PoseItem) => {
    setFavoriteIds((ids) => ids.includes(pose.id) ? ids.filter((id) => id !== pose.id) : [...ids, pose.id]);
    flash(favoriteIds.includes(pose.id)
      ? text(`Removed “${pose.nameEn}” from favorites`, `已取消收藏「${pose.name}」`)
      : text(`Saved “${pose.nameEn}” to favorites`, `已收藏「${pose.name}」`));
  };

  const selectAdjacentPose = (offset: number) => {
    if (!filteredPoses.length) return;
    const currentIndex = filteredPoses.findIndex((pose) => pose.id === selectedPose.id);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + offset + filteredPoses.length) % filteredPoses.length;
    selectPose(filteredPoses[nextIndex]);
  };

  const selectRandomPose = () => {
    const available = filteredPoses.filter((pose) => pose.status === "ready");
    if (!available.length) return;
    randomCursorRef.current = (randomCursorRef.current * 1664525 + 1013904223) >>> 0;
    selectPose(available[randomCursorRef.current % available.length]);
  };

  const showSimilarPoses = () => {
    setQuickView(null);
    setCategory(selectedPose.category);
    setQuery(isZh ? selectedPose.tags[0] ?? "" : "");
    setDirection("any");
    setIntensity("any");
    setHand("any");
    setBody("any");
    setStyle("any");
  };

  const activateTool = (mode: ToolMode) => {
    setToolMode(mode);
    setInspectorTab("model");
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  const beginIKDrag = (control: IKControlId, event: React.PointerEvent<HTMLButtonElement>) => {
    const rig = modelRigsRef.current[selectedModelId];
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!rig || !camera || !renderer) return;
    const startLocal = getIKControlPosition(rig, control, editorLatestRef.current.ikTargets);
    if (!startLocal) return;
    event.preventDefault();
    event.stopPropagation();
    setActiveIKControl(control);
    beginContinuousEdit();
    if (controlsRef.current) controlsRef.current.enabled = false;

    const startWorld = rig.root.localToWorld(startLocal.clone());
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), startWorld);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const worldTarget = new THREE.Vector3();

    const move = (pointerEvent: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((pointerEvent.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
        -((pointerEvent.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      if (!raycaster.ray.intersectPlane(plane, worldTarget)) return;
      const local = rig.root.worldToLocal(worldTarget.clone());
      const target: [number, number, number] = [local.x, local.y, local.z];
      updateContinuousEdit((current) => ({
        ...current,
        ikTargets: { ...current.ikTargets, [control]: target },
      }));
    };

    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (controlsRef.current) controlsRef.current.enabled = true;
      setActiveIKControl(null);
      endContinuousEdit();
      const definition = ikControlDefinitions.find(({ id }) => id === control);
      flash(text(`${definition?.labelEn ?? "Joint"} updated`, `${definition?.label ?? "关节"}已更新`));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  const resetIKEdits = () => {
    commit((current) => ({ ...current, ikTargets: {} }));
    setActiveIKControl(null);
    flash(text("Preset skeleton pose restored", "已恢复预设骨骼姿态"));
  };

  const applyCameraPreset = (presetId: Exclude<CameraPresetId, "custom">) => {
    const preset = cameraPresets[presetId];
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      camera.position.set(...preset.position);
      controls.target.set(...preset.target);
      controls.update();
      controls.saveState();
    }
    commit((current) => {
      const mode = current.perspectiveGrid.mode;
      const linked = current.perspectiveGrid.coordinateMode === "camera-linked" && camera && controls && mode !== "off" && mode !== "ground"
        ? cameraLinkedPerspective(camera, controls.target, mode)
        : null;
      return {
        ...current,
        cameraPreset: presetId,
        focalLength: preset.focalLength,
        cameraHeight: preset.target[1],
        shotSize: preset.shotSize,
        perspectiveGrid: linked ? { ...current.perspectiveGrid, ...linked, vanishingPoints: linked.vanishingPoints.map((point) => ({ ...point })) } : current.perspectiveGrid,
      };
    });
    flash(text(`${preset.labelEn} camera applied`, `已应用${preset.label}镜头`));
  };

  const updateCameraComposition = (patch: Partial<Pick<EditorState, "focalLength" | "cameraHeight" | "shotSize">>, continuous = false) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const nextHeight = patch.cameraHeight ?? editorLatestRef.current.cameraHeight;
    const nextShot = patch.shotSize ?? editorLatestRef.current.shotSize;
    if (camera && controls) {
      const target = controls.target.clone();
      const direction = camera.position.clone().sub(target).normalize();
      target.y = nextHeight;
      controls.target.copy(target);
      camera.position.copy(target.clone().addScaledVector(direction, shotDistance[nextShot]));
      if (patch.focalLength) camera.setFocalLength(patch.focalLength);
      camera.updateProjectionMatrix();
      controls.update();
    }
    const updater = (current: EditorState) => {
      const mode = current.perspectiveGrid.mode;
      const linked = current.perspectiveGrid.coordinateMode === "camera-linked" && camera && controls && mode !== "off" && mode !== "ground"
        ? cameraLinkedPerspective(camera, controls.target, mode)
        : null;
      return {
        ...current,
        ...patch,
        cameraPreset: "custom" as const,
        perspectiveGrid: linked ? { ...current.perspectiveGrid, ...linked, vanishingPoints: linked.vanishingPoints.map((point) => ({ ...point })) } : current.perspectiveGrid,
      };
    };
    if (continuous) updateContinuousEdit(updater);
    else commit(updater);
  };

  const applyLightingPreset = (presetId: Exclude<LightingPresetId, "custom">) => {
    const preset = lightingPresets[presetId];
    const toHex = (value: number) => `#${value.toString(16).padStart(6, "0")}`;
    commit((current) => ({
      ...current,
      lightingPreset: presetId,
      keyLight: preset.key,
      fillLight: preset.fill,
      rimLight: preset.rim,
      exposure: preset.exposure,
      keyColor: toHex(preset.keyColor),
      fillColor: toHex(preset.fillColor),
      rimColor: toHex(preset.rimColor),
      background: preset.background,
    }));
    flash(text(`${preset.labelEn} lighting applied`, `已应用${preset.label}`));
  };

  const analyzePoseText = () => {
    const input = poseText.trim();
    if (!input) {
      flash(text("Describe the character pose first", "请先输入人物动作描述"));
      return;
    }
    const result = analyzePromptToPose(input);
    setPromptToPoseResult(result);
    flash(text(`Matched “${result.pose.nameEn}”`, `已匹配「${result.pose.name}」`));
  };

  const applyPromptToPose = () => {
    const result = promptToPoseResult;
    if (!result) {
      analyzePoseText();
      return;
    }
    const cameraPreset = cameraPresets[result.cameraPreset];
    const lightingPreset = lightingPresets[result.lightingPreset];
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      camera.position.set(...cameraPreset.position);
      controls.target.set(...cameraPreset.target);
      controls.update();
      controls.saveState();
    }
    const normalizedPrompt = result.input.toLowerCase();
    const suggestedGridMode: PerspectiveGridMode | null = /英雄|仰拍|低机位|高楼|hero|low angle|skyscraper/.test(normalizedPrompt)
      ? "three-point"
      : /街角|转角|建筑|商品空间|street corner|building corner|two.point/.test(normalizedPrompt)
        ? "two-point"
        : /走廊|道路中央|正面室内|corridor|hallway|road center|one.point/.test(normalizedPrompt)
          ? "one-point"
          : null;
    const toHex = (value: number) => `#${value.toString(16).padStart(6, "0")}`;
    commit((current) => ({
      ...current,
      pose: result.pose.enginePoseIndex,
      mirrored: false,
      ikTargets: {},
      semanticModifiers: { ...result.modifiers },
      cameraPreset: result.cameraPreset,
      focalLength: cameraPreset.focalLength,
      cameraHeight: cameraPreset.target[1],
      shotSize: cameraPreset.shotSize,
      lightingPreset: result.lightingPreset,
      keyLight: lightingPreset.key,
      fillLight: lightingPreset.fill,
      rimLight: lightingPreset.rim,
      exposure: lightingPreset.exposure,
      keyColor: toHex(lightingPreset.keyColor),
      fillColor: toHex(lightingPreset.fillColor),
      rimColor: toHex(lightingPreset.rimColor),
      background: lightingPreset.background,
      perspectiveGrid: suggestedGridMode ? perspectiveDefaultsForMode(suggestedGridMode, current.perspectiveGrid) : current.perspectiveGrid,
    }));
    setSelectedPoseId(result.pose.id);
    setSourcePosePrompt(result.input);
    setRecentIds((ids) => [result.pose.id, ...ids.filter((id) => id !== result.pose.id)].slice(0, 20));
    clearPoseFilters();
    setCategory(result.category);
    setToolMode("pose");
    setInspectorTab("model");
    setMobilePanel(null);
    setPromptToPoseOpen(false);
    flash(text(`Text pose applied: ${result.pose.nameEn}`, `文字姿态已应用：${result.pose.name}`));
  };

  const updateLightingValue = (key: "keyLight" | "fillLight" | "rimLight" | "exposure", value: number) => {
    updateContinuousEdit((current) => ({ ...current, [key]: value, lightingPreset: "custom" }));
  };

  const copyPrompt = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      flash(text("Prompt copied", "Prompt 已复制"));
    } catch {
      flash(text("Copy failed. Select the text manually", "复制失败，请手动选择文本"));
    }
  };

  const downloadTextFile = (filename: string, content: string, type = "text/plain") => {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportProjectJson = () => {
    const project = {
      version: "3.1",
      pose: { id: selectedPose.id, name: selectedPose.name, mirrored: editor.mirrored, ikTargets: editor.ikTargets, semanticModifiers: editor.semanticModifiers },
      promptToPose: sourcePosePrompt && promptToPoseResult ? { input: sourcePosePrompt, ...promptToPoseJson(promptToPoseResult) } : null,
      camera: {
        preset: editor.cameraPreset,
        focalLength: editor.focalLength,
        height: editor.cameraHeight,
        shotSize: editor.shotSize,
        ratio: editor.ratio,
      },
      lighting: {
        preset: editor.lightingPreset,
        key: editor.keyLight,
        fill: editor.fillLight,
        rim: editor.rimLight,
        exposure: editor.exposure,
      },
      perspectiveGrid: clonePerspectiveGrid(editor.perspectiveGrid),
      prompt: { platform: promptPlatform, ...generatedPrompt },
    };
    downloadTextFile(`poseboard-${selectedPose.id}.json`, JSON.stringify(project, null, 2), "application/json");
    flash(text("Project JSON exported", "项目 JSON 已导出"));
  };

  const updateVector = (kind: "position" | "rotation", axis: number, value: number) => {
    commit((current) => {
      const vector = [...current[kind]] as [number, number, number];
      vector[axis] = value;
      return { ...current, [kind]: vector };
    });
  };

  const setLandscapeRatio = (base: "16:9" | "3:2" | "4:3" | "1:1") => {
    commit((current) => ({ ...current, ratio: base }));
    flash(text(`Canvas ratio changed to ${base}`, `画幅已切换为 ${base}`));
  };

  const toggleOrientation = () => {
    commit((current) => {
      const ratio: Ratio = current.ratio === "16:9" ? "9:16" : current.ratio === "9:16" ? "16:9" : current.ratio === "3:2" ? "2:3" : current.ratio === "2:3" ? "3:2" : current.ratio === "4:3" ? "3:4" : current.ratio === "3:4" ? "4:3" : "1:1";
      return { ...current, ratio };
    });
    flash(text("Canvas orientation switched", "画幅方向已切换"));
  };

  const setPerspectiveMode = (mode: PerspectiveGridMode) => {
    commit((current) => ({
      ...current,
      perspectiveGrid: perspectiveDefaultsForMode(mode, current.perspectiveGrid),
    }));
    setInspectorTab("scene");
    flash(mode === "off"
      ? text("Perspective grid hidden", "透视网格已关闭")
      : text(`${mode.replace("-", " ")} perspective enabled`, `已启用${mode === "ground" ? "地面网格" : mode === "one-point" ? "一点透视" : mode === "two-point" ? "两点透视" : "三点透视"}`));
  };

  const togglePerspectiveGrid = () => {
    const nextMode: PerspectiveGridMode = editorLatestRef.current.perspectiveGrid.mode === "off" ? "ground" : "off";
    setPerspectiveMode(nextMode);
  };

  const resetPerspectiveGrid = () => {
    const mode = editorLatestRef.current.perspectiveGrid.mode;
    commit((current) => ({
      ...current,
      perspectiveGrid: perspectiveDefaultsForMode(mode, {
        ...clonePerspectiveGrid(initialPerspectiveGrid),
        includeInExport: current.perspectiveGrid.includeInExport,
      }),
    }));
    flash(text("Perspective grid reset", "透视网格已重置"));
  };

  const updatePerspectiveOrigin = (axis: number, value: number) => {
    commit((current) => {
      const origin = [...current.perspectiveGrid.origin] as [number, number, number];
      origin[axis] = value;
      return { ...current, perspectiveGrid: { ...current.perspectiveGrid, origin, snapToFeet: axis === 1 ? false : current.perspectiveGrid.snapToFeet } };
    });
  };

  const updatePerspectiveRotation = (axis: number, value: number) => {
    commit((current) => {
      const rotation = [...current.perspectiveGrid.rotation] as [number, number, number];
      rotation[axis] = value;
      return { ...current, perspectiveGrid: { ...current.perspectiveGrid, rotation } };
    });
  };

  const setPerspectiveCoordinateMode = (coordinateMode: "camera-linked" | "independent") => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    commit((current) => {
      const mode = current.perspectiveGrid.mode;
      const linked = coordinateMode === "camera-linked" && camera && controls && mode !== "off" && mode !== "ground"
        ? cameraLinkedPerspective(camera, controls.target, mode)
        : null;
      return {
        ...current,
        perspectiveGrid: {
          ...current.perspectiveGrid,
          coordinateMode,
          ...(linked ?? {}),
          vanishingPoints: linked ? linked.vanishingPoints.map((point) => ({ ...point })) : current.perspectiveGrid.vanishingPoints,
        },
      };
    });
  };

  const beginPerspectiveDrag = (handle: "horizon" | number, event: React.PointerEvent<HTMLButtonElement>) => {
    const currentGrid = editorLatestRef.current.perspectiveGrid;
    const overlay = event.currentTarget.closest<HTMLElement>(".perspective-grid-overlay");
    if (!overlay || currentGrid.lock) return;
    event.preventDefault();
    event.stopPropagation();
    beginContinuousEdit();
    if (controlsRef.current) controlsRef.current.enabled = false;

    const move = (pointerEvent: PointerEvent) => {
      const rect = overlay.getBoundingClientRect();
      const x = clamp((pointerEvent.clientX - rect.left) / Math.max(rect.width, 1), -0.75, 1.75);
      const y = clamp((pointerEvent.clientY - rect.top) / Math.max(rect.height, 1), 0.04, 0.96);
      updateContinuousEdit((current) => {
        const perspectiveGrid = clonePerspectiveGrid(current.perspectiveGrid);
        perspectiveGrid.coordinateMode = "independent";
        if (handle === "horizon") {
          perspectiveGrid.horizonY = y;
          perspectiveGrid.vanishingPoints.slice(0, perspectiveGrid.mode === "one-point" ? 1 : 2).forEach((point) => { point.y = y; });
        } else {
          const point = perspectiveGrid.vanishingPoints[handle];
          if (!point) return current;
          point.x = x;
          point.y = y;
          if (handle < 2) {
            perspectiveGrid.horizonY = y;
            perspectiveGrid.vanishingPoints.slice(0, perspectiveGrid.mode === "one-point" ? 1 : 2).forEach((item) => { item.y = y; });
          }
        }
        return { ...current, perspectiveGrid };
      });
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (controlsRef.current) controlsRef.current.enabled = true;
      endContinuousEdit();
      flash(text("Perspective guide updated", "透视辅助线已更新"));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  useEffect(() => {
    const handleGridShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.key.toLowerCase() !== "g") return;
      event.preventDefault();
      const currentMode = editorLatestRef.current.perspectiveGrid.mode;
      const nextMode: PerspectiveGridMode = currentMode === "off" ? "ground" : "off";
      setEditor((current) => ({ ...current, perspectiveGrid: perspectiveDefaultsForMode(nextMode, current.perspectiveGrid) }));
      setInspectorTab("scene");
      flash(nextMode === "off" ? text("Perspective grid hidden", "透视网格已关闭") : text("Ground grid enabled", "地面网格已开启"));
    };
    document.addEventListener("keydown", handleGridShortcut);
    return () => document.removeEventListener("keydown", handleGridShortcut);
  });

  const selectModel = (id: string) => {
    const nextState = modelStatesRef.current[id];
    const nextRoot = modelRootsRef.current[id];
    const nextMeshes = modelMeshesRef.current[id];
    if (!nextState || !nextRoot || !nextMeshes) return;

    setSelectedModelId(id);
    modelRootRef.current = nextRoot;
    deformableMeshesRef.current = nextMeshes;
    setEditor((current) => ({ ...current, ...cloneModelEditState(nextState) }));
  };

  const addModel = () => {
    const scene = sceneRef.current;
    const template = templateModelRef.current;
    if (!scene || !template || !modelInfo.loaded) return;
    if (modelList.length >= 8) {
      flash(text("You can add up to 8 characters", "当前画板最多添加 8 个模型"));
      return;
    }

    const sequence = modelCounterRef.current;
    const id = `model-${sequence}`;
    modelCounterRef.current += 1;
    const root = new THREE.Group();
    const clone = cloneSkeleton(template);
    const rig = createRigBinding(clone);
    const meshes: THREE.Mesh[] = [];
    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.geometry = child.geometry.clone();
      if (!rig) prepareRigidPoseGeometry(child.geometry);
      child.material = createMannequinMaterial();
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.poseboardModelId = id;
      meshes.push(child);
    });
    root.add(clone);
    scene.add(root);

    const slot = modelList.length;
    const column = Math.ceil(slot / 2);
    const side = slot % 2 === 1 ? 1 : -1;
    const state: ModelEditState = {
      pose: 0,
      mirrored: false,
      position: [side * column * 1.35, 0, 0],
      rotation: [0, side * -12, 0],
      scale: 92,
      visible: true,
      ikTargets: {},
      semanticModifiers: {},
    };

    modelRootsRef.current[id] = root;
    modelMeshesRef.current[id] = meshes;
    modelRigsRef.current[id] = rig;
    modelStatesRef.current[id] = cloneModelEditState(state);
    modelRootRef.current = root;
    deformableMeshesRef.current = meshes;
    setModelList((items) => [...items, { id, name: `机器人 ${String(sequence).padStart(2, "0")}` }]);
    setSelectedModelId(id);
    setEditor((current) => ({ ...current, ...cloneModelEditState(state) }));
    flash(text(`Character ${String(sequence).padStart(2, "0")} added`, `角色 ${String(sequence).padStart(2, "0")} 已添加`));
  };

  useEffect(() => {
    const host = viewportRef.current;
    if (!host) return;

    setModelInfo({ loaded: false, hasSkeleton: false, label: "正在加载 GLB…" });
    modelRootsRef.current = {};
    modelMeshesRef.current = {};
    modelRigsRef.current = {};

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initialState.background);
    scene.fog = new THREE.Fog(new THREE.Color(initialState.background), 10, 22);

    const camera = new THREE.PerspectiveCamera(initialState.fov, 16 / 9, 0.05, 100);
    camera.position.set(...presetCameraPosition);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.target.set(...presetCameraTarget);
    controls.minDistance = 3.2;
    controls.maxDistance = 13;
    controls.maxPolarAngle = Math.PI * 0.59;
    controls.update();
    controls.saveState();

    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setMode("translate");
    transformControls.setSpace("world");
    transformControls.setSize(0.82);
    transformControls.setColors(0xe84d61, 0x31b66b, 0x318df5, 0x725cf6);
    const transformHelper = transformControls.getHelper();
    scene.add(transformHelper);

    const handleTransformMouseDown = () => {
      historyRef.current.push(cloneState(editorLatestRef.current));
      if (historyRef.current.length > 60) historyRef.current.shift();
      futureRef.current = [];
      syncHistoryAvailability();
    };
    const handleTransformChange = () => {
      const selectedRoot = modelRootRef.current;
      if (!selectedRoot) return;
      setEditor((current) => ({
        ...current,
        position: [selectedRoot.position.x, selectedRoot.position.y, selectedRoot.position.z],
        rotation: [
          THREE.MathUtils.radToDeg(selectedRoot.rotation.x),
          THREE.MathUtils.radToDeg(selectedRoot.rotation.y),
          THREE.MathUtils.radToDeg(selectedRoot.rotation.z),
        ],
        scale: selectedRoot.scale.x * 100,
      }));
    };
    const handleTransformDragging = (event: { value: unknown }) => {
      controls.enabled = !event.value;
    };
    const handleTransformMouseUp = () => flash(transformControls.getMode() === "rotate"
      ? languageRef.current === "zh" ? "模型旋转已更新" : "Model rotation updated"
      : languageRef.current === "zh" ? "模型位置已更新" : "Model position updated");
    transformControls.addEventListener("mouseDown", handleTransformMouseDown);
    transformControls.addEventListener("objectChange", handleTransformChange);
    transformControls.addEventListener("dragging-changed", handleTransformDragging);
    transformControls.addEventListener("mouseUp", handleTransformMouseUp);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x6d7480, 1.35));
    const key = new THREE.DirectionalLight(0xffffff, 4.6);
    key.position.set(4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -2;
    key.shadow.bias = -0.00015;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xe8f1ff, 1.35);
    fill.position.set(-3, 3.5, 4.5);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xcbd5ff, 2.1);
    rim.position.set(-5, 4, -3);
    scene.add(rim);
    keyLightRef.current = key;
    fillLightRef.current = fill;
    rimLightRef.current = rim;

    const groundGrid = new THREE.Group();
    groundGrid.name = "poseboard-perspective-ground-grid";
    groundGrid.visible = false;
    scene.add(groundGrid);
    groundGridRef.current = groundGrid;

    const root = new THREE.Group();
    scene.add(root);

    const selectModelFromCanvas = (event: PointerEvent) => {
      if (event.button !== 0 || transformControls.dragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
        -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const selectableMeshes = Object.entries(modelMeshesRef.current).flatMap(([id, meshes]) => modelRootsRef.current[id]?.visible ? meshes : []);
      const hit = raycaster.intersectObjects(selectableMeshes, false)[0];
      const id = hit?.object.userData.poseboardModelId as string | undefined;
      if (id) selectModel(id);
    };
    renderer.domElement.addEventListener("pointerdown", selectModelFromCanvas);

    const syncLinkedGridToCamera = () => {
      const current = editorLatestRef.current;
      const mode = current.perspectiveGrid.mode;
      if (current.perspectiveGrid.coordinateMode !== "camera-linked" || mode === "off" || mode === "ground") return;
      const linked = cameraLinkedPerspective(camera, controls.target, mode);
      setEditor((value) => ({
        ...value,
        perspectiveGrid: { ...value.perspectiveGrid, ...linked, vanishingPoints: linked.vanishingPoints.map((point) => ({ ...point })) },
      }));
    };
    controls.addEventListener("end", syncLinkedGridToCamera);

    const loader = new GLTFLoader();
    loader.load(
      "/assets/humanoid/Superhero_Male_FullBody.gltf",
      (gltf) => {
        const model = gltf.scene;
        const originalMeshes: THREE.Mesh[] = [];
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry = child.geometry.clone();
            originalMeshes.push(child);
            child.userData.poseboardModelId = "model-1";
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = createMannequinMaterial();
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const fit = 3.45 / Math.max(size.y, 0.001);
        model.scale.setScalar(fit);
        model.position.set(-center.x * fit, -box.min.y * fit, -center.z * fit);
        root.add(model);

        // Bind after normalization so reset/grounding always returns to the
        // model's normalized internal placement, independently of editor transform.
        const rig = createRigBinding(model);
        const hasSkeleton = Boolean(rig);
        if (!rig) originalMeshes.forEach((mesh) => prepareRigidPoseGeometry(mesh.geometry));

        const template = cloneSkeleton(model);
        template.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.geometry = child.geometry.clone();
          if (child.material instanceof THREE.Material) child.material = child.material.clone();
        });
        templateModelRef.current = template;
        modelRootsRef.current["model-1"] = root;
        modelMeshesRef.current["model-1"] = originalMeshes;
        modelRigsRef.current["model-1"] = rig;
        modelStatesRef.current["model-1"] = getModelEditState(initialState);
        deformableMeshesRef.current = originalMeshes;
        transformControls.attach(root);
        setModelInfo({ loaded: true, hasSkeleton, label: hasSkeleton ? "Quaternius Humanoid · 65 骨骼 · 19 核心映射" : "Pose preview · Prototype mapping" });
      },
      undefined,
      () => setModelInfo({ loaded: false, hasSkeleton: false, label: "GLB 加载失败" }),
    );

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const tick = () => {
      controls.update();
      const rig = modelRigsRef.current[selectedModelIdRef.current];
      if (rig && cameraRef.current && rendererRef.current) {
        const rect = rendererRef.current.domElement.getBoundingClientRect();
        (Object.keys(ikControlBoneMap) as IKControlId[]).forEach((control) => {
          const element = controlPointRefs.current[control];
          if (!element) return;
          const point = getIKControlPosition(rig, control, editorLatestRef.current.ikTargets);
          if (!point) {
            element.style.display = "none";
            return;
          }
          const world = rig.root.localToWorld(point.clone()).project(cameraRef.current!);
          const visible = world.z > -1 && world.z < 1;
          element.style.display = visible ? "grid" : "none";
          element.style.transform = `translate(${((world.x + 1) * 0.5 * rect.width) - 18}px, ${((-world.y + 1) * 0.5 * rect.height) - 18}px)`;
        });
      }
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(tick);
    };
    tick();

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlsRef.current = controls;
    transformControlsRef.current = transformControls;
    modelRootRef.current = root;

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", selectModelFromCanvas);
      controls.removeEventListener("end", syncLinkedGridToCamera);
      transformControls.removeEventListener("mouseDown", handleTransformMouseDown);
      transformControls.removeEventListener("objectChange", handleTransformChange);
      transformControls.removeEventListener("dragging-changed", handleTransformDragging);
      transformControls.removeEventListener("mouseUp", handleTransformMouseUp);
      transformControls.detach();
      transformControls.dispose();
      scene.remove(transformHelper);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      groundGridRef.current = null;
      keyLightRef.current = null;
      fillLightRef.current = null;
      rimLightRef.current = null;
    };
  }, []);

  useEffect(() => {
    const transformControls = transformControlsRef.current;
    const root = modelRootsRef.current[selectedModelId];
    if (!transformControls || !root || !modelInfo.loaded) return;
    transformControls.attach(root);
    const transformActive = toolMode === "translate" || toolMode === "rotate";
    transformControls.setMode(toolMode === "rotate" ? "rotate" : "translate");
    transformControls.setSpace(toolMode === "rotate" ? "local" : "world");
    transformControls.enabled = editor.visible && transformActive;
    transformControls.getHelper().visible = editor.visible && transformActive;
  }, [selectedModelId, toolMode, modelInfo.loaded, editor.visible]);

  useEffect(() => {
    const root = modelRootRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!root || !scene || !camera || !renderer) return;

    modelStatesRef.current[selectedModelId] = getModelEditState(editor);
    root.position.set(...editor.position);
    root.rotation.set(...editor.rotation.map(THREE.MathUtils.degToRad) as [number, number, number]);
    root.scale.setScalar(editor.scale / 100);
    root.visible = editor.visible;
    if (transformControlsRef.current) {
      const transformActive = toolMode === "translate" || toolMode === "rotate";
      transformControlsRef.current.enabled = editor.visible && transformActive;
      transformControlsRef.current.getHelper().visible = editor.visible && transformActive;
    }
    const rig = modelRigsRef.current[selectedModelId];
    if (rig) {
      applyRigPose(rig, editor.pose, editor.mirrored);
      applySemanticPoseModifiers(rig, editor.semanticModifiers);
      applyEditorIKTargets(rig, editor.ikTargets);
    }
    else deformableMeshesRef.current.forEach((mesh) => applyRigidPose(mesh, editor.pose, editor.mirrored));
    if (viewportRef.current) {
      viewportRef.current.dataset.poseSafety = String(rig?.root.userData.poseboardSafetyFactor ?? 1);
      viewportRef.current.dataset.poseCollision = String(rig?.root.userData.poseboardCollisionFallbackReason ?? "none");
      viewportRef.current.dataset.poseSolverRevision = poseSolverRevision;
    }
    renderer.shadowMap.enabled = editor.shadow;
    camera.setFocalLength(editor.focalLength);
    camera.updateProjectionMatrix();
    renderer.toneMappingExposure = editor.exposure;
    if (keyLightRef.current) {
      keyLightRef.current.intensity = editor.keyLight;
      keyLightRef.current.color.set(editor.keyColor);
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = editor.fillLight;
      fillLightRef.current.color.set(editor.fillColor);
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = editor.rimLight;
      rimLightRef.current.color.set(editor.rimColor);
    }
    scene.background = new THREE.Color(editor.background);
    if (scene.fog instanceof THREE.Fog) scene.fog.color.set(editor.background);
  }, [editor, modelInfo.loaded, selectedModelId, toolMode]);

  useEffect(() => {
    const group = groundGridRef.current;
    if (!group) return;
    const grid = editor.perspectiveGrid;
    rebuildGroundGrid(group, grid);
    let footY = 0;
    if (grid.snapToFeet) {
      const feet = Object.values(modelRootsRef.current)
        .filter((root) => root.visible)
        .map((root) => new THREE.Box3().setFromObject(root).min.y)
        .filter(Number.isFinite);
      if (feet.length) footY = Math.min(...feet);
    }
    group.position.set(grid.origin[0], (grid.snapToFeet ? footY : 0) + grid.origin[1] + 0.004, grid.origin[2]);
  }, [editor.perspectiveGrid, editor.position, editor.pose, editor.rotation, editor.scale, modelInfo.loaded, selectedModelId]);

  const exportPng = async (exportMode: "setting" | "clean" | "with-grid" | "overlay" = "setting") => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const host = viewportRef.current;
    if (!renderer || !scene || !camera || !host || !modelInfo.loaded || exporting) {
      flash(modelInfo.loaded ? text("Export is temporarily unavailable", "导出暂不可用") : text("The 3D scene is still loading", "3D 场景仍在加载"));
      return;
    }

    setExporting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 180));

    const oldSize = renderer.getSize(new THREE.Vector2());
    const oldPixelRatio = renderer.getPixelRatio();
    const transformControls = transformControlsRef.current;
    const transformHelper = transformControls?.getHelper();
    const oldTransformHelperVisible = transformHelper?.visible ?? false;
    const groundGrid = groundGridRef.current;
    const oldGroundGridVisible = groundGrid?.visible ?? false;
    const oldBackground = scene.background;
    const oldFog = scene.fog;
    const oldClearColor = renderer.getClearColor(new THREE.Color()).clone();
    const oldClearAlpha = renderer.getClearAlpha();
    const modelVisibility = Object.entries(modelRootsRef.current).map(([id, root]) => [id, root.visible] as const);

    try {
      const [targetWidth, targetHeight] = ratioSize[editor.ratio];
      const grid = editor.perspectiveGrid;
      const overlayOnly = exportMode === "overlay";
      const includeGrid = grid.enabled && grid.mode !== "off" && (exportMode === "with-grid" || overlayOnly || (exportMode === "setting" && grid.includeInExport));
      if (transformHelper) transformHelper.visible = false;
      if (groundGrid) groundGrid.visible = includeGrid && grid.mode === "ground";
      if (overlayOnly) {
        modelVisibility.forEach(([id]) => { modelRootsRef.current[id].visible = false; });
        scene.background = null;
        scene.fog = null;
        renderer.setClearColor(0x000000, 0);
      }
      renderer.setPixelRatio(1);
      renderer.setSize(targetWidth, targetHeight, false);
      camera.aspect = targetWidth / targetHeight;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);

      const output = document.createElement("canvas");
      output.width = targetWidth;
      output.height = targetHeight;
      const context = output.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      if (!overlayOnly || grid.mode === "ground") context.drawImage(renderer.domElement, 0, 0, targetWidth, targetHeight);
      if (includeGrid && grid.mode !== "ground") drawPerspectiveOverlay(context, targetWidth, targetHeight, grid);

      const link = document.createElement("a");
      link.href = output.toDataURL("image/png");
      const suffix = overlayOnly ? "grid-overlay" : includeGrid ? "with-grid" : "clean";
      link.download = `poseboard-${selectedPose.name}-${suffix}-${targetWidth}x${targetHeight}.png`;
      link.click();
      flash(overlayOnly
        ? text("Transparent grid overlay exported", "透明网格 Overlay 已导出")
        : includeGrid
          ? text(`PNG with perspective grid exported at ${editor.ratio}`, `含透视网格 PNG 已按 ${editor.ratio} 导出`)
          : text(`Clean PNG exported at ${editor.ratio}`, `干净 PNG 已按 ${editor.ratio} 导出`));
    } catch {
      flash(text("PNG export failed. Please try again", "PNG 导出失败，请重试"));
    } finally {
      modelVisibility.forEach(([id, visible]) => { modelRootsRef.current[id].visible = visible; });
      scene.background = oldBackground;
      scene.fog = oldFog;
      renderer.setClearColor(oldClearColor, oldClearAlpha);
      renderer.setPixelRatio(oldPixelRatio);
      renderer.setSize(oldSize.x, oldSize.y, false);
      camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      camera.updateProjectionMatrix();
      if (transformHelper) transformHelper.visible = oldTransformHelperVisible;
      if (groundGrid) groundGrid.visible = oldGroundGridVisible;
      renderer.render(scene, camera);
      setExporting(false);
    }
  };

  const resetAll = () => {
    commit(() => cloneState(initialState));
    setZoom(76);
    setToolMode("translate");
    setInspectorTab("model");
    setMobilePanel(null);
    setSelectedPoseId(defaultPose.id);
    setSourcePosePrompt("");
    setPromptToPoseResult(null);
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(...cameraPresets.commercial.position);
      controlsRef.current.target.set(...cameraPresets.commercial.target);
      controlsRef.current.update();
      controlsRef.current.saveState();
    }
    flash(text("Scene reset", "场景已重置"));
  };

  const currentSize = ratioSize[editor.ratio];
  const zoomWidth = editor.ratio === "9:16" ? zoom * 0.43 : editor.ratio === "2:3" ? zoom * 0.58 : editor.ratio === "3:4" ? zoom * 0.66 : editor.ratio === "1:1" ? zoom * 0.72 : zoom;
  const landscapeRatio = editor.ratio === "9:16" ? "16:9" : editor.ratio === "2:3" ? "3:2" : editor.ratio === "3:4" ? "4:3" : editor.ratio;
  const selectedModel = modelList.find(({ id }) => id === selectedModelId) ?? modelList[0];

  return (
    <main className={`editor-app ${mobilePanel ? `show-${mobilePanel}` : ""}`}>
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">P</span>
          <span className="brand-name">PoseBoard</span>
          <span className="brand-edition">3D STUDIO</span>
          <div className="language-switch" role="group" aria-label={text("Language", "语言")}>
            <button className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => changeLanguage("en")}>EN</button>
            <button className={language === "zh" ? "active" : ""} aria-pressed={language === "zh"} onClick={() => changeLanguage("zh")}>中文</button>
          </div>
          <span className="file-state" aria-live="polite">{saveState === "saving" ? text("Saving…", "正在保存…") : text("Saved · just now", "已保存 · 刚刚")}</span>
        </div>

        <div className="toolbar-center" aria-label={text("Canvas tools", "画板工具")}>
          <div className="segmented" aria-label={text("Canvas ratio", "画板比例")}>
            {(["16:9", "3:2", "4:3", "1:1"] as const).map((ratio) => (
              <button key={ratio} className={landscapeRatio === ratio ? "active" : ""} aria-pressed={landscapeRatio === ratio} onClick={() => setLandscapeRatio(ratio)}>{ratio}</button>
            ))}
          </div>
          <button className="icon-button swap-button" onClick={toggleOrientation} title={text("Switch orientation", "切换横竖屏")} aria-label={text("Switch orientation", "切换横竖屏")}><ArrowsLeftRight size={18} /></button>
          <span className="toolbar-separator" />
          <button className={`perspective-grid-button ${editor.perspectiveGrid.mode !== "off" ? "active" : ""}`} aria-pressed={editor.perspectiveGrid.mode !== "off"} onClick={togglePerspectiveGrid} title={text("Perspective Grid · G", "透视网格 · G")}><Perspective size={18} weight={editor.perspectiveGrid.mode !== "off" ? "fill" : "regular"} /><span>{text("Perspective", "透视网格")}</span><kbd>G</kbd></button>
          <button className="reset-scene-button" onClick={resetAll} title={text("Reset entire scene", "重置整个场景")}><ArrowCounterClockwise size={17} /><span>{text("Reset Scene", "重置场景")}</span></button>
          <button className="icon-button mobile-only" aria-expanded={mobilePanel === "library"} onClick={() => setMobilePanel(mobilePanel === "library" ? null : "library")} title={text("Pose Library", "姿势库")} aria-label={text("Open Pose Library", "打开姿势库")}><SidebarSimple size={19} /></button>
          <button className="icon-button mobile-only" aria-expanded={mobilePanel === "inspector"} onClick={() => setMobilePanel(mobilePanel === "inspector" ? null : "inspector")} title={text("Inspector", "检查器")} aria-label={text("Open Inspector", "打开检查器")}><SlidersHorizontal size={19} /></button>
          <button className="icon-button mobile-only" onClick={() => setPromptToPoseOpen(true)} title={text("Text to Pose", "文字生成姿态")} aria-label={text("Text to Pose", "文字生成姿态")}><Sparkle size={19} weight="fill" /></button>
          <button className="icon-button mobile-only" onClick={() => setPromptOpen(true)} title={text("Generate image prompt", "生成绘图 Prompt")} aria-label={text("Generate image prompt", "生成绘图 Prompt")}><Copy size={18} /></button>
        </div>

        <div className="toolbar-right">
          <button className="icon-button" onClick={undo} disabled={!canUndo} title={text("Undo ⌘/Ctrl Z", "撤销 ⌘/Ctrl Z")} aria-label={text("Undo", "撤销")}><ArrowCounterClockwise size={18} /></button>
          <button className="icon-button" onClick={redo} disabled={!canRedo} title={text("Redo ⌘/Ctrl Shift Z", "重做 ⌘/Ctrl Shift Z")} aria-label={text("Redo", "重做")}><ArrowClockwise size={18} /></button>
          <span className="toolbar-separator" />
          <button className="pose-ai-button" onClick={() => setPromptToPoseOpen(true)} disabled={!modelInfo.loaded} title={text("Generate a 3D pose from text", "用文字生成 3D 姿态")}><Sparkle size={17} weight="fill" /> {text("Text to Pose", "文字姿态")}</button>
          <button className="icon-button prompt-output-button" onClick={() => setPromptOpen(true)} disabled={!modelInfo.loaded} title={text("Generate image prompt", "生成绘图 Prompt")} aria-label={text("Generate image prompt", "生成绘图 Prompt")}><Copy size={17} /></button>
          <button className={`export-button ${exporting ? "loading" : ""}`} onClick={() => exportPng()} disabled={exporting || !modelInfo.loaded} aria-busy={exporting}><DownloadSimple size={18} weight="bold" /> {exporting ? text("Exporting…", "导出中…") : text("Export PNG", "导出 PNG")}</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="panel library-panel" aria-label="Pose Library">
          <div className="library-scroll-header">
            <div className="panel-title-row">
              <div><h2>{text("Pose Library", "姿势预设库")}</h2></div>
              <span className="count">{poseItems.length + savedPoses.length} poses</span>
            </div>

            <div className="search-field" role="search">
              <span><MagnifyingGlass size={18} /></span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text("Search poses: look back / sprint / hand on hip", "搜索姿势，例如：回头 / 冲刺 / 叉腰")} aria-label={text("Search poses", "搜索姿势")} />
              {query && <button className="clear-search" onClick={() => setQuery("")} aria-label={text("Clear search", "清除搜索")} title={text("Clear search", "清除搜索")}><X size={15} /></button>}
            </div>

            <div className="quick-entry" aria-label={text("Quick views", "快捷入口")}>
              {(["featured", "recent"] as const).map((item) => (
                <button key={item} className={quickView === item ? "active" : ""} aria-pressed={quickView === item} onClick={() => setQuickView(quickView === item ? null : item)}>
                  {quickViewDisplayName(item)}{item === "recent" ? ` ${recentIds.length}` : ""}
                </button>
              ))}
              <button className={`filter-toggle ${filtersExpanded ? "active" : ""}`} aria-expanded={filtersExpanded} onClick={() => setFiltersExpanded((value) => !value)} title={text("Expand or collapse filters", "展开或收起筛选")}>
                <FunnelSimple size={15} weight={hasActiveFilters ? "fill" : "regular"} /> {text("Filter", "筛选")}
              </button>
            </div>

            <div className="category-list" role="listbox" aria-label={text("Primary pose categories", "姿势一级分类")}>
              {poseCategoryTabs.map((item) => (
                <button key={item.value} className={category === item.value ? "active" : ""} role="option" aria-selected={category === item.value} title={tabDisplayName(item.value)} onClick={() => { setCategory(item.value); setQuickView(null); }}>
                  {item.value === "favorites" && <Star size={13} weight={category === "favorites" ? "fill" : "regular"} />}
                  {item.value === "saved" && <FloppyDisk size={13} weight={category === "saved" ? "fill" : "regular"} />}
                  {tabDisplayName(item.value)}{item.value === "favorites" ? ` ${favoriteIds.length}` : item.value === "saved" ? ` ${savedPoses.length}` : ""}
                </button>
              ))}
            </div>

            {filtersExpanded && <div className="pose-filters">
              <FilterChips label={text("Direction", "朝向")} options={isZh ? directionOptions : directionOptionsEn} value={direction} onChange={(value) => setDirection(value as PoseDirection | "any")} />
              <FilterChips label={text("Motion", "动态程度")} options={isZh ? intensityOptions : intensityOptionsEn} value={intensity} onChange={(value) => setIntensity(value as PoseIntensity | "any")} />
              <FilterChips label={text("Hands", "手部")} options={isZh ? handOptions : handOptionsEn} value={hand} onChange={(value) => setHand(value as PoseHand | "any")} />
              <FilterChips label={text("Body", "身体")} options={isZh ? bodyOptions : bodyOptionsEn} value={body} onChange={(value) => setBody(value as PoseBody | "any")} />
              <FilterChips label={text("Style", "风格")} options={isZh ? styleOptions : styleOptionsEn} value={style} onChange={(value) => setStyle(value as PoseStyle | "any")} />
            </div>}

            <div className="result-line">
              <strong>{quickView ? quickViewDisplayName(quickView) : tabDisplayName(category)}</strong><span>· {filteredPoses.length}</span>
              {hasActiveFilters && <button onClick={clearPoseFilters}>{text("Clear filters", "清空筛选")}</button>}
            </div>
          </div>

          <div ref={poseGridRef} className="pose-grid" aria-label={text("Pose results", "姿势结果")}>
            {filteredPoses.map((pose) => {
              const selected = selectedPose.id === pose.id;
              const favorited = favoriteIds.includes(pose.id);
              const savedRecord = savedPoseById.get(pose.id);
              const thumbnail = savedRecord?.thumbnail || poseThumbnails[pose.enginePoseIndex];
              const unavailable = pose.status !== "ready";
              return <article key={pose.id} data-pose-index={savedRecord ? undefined : pose.enginePoseIndex} className={`pose-card ${selected ? "active" : ""} ${savedRecord ? "saved" : ""} ${unavailable ? "disabled" : ""}`}>
                <button className="pose-card-main" aria-pressed={selected} onClick={() => selectPose(pose)} disabled={unavailable} title={pose.status === "incompatible" ? text("Not compatible with this model", "当前模型不兼容此 Pose") : pose.status === "missing" ? text("Pose asset missing", "Pose 资源缺失") : text(`Apply ${pose.nameEn}`, `应用 ${pose.name}`)}>
                  <span className="pose-thumb">
                    {thumbnail
                      ? <img src={thumbnail} alt={text(`${pose.nameEn} mannequin preview`, `${pose.name} 白膜姿态预览`)} loading="lazy" />
                      : <i className="pose-thumb-loading" />}
                    {savedRecord && <span className="saved-pose-badge"><FloppyDisk size={11} weight="fill" /> {text("Saved", "已保存")}</span>}
                    {unavailable && <em>{pose.status === "missing" ? text("Asset missing", "资源缺失") : text("Rig incompatible", "骨骼不兼容")}</em>}
                  </span>
                  <span className="pose-card-body"><strong>{poseDisplayName(pose)}</strong><small>{poseMeta(pose)}</small></span>
                  {selected && <span className="selected-dot"><Check size={14} weight="bold" /></span>}
                </button>
                <div className="pose-card-actions">
                  <button className={favorited ? "favorite active" : "favorite"} onClick={() => toggleFavorite(pose)} aria-label={favorited ? text(`Remove ${pose.nameEn} from favorites`, `取消收藏 ${pose.name}`) : text(`Add ${pose.nameEn} to favorites`, `收藏 ${pose.name}`)} title={favorited ? text("Remove favorite", "取消收藏") : text("Favorite", "收藏")}><Star size={15} weight={favorited ? "fill" : "regular"} /></button>
                  <button
                    className={savedRecord ? "delete-saved" : ""}
                    onClick={() => savedRecord ? deleteSavedPose(savedRecord) : flash(`Pose ID · ${pose.id}`)}
                    aria-label={savedRecord ? text(`Delete saved pose ${pose.nameEn}`, `删除保存动作 ${pose.name}`) : text(`More options for ${pose.nameEn}`, `更多 ${pose.name}`)}
                    title={savedRecord ? text("Delete saved pose", "删除已保存动作") : `Pose ID · ${pose.id}`}
                  >{savedRecord ? <Trash size={16} weight="bold" /> : <DotsThree size={17} weight="bold" />}</button>
                </div>
              </article>;
            })}

            {!filteredPoses.length && <div className="pose-empty-state">
              <span>{category === "favorites" ? <Star size={20} /> : category === "saved" ? <FloppyDisk size={20} /> : <MagnifyingGlass size={20} />}</span>
              <strong>{category === "favorites" ? text("No favorite poses yet", "还没有收藏姿势") : category === "saved" ? text("No saved pose edits yet", "还没有保存的修改动作") : quickView === "recent" ? text("No recently used poses", "还没有最近使用") : text("No matching poses", "没有匹配的姿势")}</strong>
              <p>{category === "favorites" ? text("Use the star on any card to save it here.", "点击卡片上的星标加入收藏。") : category === "saved" ? text("Edit a joint in Edit Pose mode, then save the modified pose.", "进入姿态编辑并调整关节，然后保存修改后的动作。") : text("Clear filters or start with a featured pose below.", "清空筛选，或从下面的常用 Pose 开始。")}</p>
              <button onClick={clearPoseFilters}>{text("Clear filters", "清空筛选")}</button>
              <div className="empty-recommendations">
                {poseItems.filter((pose) => pose.featured).slice(0, 3).map((pose) => <button key={pose.id} onClick={() => selectPose(pose)}>{poseDisplayName(pose)}</button>)}
              </div>
            </div>}
          </div>

          <div className="current-pose-toolbar" aria-label={text("Current pose controls", "当前姿势快捷控制")}>
            <div className="current-pose-meta"><span>{text("Current Pose", "当前姿势")}</span><strong>{poseDisplayName(selectedPose)}</strong><small>{categoryDisplayName(selectedPose.category)} · {selectedPose.id}</small></div>
            <div className="current-pose-actions">
              <button className={editor.mirrored ? "active" : ""} onClick={() => { commit((current) => ({ ...current, mirrored: !current.mirrored })); flash(editor.mirrored ? text("Original pose restored", "已恢复原始姿态") : text("Skeleton pose mirrored", "已镜像骨骼姿态")); }} aria-pressed={editor.mirrored} title={text("Mirror skeleton pose", "镜像骨骼姿态")}><ArrowsLeftRight size={16} /></button>
              <button onClick={() => selectAdjacentPose(-1)} title={text("Previous", "上一个")}><ArrowLeft size={16} /></button>
              <button onClick={() => selectAdjacentPose(1)} title={text("Next", "下一个")}><ArrowRight size={16} /></button>
              <button onClick={selectRandomPose} title={text("Random from current results", "在当前筛选中随机")}><Shuffle size={16} /></button>
              <button className={favoriteIds.includes(selectedPose.id) ? "active favorite" : "favorite"} onClick={() => toggleFavorite(selectedPose)} title={text("Favorite current pose", "收藏当前姿势")}><Star size={16} weight={favoriteIds.includes(selectedPose.id) ? "fill" : "regular"} /></button>
              <button onClick={showSimilarPoses} title={text("Show similar poses", "查看相似动作")}><Sparkle size={16} /></button>
              <button onClick={() => selectPose(defaultPose)} title={text("Restore natural standing", "恢复自然站立")}><ArrowCounterClockwise size={16} /></button>
            </div>
          </div>
        </aside>

        <section className="canvas-area">
          <div className="canvas-header">
            <div className="canvas-meta"><span className={`status-dot ${modelInfo.loaded ? "ready" : ""}`} /><span>{modelStatusLabel}</span></div>
            <div className="canvas-actions">
              <button className={editor.grid ? "active" : ""} aria-pressed={editor.grid} onClick={(event) => { event.stopPropagation(); commit((current) => ({ ...current, grid: !current.grid })); flash(editor.grid ? text("Composition grid hidden", "构图线已关闭") : text("Composition grid shown", "构图线已开启")); }} title={text("Composition grid", "构图线")} aria-label={text("Toggle composition grid", "切换构图线")}><GridFour size={17} /></button>
              <button onClick={(event) => { event.stopPropagation(); controlsRef.current?.reset(); flash(text("Camera reset", "镜头已归位")); }} title={text("Reset camera", "归位镜头")} aria-label={text("Reset camera", "归位镜头")}><HouseLine size={17} /></button>
            </div>
          </div>

          <div className="canvas-stage">
            <div className="artboard-wrap" style={{ aspectRatio: editor.ratio.replace(":", " / "), width: `${zoomWidth}%` }}>
              <div className="tool-dock artboard-tool-dock" role="toolbar" aria-label={text("Model editing mode", "模型编辑模式")}>
                <button className={toolMode === "translate" ? "active" : ""} aria-pressed={toolMode === "translate"} onClick={(event) => { event.stopPropagation(); activateTool("translate"); }} title={text("Select a model to move it", "点击模型后移动")}><ArrowsOutCardinal size={16} /> {text("Move", "选择并移动")}</button>
                <button className={toolMode === "rotate" ? "active" : ""} aria-pressed={toolMode === "rotate"} onClick={(event) => { event.stopPropagation(); activateTool("rotate"); }} title={text("Rotate model", "旋转模型")}><ArrowClockwise size={16} /> {text("Rotate", "旋转")}</button>
                <button className={toolMode === "pose" ? "active" : ""} aria-pressed={toolMode === "pose"} onClick={(event) => { event.stopPropagation(); activateTool("pose"); }} title={text("Drag joint and direction handles to edit the skeleton", "拖动关节与方向控制柄调整骨骼")}><Sparkle size={16} /> {text("Edit Pose", "姿态编辑")}</button>
              </div>
              <div className="artboard-label"><span /> ARTBOARD · {currentSize[0]} × {currentSize[1]}</div>
              <div className="artboard-shell">
                <div ref={viewportRef} className="three-viewport" />
                <PerspectiveGridOverlay
                  state={editor.perspectiveGrid}
                  label={text("Editable perspective grid", "可编辑透视网格")}
                  horizonLabel={text("Drag horizon", "拖动地平线")}
                  vanishingPointLabel={text("Drag vanishing point", "拖动消失点")}
                  onDragStart={beginPerspectiveDrag}
                />
                <div className={`control-point-layer ${toolMode === "pose" && modelInfo.hasSkeleton && editor.visible ? "visible" : ""}`} aria-hidden={toolMode !== "pose"}>
                  {ikControlDefinitions.map(({ id: control, label, labelEn, kind }) => (
                    <button
                      key={control}
                      ref={(element) => { if (element) controlPointRefs.current[control] = element; else delete controlPointRefs.current[control]; }}
                      className={`control-point ${kind} ${activeIKControl === control ? "selected" : ""}`}
                      onPointerDown={(event) => beginIKDrag(control, event)}
                      aria-label={text(`Drag ${labelEn} control point`, `拖动${label}控制点`)}
                      tabIndex={toolMode === "pose" ? 0 : -1}
                    ><span /><small>{isZh ? label : labelEn}</small></button>
                  ))}
                </div>
                {!modelInfo.loaded && <div className="model-loader"><span /><p>{modelStatusLabel}</p></div>}
                {editor.grid && <div className="composition-grid"><i /><i /><b /><b /></div>}
              </div>
            </div>
          </div>

          <div className="zoom-control">
            <button onClick={() => setZoom((value) => clamp(value - 8, 34, 100))} aria-label={text("Zoom out", "缩小")}><Minus size={16} /></button>
            <button className="zoom-value" onClick={() => setZoom(76)} aria-label={text(`Zoom ${zoom}%. Click to reset`, `当前缩放 ${zoom}%，点击恢复默认`)}>{zoom}%</button>
            <button onClick={() => setZoom((value) => clamp(value + 8, 34, 100))} aria-label={text("Zoom in", "放大")}><Plus size={16} /></button>
            <span />
            <button onClick={() => setZoom(76)}>{text("Fit", "适应")}</button>
          </div>
        </section>

        <aside className="panel inspector-panel" aria-label="Inspector">
          <div className="selection-header">
            <span className="cube-icon"><Cube size={19} weight="duotone" /></span>
            <div><strong>{modelDisplayName(selectedModel)}</strong><small>{modelInfo.hasSkeleton ? "Rigged Humanoid" : "Pose Preview · Prototype"}</small></div>
            <button className={editor.visible ? "visible" : ""} onClick={() => { commit((current) => ({ ...current, visible: !current.visible })); flash(editor.visible ? text("Model hidden", "模型已隐藏") : text("Model shown", "模型已显示")); }} aria-label={editor.visible ? text("Hide model", "隐藏模型") : text("Show model", "显示模型")}>{editor.visible ? <Eye size={18} /> : <EyeSlash size={18} />}</button>
            <button className="add-model-button" onClick={addModel} disabled={!modelInfo.loaded || modelList.length >= 8} aria-label={text("Add character model", "添加机器人模型")} title={text("Add character model", "添加机器人模型")}><Plus size={18} weight="bold" /></button>
          </div>

          <div className="inspector-tabs" role="tablist" aria-label={text("Inspector sections", "属性类型")}>
            <button className={inspectorTab === "model" ? "active" : ""} role="tab" aria-selected={inspectorTab === "model"} onClick={() => setInspectorTab("model")}>{text("Model", "模型")}</button>
            <button className={inspectorTab === "camera" ? "active" : ""} role="tab" aria-selected={inspectorTab === "camera"} onClick={() => setInspectorTab("camera")}>{text("Camera", "镜头")}</button>
            <button className={inspectorTab === "scene" ? "active" : ""} role="tab" aria-selected={inspectorTab === "scene"} onClick={() => setInspectorTab("scene")}>{text("Scene", "场景")}</button>
          </div>

          <div className="inspector-content">
            {inspectorTab === "model" && <>
              <div className="model-stack" aria-label={text("Canvas models", "画板模型列表")}>
                <div className="model-stack-title"><span>{text("Canvas Models", "画板模型")}</span><small>{modelList.length} / 8</small></div>
                <div className="model-stack-list">
                  {modelList.map((model) => (
                    <button key={model.id} className={selectedModelId === model.id ? "active" : ""} onClick={() => selectModel(model.id)}>
                      <Cube size={16} weight={selectedModelId === model.id ? "fill" : "regular"} />
                      <span>{modelDisplayName(model)}</span>
                      {selectedModelId === model.id && <Check size={14} weight="bold" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="active-tool-card">
                <span>{toolMode === "translate" ? <ArrowsOutCardinal size={18} /> : toolMode === "rotate" ? <ArrowClockwise size={18} /> : <Sparkle size={18} />}</span>
                <div><small>{text("Current Mode", "当前模式")}</small><strong>{toolMode === "translate" ? text("Move Model", "选择并移动") : toolMode === "rotate" ? text("Rotate Model", "旋转模型") : text("IK Pose Editing", "IK 姿态编辑")}</strong></div>
              </div>

              {toolMode === "pose" && <InspectorSection title={text("IK Pose Editing", "IK 姿态编辑")} resetLabel={text("Reset", "重置")} onReset={resetIKEdits}>
                <div className={`control-point-info ${activeIKControl ? "selected" : ""}`}>
                  <span><Sparkle size={17} weight="fill" /></span>
                  <div><strong>{activeIKControl ? text("Adjusting Skeleton", "正在调整骨骼") : text("19 Skeleton Control Points", "19 个人体骨骼控制点")}</strong><small>{text("Blue points control position; orange diamonds control hand and foot direction; core points adjust the chest and pelvis; smaller points control shoulders, elbows, hips, and knees.", "蓝色圆点控制位置；橙色菱形控制手掌与脚尖方向；核心控制点调整胸腔和骨盆；小型圆点控制肩、肘、髋与膝。")}</small></div>
                </div>
                <button className={`save-custom-pose-button ${selectedSavedPose && !hasUnsavedJointEdits ? "saved" : ""}`} onClick={saveModifiedPose} disabled={!hasUnsavedJointEdits || !modelInfo.loaded}>
                  {selectedSavedPose && !hasUnsavedJointEdits ? <Check size={17} weight="bold" /> : <FloppyDisk size={17} weight="fill" />}
                  <span>{selectedSavedPose && !hasUnsavedJointEdits ? text("Saved to Library", "已保存到动作库") : hasJointEdits || selectedSavedPose ? text("Save Modified Pose", "保存修改后的动作") : text("Adjust joints to save", "调整关节后可保存")}</span>
                </button>
              </InspectorSection>}

              <InspectorSection title={text("Model Transform", "模型变换")} resetLabel={text("Reset", "重置")} onReset={() => commit((current) => ({ ...current, position: [0, 0, 0], rotation: [0, 0, 0], scale: 100 }))}>
                <VectorField label={text("Position", "位置")} values={editor.position} step={0.05} onChange={(axis, value) => updateVector("position", axis, value)} />
                <VectorField label={text("Rotation", "旋转")} values={editor.rotation} step={1} onChange={(axis, value) => updateVector("rotation", axis, value)} />
                <ControlRow label={text("Scale", "缩放")}><div className="range-with-value"><input type="range" min="50" max="300" value={editor.scale} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateContinuousEdit((current) => ({ ...current, scale: Number(event.target.value) }))} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label={text("Model scale", "模型缩放")} /><output>{editor.scale}%</output></div></ControlRow>
              </InspectorSection>
            </>}

            {inspectorTab === "camera" && <InspectorSection title={text("Camera System", "镜头系统")} resetLabel={text("Reset", "重置")} onReset={() => applyCameraPreset("commercial")}>
              <div className="preset-grid camera-presets">
                {(Object.entries(cameraPresets) as Array<[Exclude<CameraPresetId, "custom">, (typeof cameraPresets)[Exclude<CameraPresetId, "custom">]]>).map(([id, preset]) => (
                  <button key={id} className={editor.cameraPreset === id ? "active" : ""} onClick={() => applyCameraPreset(id)}><Camera size={16} /><span>{isZh ? preset.label : preset.labelEn}</span><small>{preset.focalLength}mm</small></button>
                ))}
              </div>
              <ControlRow label={text("Focal", "焦距")}><div className="range-with-value"><input type="range" min="18" max="120" value={editor.focalLength} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateCameraComposition({ focalLength: Number(event.target.value) }, true)} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label={text("Camera focal length", "相机焦距")} /><output>{editor.focalLength}mm</output></div></ControlRow>
              <ControlRow label={text("Height", "高度")}><div className="range-with-value"><input type="range" min="0.4" max="3.2" step="0.05" value={editor.cameraHeight} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateCameraComposition({ cameraHeight: Number(event.target.value) }, true)} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label={text("Camera height", "相机高度")} /><output>{editor.cameraHeight.toFixed(2)}</output></div></ControlRow>
              <ControlRow label={text("Shot", "景别")}><select value={editor.shotSize} onChange={(event) => updateCameraComposition({ shotSize: event.target.value as ShotSize })} aria-label={text("Camera shot size", "相机景别")}>{(Object.entries(isZh ? shotLabels : shotLabelsEn) as Array<[ShotSize, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></ControlRow>
              <ControlRow label={text("Projection", "投影")}><select defaultValue="perspective" aria-label={text("Camera projection", "相机投影")}><option value="perspective">{text("Perspective", "透视")}</option></select></ControlRow>
              <div className="camera-tip"><span><Info size={17} /></span><p>{text("Presets adjust focal length, camera position, and shot size together. Drag the empty artboard to orbit freely.", "预设会同时调整焦距、机位和景别；画板空白处仍可自由旋转镜头。")}</p></div>
            </InspectorSection>}

            {inspectorTab === "scene" && <>
              <InspectorSection title={text("Perspective Grid", "透视网格")} resetLabel={text("Reset", "重置")} onReset={resetPerspectiveGrid}>
                <div className="perspective-mode-grid" role="radiogroup" aria-label={text("Perspective grid mode", "透视网格模式")}>
                  {([
                    ["off", text("Off", "关闭")],
                    ["ground", text("Ground", "地面")],
                    ["one-point", text("1 Point", "一点")],
                    ["two-point", text("2 Point", "两点")],
                    ["three-point", text("3 Point", "三点")],
                  ] as Array<[PerspectiveGridMode, string]>).map(([mode, label]) => <button key={mode} className={editor.perspectiveGrid.mode === mode ? "active" : ""} role="radio" aria-checked={editor.perspectiveGrid.mode === mode} onClick={() => setPerspectiveMode(mode)}>{label}</button>)}
                </div>

                {editor.perspectiveGrid.mode !== "off" && <>
                  {editor.perspectiveGrid.mode !== "ground" && <>
                    <ControlRow label={text("Link", "联动")}><select value={editor.perspectiveGrid.coordinateMode} onChange={(event) => setPerspectiveCoordinateMode(event.target.value as "camera-linked" | "independent")} aria-label={text("Perspective coordinate mode", "透视联动模式")}><option value="independent">{text("Independent Edit", "独立编辑")}</option><option value="camera-linked">{text("Follow Camera", "跟随相机")}</option></select></ControlRow>
                    <ControlRow label={text("Horizon", "地平线")}><div className="range-with-value"><input type="range" min="0.05" max="0.95" step="0.01" value={editor.perspectiveGrid.horizonY} disabled={editor.perspectiveGrid.lock} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateContinuousEdit((current) => {
                      const horizonY = Number(event.target.value);
                      const vanishingPoints = current.perspectiveGrid.vanishingPoints.map((point, index) => index < (current.perspectiveGrid.mode === "one-point" ? 1 : 2) ? { ...point, y: horizonY } : { ...point });
                      return { ...current, perspectiveGrid: { ...current.perspectiveGrid, horizonY, vanishingPoints, coordinateMode: "independent" } };
                    })} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label={text("Horizon height", "地平线高度")} /><output>{Math.round(editor.perspectiveGrid.horizonY * 100)}%</output></div></ControlRow>
                  </>}

                  {editor.perspectiveGrid.mode === "ground" && <ControlRow label={text("Plane", "平面")}><select value={editor.perspectiveGrid.plane} onChange={(event) => commit((current) => ({ ...current, perspectiveGrid: { ...current.perspectiveGrid, plane: event.target.value as "XZ" | "XY" | "YZ" } }))} aria-label={text("Grid plane", "网格平面")}><option value="XZ">XZ · {text("Ground", "地面")}</option><option value="XY">XY</option><option value="YZ">YZ</option></select></ControlRow>}
                  <VectorField label={text("Origin", "原点")} values={editor.perspectiveGrid.origin} step={0.05} onChange={updatePerspectiveOrigin} />
                  {editor.perspectiveGrid.mode === "ground" && <VectorField label={text("Rotation", "旋转")} values={editor.perspectiveGrid.rotation} step={1} onChange={updatePerspectiveRotation} />}
                  <ControlRow label={text("Size", "尺寸")}><div className="range-with-value"><input type="range" min="6" max="40" step="1" value={editor.perspectiveGrid.size} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateContinuousEdit((current) => ({ ...current, perspectiveGrid: { ...current.perspectiveGrid, size: Number(event.target.value) } }))} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label={text("Grid size", "网格尺寸")} /><output>{editor.perspectiveGrid.size}m</output></div></ControlRow>
                  <ControlRow label={text("Major", "主间距")}><div className="range-with-value"><input type="range" min="0.5" max="5" step="0.25" value={editor.perspectiveGrid.majorStep} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateContinuousEdit((current) => ({ ...current, perspectiveGrid: { ...current.perspectiveGrid, majorStep: Number(event.target.value) } }))} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label={text("Major grid spacing", "主网格间距")} /><output>{editor.perspectiveGrid.majorStep}m</output></div></ControlRow>
                  <ControlRow label={text("Density", "细分")}><div className="range-with-value"><input type="range" min="1" max="10" step="1" value={editor.perspectiveGrid.subdivisions} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateContinuousEdit((current) => ({ ...current, perspectiveGrid: { ...current.perspectiveGrid, subdivisions: Number(event.target.value) } }))} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label={text("Grid subdivisions", "网格细分数量")} /><output>{editor.perspectiveGrid.subdivisions}×</output></div></ControlRow>
                  <ControlRow label={text("Opacity", "透明度")}><div className="range-with-value"><input type="range" min="0.08" max="0.8" step="0.01" value={editor.perspectiveGrid.opacity} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateContinuousEdit((current) => ({ ...current, perspectiveGrid: { ...current.perspectiveGrid, opacity: Number(event.target.value) } }))} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label={text("Grid opacity", "网格透明度")} /><output>{Math.round(editor.perspectiveGrid.opacity * 100)}%</output></div></ControlRow>
                  <ControlRow label={text("Width", "线宽")}><div className="range-with-value"><input type="range" min="0.5" max="3" step="0.25" value={editor.perspectiveGrid.lineWidth} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateContinuousEdit((current) => ({ ...current, perspectiveGrid: { ...current.perspectiveGrid, lineWidth: Number(event.target.value) } }))} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label={text("Grid line width", "网格线宽")} /><output>{editor.perspectiveGrid.lineWidth}px</output></div></ControlRow>
                  <div className="perspective-color-grid">
                    <label><span>{text("Major", "主线")}</span><input type="color" value={editor.perspectiveGrid.majorColor} onChange={(event) => commit((current) => ({ ...current, perspectiveGrid: { ...current.perspectiveGrid, majorColor: event.target.value } }))} aria-label={text("Major grid color", "主网格线颜色")} /></label>
                    <label><span>{text("Minor", "副线")}</span><input type="color" value={editor.perspectiveGrid.minorColor} onChange={(event) => commit((current) => ({ ...current, perspectiveGrid: { ...current.perspectiveGrid, minorColor: event.target.value } }))} aria-label={text("Minor grid color", "副网格线颜色")} /></label>
                  </div>
                  <ToggleRow label={editor.perspectiveGrid.lock ? text("Grid Locked", "已锁定网格") : text("Lock Editing", "锁定编辑")} toggleLabel={text("Lock perspective grid editing", "锁定透视网格编辑")} active={editor.perspectiveGrid.lock} onClick={() => commit((current) => ({ ...current, perspectiveGrid: { ...current.perspectiveGrid, lock: !current.perspectiveGrid.lock } }))} />
                  {editor.perspectiveGrid.mode === "ground" && <ToggleRow label={text("Snap to Feet", "吸附脚底")} toggleLabel={text("Snap grid to lowest foot", "网格吸附人物最低脚底")} active={editor.perspectiveGrid.snapToFeet} onClick={() => commit((current) => ({ ...current, perspectiveGrid: { ...current.perspectiveGrid, snapToFeet: !current.perspectiveGrid.snapToFeet } }))} />}
                  <ToggleRow label={text("Include in Export", "导出包含网格")} toggleLabel={text("Include perspective grid in PNG export", "PNG 导出时包含透视网格")} active={editor.perspectiveGrid.includeInExport} onClick={() => commit((current) => ({ ...current, perspectiveGrid: { ...current.perspectiveGrid, includeInExport: !current.perspectiveGrid.includeInExport } }))} />
                  <div className={`perspective-lock-note ${editor.perspectiveGrid.lock ? "active" : ""}`}>{editor.perspectiveGrid.lock ? <Lock size={15} weight="fill" /> : <LockOpen size={15} />}<span>{editor.perspectiveGrid.lock ? text("Handles are protected from accidental dragging.", "地平线和消失点已防止误拖。") : text("Drag the horizon and numbered vanishing points directly on the artboard.", "可直接在画板拖动地平线和带编号的消失点。")}</span></div>
                  <div className="perspective-export-actions">
                    <button onClick={() => exportPng("clean")} disabled={exporting}>{text("Clean PNG", "干净图")}</button>
                    <button className="primary" onClick={() => exportPng("with-grid")} disabled={exporting}>{text("With Grid", "含网格图")}</button>
                    <button onClick={() => exportPng("overlay")} disabled={exporting}>{text("Overlay", "透明网格")}</button>
                  </div>
                </>}
              </InspectorSection>

              <InspectorSection title={text("Lighting System", "灯光系统")} resetLabel={text("Reset", "重置")} onReset={() => applyLightingPreset("studio")}>
                <div className="preset-grid lighting-presets">
                  {(Object.entries(lightingPresets) as Array<[Exclude<LightingPresetId, "custom">, (typeof lightingPresets)[Exclude<LightingPresetId, "custom">]]>).map(([id, preset]) => (
                    <button key={id} className={editor.lightingPreset === id ? "active" : ""} onClick={() => applyLightingPreset(id)}><Lightbulb size={16} /><span>{isZh ? preset.label : preset.labelEn}</span></button>
                  ))}
                </div>
                {([
                  [text("Key", "主光"), "keyLight", editor.keyLight],
                  [text("Fill", "补光"), "fillLight", editor.fillLight],
                  [text("Rim", "轮廓光"), "rimLight", editor.rimLight],
                  [text("Exposure", "曝光"), "exposure", editor.exposure],
                ] as Array<[string, "keyLight" | "fillLight" | "rimLight" | "exposure", number]>).map(([label, key, value]) => (
                  <ControlRow key={key} label={label}><div className="range-with-value"><input type="range" min={key === "exposure" ? "0.6" : "0"} max={key === "exposure" ? "1.5" : "6"} step="0.05" value={value} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateLightingValue(key, Number(event.target.value))} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label={label} /><output>{value.toFixed(2)}</output></div></ControlRow>
                ))}
              </InspectorSection>
              <InspectorSection title={text("Scene Appearance", "场景外观")} resetLabel={text("Reset", "重置")} onReset={() => commit((current) => ({ ...current, background: "#eef0f4", shadow: true }))}>
                <ControlRow label={text("Background", "背景")}><label className="color-control"><span>{editor.background.toUpperCase()}</span><input type="color" value={editor.background} onFocus={beginContinuousEdit} onChange={(event) => updateContinuousEdit((current) => ({ ...current, background: event.target.value }))} onBlur={endContinuousEdit} aria-label={text("Scene background color", "场景背景颜色")} /></label></ControlRow>
                <ToggleRow label={text("Model Shadow", "模型阴影")} toggleLabel={text("Toggle model shadow", "切换模型阴影")} active={editor.shadow} onClick={() => commit((current) => ({ ...current, shadow: !current.shadow }))} />
              </InspectorSection>
              <div className="model-diagnostics">
                <span className={modelInfo.hasSkeleton ? "ok" : "warn"}>{modelInfo.hasSkeleton ? "HUMANOID V1" : "PROTOTYPE"}</span>
                <p>{modelInfo.hasSkeleton
                  ? text("A compatible skeleton was detected. Switching poses does not reload the model.", "已检测到兼容骨骼，Pose 切换不会重新加载模型。")
                  : text("The current mannequin has no Skeleton. This prototype maps PoseItem data to a procedural preview; production requires a rigged humanoid_v1 model.", "当前白模没有 Skeleton；原型使用 PoseItem 到程序化预览的映射。生产环境需替换为已 Rig 的 humanoid_v1 白模。")}</p>
              </div>
            </>}
          </div>
        </aside>
      </section>

      {promptToPoseOpen && <div className="prompt-backdrop">
        <section className="prompt-dialog pose-prompt-dialog" role="dialog" aria-modal="true" aria-labelledby="pose-prompt-title">
          <div className="prompt-heading">
            <div><span><Sparkle size={16} weight="fill" /> Prompt To Pose</span><h2 id="pose-prompt-title">{text("Create a 3D pose with natural language", "用自然语言生成 3D 人体姿态")}</h2></div>
            <button onClick={() => setPromptToPoseOpen(false)} aria-label={text("Close Text to Pose", "关闭文字生成姿态面板")}><X size={18} /></button>
          </div>
          <div className="pose-prompt-input">
            <label htmlFor="pose-prompt-text">{text("Describe what the character is doing", "描述人物正在做什么")}</label>
            <textarea
              id="pose-prompt-text"
              value={poseText}
              onChange={(event) => { setPoseText(event.target.value); setPromptToPoseResult(null); }}
              placeholder={text("Example: a warrior kneeling on one knee, holding a sword and leaning forward", "例如：一个武士单膝跪地，右手握刀，身体前倾，准备战斗")}
            />
            <div className="pose-prompt-examples" aria-label={text("Pose prompt examples", "动作描述示例")}>
              {(isZh ? promptToPoseExamples : promptToPoseExamplesEn).map((example, index) => <button key={example} onClick={() => { setPoseText(example); setPromptToPoseResult(null); }}>{text("Example", "示例")} {index + 1}</button>)}
            </div>
            <button className="pose-analyze-button" onClick={analyzePoseText}><Sparkle size={16} weight="fill" /> {text("Analyze & Match Pose", "解析并匹配姿态")}</button>
          </div>

          {promptToPoseResult ? <>
            <div className="pose-match-card">
              <span className="pose-match-icon"><Check size={18} weight="bold" /></span>
              <div><small>{text("Skeleton Pose Match", "Skeleton Pose 匹配")}</small><h3>{poseDisplayName(promptToPoseResult.pose)}</h3><p>{poseMeta(promptToPoseResult.pose)}</p></div>
              <strong>{Math.round(promptToPoseResult.confidence * 100)}%</strong>
            </div>
            <div className="pose-semantic-grid">
              <section><span>{text("Structured Pose Data", "结构化动作参数")}</span><pre>{JSON.stringify(promptToPoseJson(promptToPoseResult), null, 2)}</pre></section>
              <section><span>{text("Analysis & Recommendation", "解析与推荐")}</span><ul>{(isZh ? promptToPoseResult.explanation : [
                `Primary category: ${getPoseCategoryLabelEn(promptToPoseResult.category)}`,
                `Best database match: ${promptToPoseResult.pose.nameEn}`,
                `${Object.keys(promptToPoseResult.modifiers).length} semantic pose modifiers detected`,
                `Recommended ${cameraPresets[promptToPoseResult.cameraPreset].labelEn} camera with ${lightingPresets[promptToPoseResult.lightingPreset].labelEn} lighting`,
              ]).map((item) => <li key={item}>{item}</li>)}</ul></section>
            </div>
            <div className="prompt-summary pose-result-summary">
              <span>Category <b>{promptToPoseResult.category}</b></span>
              <span>Base Pose <b>{promptToPoseResult.basePose}</b></span>
              <span>Camera <b>{isZh ? cameraPresets[promptToPoseResult.cameraPreset].label : cameraPresets[promptToPoseResult.cameraPreset].labelEn}</b></span>
              <span>Light <b>{isZh ? lightingPresets[promptToPoseResult.lightingPreset].label : lightingPresets[promptToPoseResult.lightingPreset].labelEn}</b></span>
            </div>
            <div className="prompt-footer">
              <button onClick={() => copyPrompt(JSON.stringify(promptToPoseJson(promptToPoseResult), null, 2))}><Copy size={15} />{text("Copy JSON", "复制 JSON")}</button>
              <button className="primary" onClick={applyPromptToPose}><Sparkle size={16} weight="fill" />{text("Apply to 3D Skeleton", "应用到 3D 骨骼")}</button>
            </div>
          </> : <div className="pose-prompt-empty">
            <Sparkle size={22} />
            <div><strong>{text("Language → Pose Library → Skeleton", "语义 → Pose 数据库 → Skeleton")}</strong><p>{text("The system identifies the primary posture, body direction, limb action, expression, and style, then matches the closest skeleton preset and recommends camera and lighting.", "系统会识别主姿态、身体方向、手腿动作、情绪与风格，再选择最接近的骨骼预设并推荐镜头和灯光。")}</p></div>
          </div>}
        </section>
      </div>}

      {promptOpen && <div className="prompt-backdrop">
        <section className="prompt-dialog" role="dialog" aria-modal="true" aria-labelledby="prompt-title">
          <div className="prompt-heading">
            <div><span><Sparkle size={16} weight="fill" /> AI Prompt Generator</span><h2 id="prompt-title">{text("Generate a prompt from pose, camera, and lighting", "从姿势、镜头与灯光生成提示词")}</h2></div>
            <button onClick={() => setPromptOpen(false)} aria-label={text("Close Prompt panel", "关闭 Prompt 面板")}><X size={18} /></button>
          </div>
          <div className="platform-tabs" role="tablist" aria-label={text("AI platform", "AI 平台")}>
            {([
              ["midjourney", "Midjourney"],
              ["flux", "Flux"],
              ["gpt-image", "GPT Image"],
              ["seedance", "Seedance"],
              ["jimeng", text("Jimeng", "即梦")],
            ] as Array<[PromptPlatform, string]>).map(([value, label]) => <button key={value} className={promptPlatform === value ? "active" : ""} onClick={() => setPromptPlatform(value)} role="tab" aria-selected={promptPlatform === value}>{label}</button>)}
          </div>
          <div className="prompt-fields">
            <label><span>{text("Chinese Prompt", "中文 Prompt")}</span><textarea readOnly value={generatedPrompt.chinese} /><button onClick={() => copyPrompt(generatedPrompt.chinese)}><Copy size={15} />{text("Copy Chinese", "复制中文")}</button></label>
            <label><span>English Prompt</span><textarea readOnly value={generatedPrompt.english} /><button onClick={() => copyPrompt(generatedPrompt.english)}><Copy size={15} />Copy English</button></label>
          </div>
          <div className="prompt-summary">
            <span>Pose <b>{poseDisplayName(selectedPose)}</b></span>
            <span>Camera <b>{editor.focalLength}mm · {(isZh ? shotLabels : shotLabelsEn)[editor.shotSize]}</b></span>
            <span>Light <b>{editor.lightingPreset === "custom" ? text("Custom", "自定义") : isZh ? lightingPresets[editor.lightingPreset].label : lightingPresets[editor.lightingPreset].labelEn}</b></span>
          </div>
          <div className="prompt-footer">
            <button onClick={exportProjectJson}>{text("Export Project JSON", "导出项目 JSON")}</button>
            <button onClick={() => { downloadTextFile(`poseboard-${selectedPose.id}-prompt.md`, `# ${selectedPose.nameEn}\n\n## Chinese Prompt\n\n${generatedPrompt.chinese}\n\n## English Prompt\n\n${generatedPrompt.english}\n`, "text/markdown"); flash(text("Prompt Markdown exported", "Prompt Markdown 已导出")); }}>{text("Export Markdown", "导出 Markdown")}</button>
            <button className="primary" onClick={() => copyPrompt(`${generatedPrompt.chinese}\n\n${generatedPrompt.english}`)}><Copy size={16} />{text("Copy All", "复制全部")}</button>
          </div>
        </section>
      </div>}

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
      {mobilePanel && <button className="mobile-scrim" onClick={() => setMobilePanel(null)} aria-label={text("Close panel", "关闭面板")} />}
    </main>
  );
}

function FilterChips({ label, options, value, onChange }: { label: string; options: ReadonlyArray<readonly [string, string]>; value: string; onChange: (value: string) => void }) {
  return <div className="filter-row"><span>{label}</span><div>{options.map(([optionLabel, optionValue]) => <button key={optionValue} className={value === optionValue ? "active" : ""} aria-pressed={value === optionValue} onClick={() => onChange(optionValue)}>{optionLabel}</button>)}</div></div>;
}

function InspectorSection({ title, resetLabel, children, onReset }: { title: string; resetLabel: string; children: React.ReactNode; onReset: () => void }) {
  return <section className="inspector-section"><div className="section-heading"><h3>{title}</h3><button onClick={onReset} title={`${resetLabel} ${title}`} aria-label={`${resetLabel} ${title}`}><ArrowCounterClockwise size={17} /></button></div>{children}</section>;
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="control-row"><span>{label}</span>{children}</div>;
}

function VectorField({ label, values, step, onChange }: { label: string; values: [number, number, number]; step: number; onChange: (axis: number, value: number) => void }) {
  return <ControlRow label={label}><div className="vector-field">{["X", "Y", "Z"].map((axis, index) => <label key={axis}><span>{axis}</span><input type="number" step={step} value={Number(values[index].toFixed(2))} aria-label={`${label} ${axis}`} onChange={(event) => onChange(index, Number(event.target.value))} /></label>)}</div></ControlRow>;
}

function ToggleRow({ label, toggleLabel, active, onClick }: { label: string; toggleLabel: string; active: boolean; onClick: () => void }) {
  return <div className="toggle-row"><span>{label}</span><button className={`toggle ${active ? "active" : ""}`} onClick={onClick} role="switch" aria-label={toggleLabel} aria-checked={active}><i /></button></div>;
}
