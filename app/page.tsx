"use client";

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
  Cube,
  DownloadSimple,
  Eye,
  EyeSlash,
  GridFour,
  HouseLine,
  Info,
  MagnifyingGlass,
  Minus,
  DotsThree,
  FunnelSimple,
  Plus,
  Shuffle,
  SidebarSimple,
  SlidersHorizontal,
  Sparkle,
  Star,
  X,
} from "@phosphor-icons/react";
import {
  bodyOptions,
  defaultPose,
  directionOptions,
  getPoseCategoryLabel,
  getPoseTabLabel,
  handOptions,
  intensityOptions,
  poseCategoryTabs,
  poseItems,
  styleOptions,
  type PoseBody,
  type PoseCategoryTab,
  type PoseDirection,
  type PoseHand,
  type PoseIntensity,
  type PoseItem,
  type PoseStyle,
} from "./pose-data";

type Ratio = "16:9" | "9:16" | "3:2" | "2:3" | "4:3" | "3:4" | "1:1";
type ToolMode = "translate" | "rotate";
type InspectorTab = "model" | "camera" | "scene";
type QuickView = "常用" | "最近" | null;

type EditorState = {
  pose: number;
  mirrored: boolean;
  ratio: Ratio;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  fov: number;
  background: string;
  shadow: boolean;
  grid: boolean;
  visible: boolean;
};

const initialState: EditorState = {
  pose: 0,
  mirrored: false,
  ratio: "16:9",
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 100,
  fov: 34,
  background: "#eef0f4",
  shadow: true,
  grid: false,
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

const presetCameraPosition: [number, number, number] = [4.8, 3, 7.2];
const presetCameraTarget: [number, number, number] = [0, 1.55, 0];
const presetCameraFov = 34;

type JointPose = {
  torso: [number, number, number];
  head: [number, number, number];
  leftArm: [number, number, number];
  leftForearm: [number, number, number];
  rightArm: [number, number, number];
  rightForearm: [number, number, number];
  leftLeg: [number, number, number];
  leftShin: [number, number, number];
  rightLeg: [number, number, number];
  rightShin: [number, number, number];
};

const zeroRotation: [number, number, number] = [0, 0, 0];
const jointPose = (values: Partial<JointPose> = {}): JointPose => ({
  torso: zeroRotation,
  head: zeroRotation,
  leftArm: zeroRotation,
  leftForearm: zeroRotation,
  rightArm: zeroRotation,
  rightForearm: zeroRotation,
  leftLeg: zeroRotation,
  leftShin: zeroRotation,
  rightLeg: zeroRotation,
  rightShin: zeroRotation,
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

type PoseTransform = {
  rotation: [number, number, number];
  position: [number, number, number];
  scale: number;
};

const cloneJointPose = (source: JointPose): JointPose => ({
  torso: [...source.torso],
  head: [...source.head],
  leftArm: [...source.leftArm],
  leftForearm: [...source.leftForearm],
  rightArm: [...source.rightArm],
  rightForearm: [...source.rightForearm],
  leftLeg: [...source.leftLeg],
  leftShin: [...source.leftShin],
  rightLeg: [...source.rightLeg],
  rightShin: [...source.rightShin],
});

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
      pose.leftLeg = [-74, 0, -3]; pose.rightLeg = [-74, 0, 3];
      pose.leftShin = [78, 0, 1]; pose.rightShin = [78, 0, -1];
      break;
    case "双腿打开坐":
    case "双腿分开坐":
      pose.leftLeg = [-70, 0, -19]; pose.rightLeg = [-70, 0, 19];
      pose.leftShin = [74, 0, 5]; pose.rightShin = [74, 0, -5];
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
      pose.torso = [10, 0, 0]; pose.head = [-8, 0, 0];
      pose.leftLeg = [-70, 0, -13]; pose.rightLeg = [-70, 0, 13];
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
      pose.torso = [3, 0, 0]; pose.head = [-3, 0, 0];
      pose.leftLeg = [-74, 0, -7]; pose.rightLeg = [-74, 0, 7];
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
      pose.leftLeg = [-90, 0, -42]; pose.leftShin = [104, 0, -72];
      pose.rightLeg = [-90, 0, 42]; pose.rightShin = [104, 0, 72];
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
  // Each running title needs a different gait phase. Reusing the same pose and
  // only rotating the model made "start", "side run", and "look back" read as
  // the same airborne leap.
  switch (name) {
    case "冲刺起步":
    case "起跑准备":
      return jointPose({
        torso: [55, -5, -3], head: [-38, 6, 2],
        leftArm: [28, 0, -30], leftForearm: [18, 0, 64],
        rightArm: [28, 0, 30], rightForearm: [18, 0, -64],
        leftLeg: [-78, 0, -19], leftShin: [108, 0, 7],
        rightLeg: [-38, 0, 18], rightShin: [68, 0, -5],
      });
    case "侧向奔跑":
      return jointPose({
        torso: [16, 5, -3], head: [-10, -5, 2],
        leftArm: [-22, 0, -52], leftForearm: [2, 0, -118],
        rightArm: [24, 0, 42], rightForearm: [2, 0, -82],
        leftLeg: [42, 0, -17], leftShin: [12, 0, 5],
        rightLeg: [-58, 0, 18], rightShin: [84, 0, -6],
      });
    case "回头奔跑":
      return jointPose({
        torso: [16, 20, -3], head: [-8, 76, 3],
        leftArm: [22, 0, -42], leftForearm: [4, 0, 88],
        rightArm: [-18, 0, 48], rightForearm: [2, 0, 118],
        leftLeg: [-54, 0, -18], leftShin: [78, 0, 6],
        rightLeg: [38, 0, 18], rightShin: [18, 0, -5],
      });
    case "急停姿态":
      return jointPose({
        torso: [32, 10, -5], head: [-20, -8, 3],
        leftArm: [-12, 0, -70], leftForearm: [4, 0, -128],
        rightArm: [-12, 0, 70], rightForearm: [4, 0, 128],
        leftLeg: [-72, 0, -24], leftShin: [98, 0, 7],
        rightLeg: [-26, 0, 24], rightShin: [54, 0, -7],
      });
    case "自然慢跑":
    case "正常跑步":
      return jointPose({
        torso: [12, -4, -2], head: [-8, 5, 1],
        leftArm: [-4, 0, -42], leftForearm: [2, 0, -92],
        rightArm: [16, 0, 38], rightForearm: [2, 0, -78],
        leftLeg: [-42, 0, -15], leftShin: [62, 0, 5],
        rightLeg: [30, 0, 16], rightShin: [10, 0, -4],
      });
    case "全力冲刺":
    default:
      return jointPose({
        torso: [24, -8, -4], head: [-16, 8, 2],
        leftArm: [-24, 0, -54], leftForearm: [2, 0, -122],
        rightArm: [28, 0, 44], rightForearm: [2, 0, -86],
        leftLeg: [-62, 0, -18], leftShin: [84, 0, 6],
        rightLeg: [48, 0, 18], rightShin: [12, 0, -5],
      });
  }
}

function createLyingJointPose(name: string): JointPose {
  const pose = jointPose({
    head: [0, 0, 0],
    leftArm: [0, 0, -24], leftForearm: [0, 0, 8],
    rightArm: [0, 0, 24], rightForearm: [0, 0, -8],
    leftLeg: [-4, 0, -7], leftShin: [3, 0, 1],
    rightLeg: [-4, 0, 7], rightShin: [3, 0, -1],
  });
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
    torso: [0, 0, -2], head: [-14, /回头/.test(name) ? 46 : 10, 0],
    leftArm: [-48, 0, -42], leftForearm: [0, 0, 92],
    rightArm: [-48, 0, 42], rightForearm: [0, 0, -92],
    leftLeg: [3, 0, -7], leftShin: [6, 0, 1],
    rightLeg: [3, 0, 8], rightShin: [6, 0, -1],
  });
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
  if (/坐地后撑|跌坐|跌倒侧撑|倒地支撑|倒地起身|单手撑地起身/.test(name)) {
    const pose = createGroundJointPose(/坐地后撑/.test(name) ? "后仰撑地" : "手撑地面坐");
    if (/侧撑/.test(name)) { pose.torso = [2, 18, 4]; pose.head = [-2, -18, -3]; }
    if (/起身/.test(name)) { pose.torso = [30, 8, -4]; pose.leftLeg = [-70, 0, -18]; pose.rightLeg = [-20, 0, 20]; }
    return pose;
  }
  if (/滑跪/.test(name)) return jointPose({ torso: [18, 0, -4], head: [-10, 0, 2], leftArm: [-18, 0, -58], rightArm: [-18, 0, 58], leftLeg: [-8, 0, -12], leftShin: [98, 0, 5], rightLeg: [10, 0, 12], rightShin: [98, 0, -5] });
  if (/翻滚/.test(name)) return jointPose({ torso: [28, 12, -8], head: [22, -18, 5], leftArm: [-28, 0, -46], leftForearm: [0, 0, 86], rightArm: [-18, 0, 44], rightForearm: [0, 0, -82], leftLeg: [-62, 0, -24], leftShin: [96, 0, 8], rightLeg: [-52, 0, 26], rightShin: [90, 0, -8] });
  const low = /俯卧撑低位|低姿移动/.test(name);
  const crawl = /四点支撑|爬行|熊爬/.test(name);
  return jointPose({
    torso: [low ? -4 : crawl ? 12 : 0, 0, -3], head: [low ? -6 : -14, 0, 2],
    leftArm: [crawl ? -28 : -8, 0, -50], leftForearm: [0, 0, crawl ? 74 : 18],
    rightArm: [crawl ? -12 : -8, 0, 50], rightForearm: [0, 0, crawl ? -48 : -18],
    leftLeg: [crawl ? -48 : 2, 0, -14], leftShin: [crawl ? 88 : 4, 0, 3],
    rightLeg: [crawl ? -18 : 2, 0, 14], rightShin: [crawl ? 58 : 4, 0, -3],
  });
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

function createSemanticJointPose(item: PoseItem, index: number): JointPose {
  const text = `${item.name} ${item.tags.join(" ")}`;
  let pose = cloneJointPose(jointPoses[0]);

  if (item.category === "lying") {
    pose = createLyingJointPose(item.name);
  } else if (item.category === "prone") {
    pose = createProneJointPose(item.name);
  } else if (item.category === "ground") {
    pose = createGroundActionJointPose(item.name);
  } else if (item.category === "sitting") {
    pose = createSeatedJointPose(item.name);
  } else if (item.category === "kneeling") {
    pose = jointPose({ torso: [8, 0, -2], head: [-5, 0, 2], leftArm: [8, 0, -12], leftForearm: [0, 0, 20], rightArm: [8, 0, 12], rightForearm: [0, 0, -20], leftLeg: [-82, 0, -10], leftShin: [92, 0, 4], rightLeg: [2, 0, 12], rightShin: [105, 0, -4] });
    if (/双膝|低头|抬头/.test(text)) {
      pose.leftLeg = [10, 0, -12]; pose.leftShin = [92, 0, 4];
      pose.rightLeg = [10, 0, 12]; pose.rightShin = [92, 0, -4];
    }
    if (/低头/.test(text)) pose.head = [24, 0, 0];
    if (/抬头/.test(text)) pose.head = [-20, 0, 0];
  } else if (item.category === "squatting") {
    pose = jointPose({ torso: [18, 0, -2], head: [-10, 0, 2], leftArm: [18, 0, 28], leftForearm: [8, 0, 55], rightArm: [18, 0, -28], rightForearm: [8, 0, -55], leftLeg: [-65, 0, -18], leftShin: [95, 0, 5], rightLeg: [-65, 0, 18], rightShin: [95, 0, -5] });
    if (/撑膝/.test(text)) {
      pose.leftArm = [38, 0, -28]; pose.leftForearm = [24, 0, 48];
      pose.rightArm = [38, 0, 28]; pose.rightForearm = [24, 0, -48];
    }
  } else if (item.category === "running") {
    pose = createRunningJointPose(item.name);
  } else if (item.category === "walking") {
    pose = cloneJointPose(jointPoses[4]);
    if (index % 2) pose = mirrorJointPose(pose);
    if (/缓慢/.test(text)) { pose.torso = [4, 0, 0]; pose.leftLeg = [-22, 0, -9]; pose.rightLeg = [18, 0, 10]; }
    if (/大步|猫步/.test(text)) { pose.leftLeg = [-48, 0, -14]; pose.rightLeg = [42, 0, 15]; }
    if (/低头/.test(text)) pose.head = [20, 0, 0];
    if (/回头/.test(text)) { pose.torso = [8, 18, -3]; pose.head = [-5, 62, 2]; }
  } else if (item.category === "jumping") {
    pose = createJumpingJointPose(item.name);
  } else if (/落地/.test(text)) {
    pose = cloneJointPose(/超级英雄/.test(text) ? jointPoses[6] : jointPoses[19]);
  } else if (/飞踢|高踢|侧踢|踢球/.test(text)) {
    pose = cloneJointPose(jointPoses[17]);
    if (/高踢/.test(text)) { pose.rightLeg = [-120, 0, 0]; pose.rightShin = [5, 0, 0]; }
  } else if (/出拳|挥拳|蓄力|握拳|拳击|战斗|防御|闪避/.test(text)) {
    if (/出拳|挥拳/.test(text)) {
      pose = jointPose({ torso: [10, -8, -4], head: [-5, 10, 2], leftArm: [-8, 0, -65], leftForearm: [0, 0, -165], rightArm: [-6, 0, 90], rightForearm: [0, 0, 0], leftLeg: [-24, 0, -14], leftShin: [34, 0, 4], rightLeg: [18, 0, 16], rightShin: [-20, 0, -4] });
    } else {
      pose = jointPose({ torso: [8, -5, -3], head: [-4, 8, 2], leftArm: [-10, 0, -65], leftForearm: [0, 0, -165], rightArm: [-10, 0, 65], rightForearm: [0, 0, 165], leftLeg: [-28, 0, -15], leftShin: [38, 0, 4], rightLeg: [22, 0, 16], rightShin: [-24, 0, -4] });
    }
  } else if (/剑|瞄准|持枪/.test(text)) {
    pose = cloneJointPose(/瞄准|持枪/.test(text) ? jointPoses[10] : jointPoses[9]);
  } else if (/投篮|篮球|运球/.test(text)) {
    pose = jointPose({ torso: [8, 5, -4], head: [-8, -5, 2], leftArm: [/投篮/.test(text) ? -58 : 26, 0, -38], leftForearm: [0, 0, 82], rightArm: [/投篮/.test(text) ? -72 : 38, 0, 40], rightForearm: [0, 0, -84], leftLeg: [-32, 0, -12], leftShin: [38, 0, 3], rightLeg: [28, 0, 14], rightShin: [-30, 0, -3] });
  } else if (/挥拍|足球带球/.test(text)) {
    pose = cloneJointPose(/挥拍/.test(text) ? jointPoses[16] : jointPoses[4]);
  } else if (/双手抱胸|手臂交叉|半身双手抱胸/.test(text)) {
    pose = jointPose({ torso: [0, 4, -2], leftArm: [-42, 8, 37], leftForearm: [-18, 0, 55], rightArm: [-18, -8, -37], rightForearm: [8, 0, -55], leftLeg: [0, 0, -7], rightLeg: [0, 0, 7] });
  } else if (/双手背后/.test(text)) {
    pose = jointPose({ leftArm: [18, 10, -28], leftForearm: [0, 0, 74], rightArm: [18, -10, 28], rightForearm: [0, 0, -74], leftLeg: [0, 0, -5], rightLeg: [0, 0, 5] });
  } else if (/叉腰/.test(text)) {
    pose = cloneJointPose(jointPoses[1]);
    if (/双手/.test(text)) { pose.rightArm = [8, 8, 42]; pose.rightForearm = [2, 0, -82]; }
  } else if (/插兜/.test(text)) {
    pose = jointPose({ torso: [0, 3, -5], head: [0, -5, 3], leftArm: [12, 0, -22], leftForearm: [4, 0, 62], rightArm: [/双手/.test(text) ? 12 : 2, 0, /双手/.test(text) ? 22 : 12], rightForearm: [4, 0, /双手/.test(text) ? -62 : -22], leftLeg: [0, 0, -9], rightLeg: [0, 0, 10] });
  } else if (/肩部回望/.test(text)) {
    // The model is turned away by the composition transform; rotate the neck
    // back toward camera so the title reads as an over-shoulder glance rather
    // than a plain rear view.
    pose = jointPose({ torso: [0, -12, -2], head: [0, 78, 4], leftArm: [2, 0, -16], rightArm: [2, 0, 16], leftLeg: [0, 0, -7], rightLeg: [0, 0, 8] });
  } else if (/托腮|扶下巴|扶脸|扶头|摸发|整理头发|扶颈|捧脸|捂脸|捂嘴|遮脸/.test(text)) {
    pose = jointPose({ torso: [3, 7, -4], head: [-8, -12, 6], leftArm: [2, 0, 0], leftForearm: [0, 0, 12], rightArm: [40, 0, 40], rightForearm: [0, 0, 150], leftLeg: [0, 0, -6], rightLeg: [0, 0, 7] });
    if (/双手|捧脸|捂脸|捂嘴|整理头发/.test(text)) {
      pose.leftArm = [-10, 0, -65]; pose.leftForearm = [0, 0, -165];
      pose.rightArm = [-10, 0, 65]; pose.rightForearm = [0, 0, 165];
    }
  } else if (/展示商品|托举|托物|持物|手机展示|举杯|喝水|看手机|打电话|看书|拿相机|拿包|拎包|行李|耳机|手表|配饰|胸前|腰间/.test(text)) {
    const bothHands = /双手|托举|持物|看书|看手机|拿相机/.test(text);
    const handToEar = /耳机|打电话/.test(text);
    pose = jointPose({ torso: [0, 5, -3], head: [/看手机|看书|手表|相机/.test(text) ? 12 : 0, -8, 2], leftArm: bothHands ? [-30, 0, 0] : [2, 0, 0], leftForearm: [0, 0, bothHands ? 120 : 12], rightArm: handToEar ? [-10, 0, 65] : [-30, 0, bothHands ? 0 : 28], rightForearm: [0, 0, handToEar ? 165 : bothHands ? -120 : 112], leftLeg: [0, 0, -7], rightLeg: [0, 0, 8] });
  } else if (/指向/.test(text)) {
    pose = jointPose({ torso: [2, -8, -3], head: [0, 10, 2], leftArm: [2, 0, 0], leftForearm: [0, 0, 12], rightArm: [-6, 0, 90], rightForearm: [0, 0, 0], leftLeg: [0, 0, -6], rightLeg: [0, 0, 7] });
  } else if (/张开双臂|双臂展开|手臂自然展开|T型/.test(text)) {
    pose = cloneJointPose(/T型/.test(text) ? jointPoses[12] : jointPoses[11]);
  } else if (/双手举起|高举|举剑/.test(text)) {
    pose = cloneJointPose(jointPoses[11]);
    pose.leftArm = [-20, 0, -180]; pose.rightArm = [-20, 0, 180];
  } else if (/挥手|招手/.test(text)) {
    pose = jointPose({ torso: [0, -4, 3], head: [0, 10, -2], leftArm: [0, 0, 0], leftForearm: [0, 0, 12], rightArm: [-8, 0, 125], rightForearm: [0, 0, 55], leftLeg: [0, 0, -6], rightLeg: [0, 0, 7] });
  } else if (/鼓掌/.test(text)) {
    pose = jointPose({ leftArm: [-18, 0, -38], leftForearm: [0, 0, 88], rightArm: [-18, 0, 38], rightForearm: [0, 0, -88] });
  } else if (/前倾|俯身|弯腰|趴桌|扶桌/.test(text)) {
    pose = jointPose({ torso: [22, 0, -2], head: [-14, 0, 2], leftArm: [24, 0, -28], leftForearm: [18, 0, 54], rightArm: [24, 0, 28], rightForearm: [18, 0, -54], leftLeg: [-8, 0, -8], rightLeg: [8, 0, 9] });
  } else if (/靠墙|身体靠墙|靠桌|后仰/.test(text)) {
    pose = jointPose({ torso: [-12, 0, 5], head: [6, -8, -4], leftArm: [0, 0, -20], leftForearm: [0, 0, 28], rightArm: [6, 0, 26], rightForearm: [0, 0, -42], leftLeg: [-4, 0, -12], rightLeg: [18, 0, 16], rightShin: [-28, 0, -4] });
  } else if (/扶墙|扶椅|开门|推门|拉门|使用电脑|方向盘/.test(text)) {
    pose = jointPose({ torso: [8, 8, -3], head: [-5, -10, 2], leftArm: [-54, 0, -42], leftForearm: [-10, 0, 24], rightArm: [-48, 0, 46], rightForearm: [-8, 0, -28], leftLeg: [-12, 0, -8], rightLeg: [18, 0, 10] });
  } else if (/单腿支撑|单腿前伸|交叉腿|一腿微曲|S型|胯部侧移|模特|时装|Pose|Lookbook|红毯|街拍|秀场|高冷|慵懒/.test(text)) {
    pose = cloneJointPose(jointPoses[1]);
    pose.leftLeg = [0, 0, -14]; pose.rightLeg = [/前伸/.test(text) ? -22 : 10, 0, 18]; pose.rightShin = [/微曲|慵懒/.test(text) ? -28 : 0, 0, -4];
  } else if (/低头|失落|沉思/.test(text)) {
    pose = jointPose({ torso: [8, 0, 3], head: [22, 0, 0], leftArm: [5, 0, -18], rightArm: [5, 0, 18], leftLeg: [0, 0, -5], rightLeg: [0, 0, 6] });
  } else if (/抬头|昂首|俯视/.test(text)) {
    pose = jointPose({ torso: [-4, 0, 0], head: [/俯视/.test(text) ? 12 : -18, 0, 0], leftArm: [0, 0, -18], rightArm: [0, 0, 18], leftLeg: [0, 0, -7], rightLeg: [0, 0, 8] });
  } else if (/A型/.test(text)) {
    pose = jointPose({ leftArm: [0, 0, -20], rightArm: [0, 0, 20], leftLeg: [0, 0, -16], rightLeg: [0, 0, 16] });
  } else if (/Power|英雄|强势/.test(text)) {
    pose = cloneJointPose(jointPoses[2]);
  }

  if (item.category === "standing") {
    if (/双脚并拢/.test(text)) { pose.leftLeg = [0, 0, -3]; pose.rightLeg = [0, 0, 3]; }
    if (/双脚分开/.test(text)) { pose.leftLeg = [0, 0, -16]; pose.rightLeg = [0, 0, 16]; }
    if (/单腿微屈/.test(text)) { pose.rightLeg = [-12, 0, 13]; pose.rightShin = [-24, 0, -4]; }
    if (/重心左移/.test(text)) { pose.torso = [0, 0, -6]; pose.leftLeg = [0, 0, -12]; pose.rightLeg = [12, 0, 15]; pose.rightShin = [-22, 0, -4]; }
    if (/重心右移/.test(text)) { pose.torso = [0, 0, 6]; pose.leftLeg = [12, 0, -15]; pose.leftShin = [-22, 0, 4]; pose.rightLeg = [0, 0, 12]; }
    if (/前后脚/.test(text)) { pose.leftLeg = [-12, 0, -10]; pose.rightLeg = [14, 0, 11]; }
    if (/交叉腿/.test(text)) { pose.leftLeg = [0, 8, -10]; pose.rightLeg = [-8, -10, 10]; }
    if (/身前交叠/.test(text)) { pose.leftArm = [12, 0, -20]; pose.leftForearm = [2, 0, 58]; pose.rightArm = [12, 0, 20]; pose.rightForearm = [2, 0, -58]; }
    if (/单手举起/.test(text)) { pose.rightArm = [-18, 0, 158]; pose.rightForearm = [0, 0, 14]; }
    if (/侧身/.test(text)) pose.torso = [pose.torso[0], 18, pose.torso[2]];
    if (/背身/.test(text)) pose.head = [pose.head[0], /回头/.test(text) ? 72 : 0, pose.head[2]];
  }

  if (item.category === "leaning") {
    if (/撑墙|撑桌|扶栏杆/.test(text)) {
      const both = /双手/.test(text);
      pose.torso = [18, /侧身/.test(text) ? 12 : 0, -3]; pose.head = [-12, 0, 2];
      pose.leftArm = [-50, 0, -42]; pose.leftForearm = [-8, 0, 24];
      if (both) { pose.rightArm = [-50, 0, 42]; pose.rightForearm = [-8, 0, -24]; }
    } else if (/倚|靠/.test(text)) {
      pose.torso = [-12, /单肩|侧身|侧靠/.test(text) ? 12 : 0, 5]; pose.head = [6, -8, -4];
      pose.leftLeg = [-4, 0, -12]; pose.rightLeg = [18, 0, 16]; pose.rightShin = [-28, 0, -4];
    }
  }

  const variation = (index % 5) - 2;
  if (!/标准正立|双脚并拢|T型|A型/.test(text)) {
    pose.torso = [pose.torso[0], pose.torso[1] + variation * 0.8, pose.torso[2] + variation * 0.45];
    pose.head = [pose.head[0], pose.head[1] - variation * 1.2, pose.head[2]];
  }
  return pose;
}

const poseItemByEngineIndex = new Map(poseItems.map((item) => [item.enginePoseIndex, item]));
const semanticJointPoses: JointPose[] = [];
// Bump this whenever the semantic pose solver changes. It forces both the live
// artboard and the generated covers to discard any pose left by Fast Refresh.
const poseSolverRevision = "pose-library-v2-jump-safe";
poseItems.forEach((item) => {
  semanticJointPoses[item.enginePoseIndex] = createSemanticJointPose(item, item.enginePoseIndex);
});

function getSemanticTransform(item: PoseItem): PoseTransform {
  const text = `${item.name} ${item.tags.join(" ")}`;
  let yRotation = item.previewAngle;
  if (item.name === "侧身站立") yRotation = 30;
  else if (item.name === "回头奔跑") yRotation = -52;
  else if (/回眸|回头|回望/.test(text)) yRotation = item.enginePoseIndex % 2 ? 146 : -146;
  if (/背身|背向|背部|背面/.test(text) && !/回/.test(text)) yRotation = 176;
  if (yRotation === 0 && item.category === "sitting") yRotation = -24;
  if (yRotation === 0 && (item.category === "squatting" || item.category === "kneeling")) yRotation = -22;
  if (yRotation === 0 && item.category === "running") yRotation = -28;

  if (item.category === "lying") {
    const sideAngle = /侧卧/.test(item.name) ? (item.name.startsWith("左") ? -18 : 18) : 0;
    return { rotation: [34, sideAngle, 90], position: [0.76, 1.15, -0.51], scale: /半躺/.test(item.name) ? 102 : 110 };
  }
  if (item.category === "prone") {
    return { rotation: [-34, /回头/.test(item.name) ? 146 : 180, 90], position: [-0.76, 1.15, 0.51], scale: 106 };
  }
  if (item.category === "ground") {
    if (/四点支撑|爬行|熊爬|平板支撑|俯卧撑|翻滚|低姿移动/.test(item.name)) {
      return { rotation: [34, yRotation || -20, 90], position: [0.72, 0.92, -0.5], scale: 104 };
    }
    return { rotation: [0, yRotation || -22, 0], position: [0, /滑跪/.test(item.name) ? -0.64 : -0.54, 0], scale: 102 };
  }

  let yPosition = 0;
  let scale = 100;
  if (item.category === "running") { yPosition = -0.2; scale = 116; }
  if (/起跑准备|冲刺起步/.test(item.name)) { yPosition = -0.54; scale = 114; }
  if (item.category === "jumping") { yPosition = /落地|缓冲/.test(item.name) ? -0.42 : 0.22; scale = 94; }
  if (item.category === "sitting") yPosition = -0.42;
  if (item.category === "squatting") { yPosition = -0.48; scale = 104; }
  if (item.category === "kneeling") { yPosition = -0.62; scale = 102; }
  if (/双臂展开|张开双臂|T型|张腿/.test(text)) scale = Math.min(scale, 92);
  return { rotation: [0, yRotation, 0], position: [0, yPosition, 0], scale };
}

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
    torso: mirrorRotation(source.torso),
    head: mirrorRotation(source.head),
    leftArm: mirrorRotation(source.rightArm),
    leftForearm: mirrorRotation(source.rightForearm),
    rightArm: mirrorRotation(source.leftArm),
    rightForearm: mirrorRotation(source.leftForearm),
    leftLeg: mirrorRotation(source.rightLeg),
    leftShin: mirrorRotation(source.rightShin),
    rightLeg: mirrorRotation(source.leftLeg),
    rightShin: mirrorRotation(source.leftShin),
  });
}

type RigJoint = keyof JointPose;

type RigBinding = {
  root: THREE.Object3D;
  bones: Partial<Record<RigJoint, THREE.Bone>>;
  bonesByName: Map<string, THREE.Bone>;
  restQuaternions: Map<THREE.Bone, THREE.Quaternion>;
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

const rigBoneNames: Record<RigJoint, string> = {
  torso: "spine_01",
  head: "Head",
  // The original procedural mannequin named sides from the viewer's perspective.
  // Quaternius uses anatomical left/right, so the paired limbs are intentionally swapped.
  leftArm: "upperarm_r",
  leftForearm: "lowerarm_r",
  rightArm: "upperarm_l",
  rightForearm: "lowerarm_l",
  leftLeg: "thigh_r",
  leftShin: "calf_r",
  rightLeg: "thigh_l",
  rightShin: "calf_l",
};

const rigJointOrder: RigJoint[] = [
  "torso",
  "head",
  "leftArm",
  "leftForearm",
  "rightArm",
  "rightForearm",
  "leftLeg",
  "leftShin",
  "rightLeg",
  "rightShin",
];

const rigJointRotationLimits: Record<RigJoint, [[number, number], [number, number], [number, number]]> = {
  torso: [[-55, 55], [-50, 50], [-35, 35]],
  head: [[-45, 45], [-85, 85], [-35, 35]],
  leftArm: [[-110, 110], [-60, 60], [-140, 140]],
  leftForearm: [[-60, 60], [-45, 45], [-140, 140]],
  rightArm: [[-110, 110], [-60, 60], [-140, 140]],
  rightForearm: [[-60, 60], [-45, 45], [-140, 140]],
  leftLeg: [[-115, 95], [-50, 50], [-60, 60]],
  leftShin: [[-115, 115], [-25, 25], [-25, 25]],
  rightLeg: [[-115, 95], [-50, 50], [-60, 60]],
  rightShin: [[-115, 115], [-25, 25], [-25, 25]],
};

function getSafeRigJointRotation(joint: RigJoint, source: [number, number, number], safetyFactor: number): [number, number, number] {
  const limits = rigJointRotationLimits[joint];
  return source.map((value, axis) => THREE.MathUtils.clamp(value * safetyFactor, limits[axis][0], limits[axis][1])) as [number, number, number];
}

function createRigBinding(root: THREE.Object3D): RigBinding | null {
  const bonesByName = new Map<string, THREE.Bone>();
  root.traverse((child) => {
    if (child instanceof THREE.Bone) bonesByName.set(child.name, child);
  });

  const bones: Partial<Record<RigJoint, THREE.Bone>> = {};
  rigJointOrder.forEach((joint) => {
    const bone = bonesByName.get(rigBoneNames[joint]);
    if (bone) bones[joint] = bone;
  });
  if (!bones.torso || !bones.head || !bones.leftArm || !bones.rightArm || !bones.leftLeg || !bones.rightLeg) return null;

  const restQuaternions = new Map<THREE.Bone, THREE.Quaternion>();
  bonesByName.forEach((bone) => restQuaternions.set(bone, bone.quaternion.clone()));
  return { root, bones, bonesByName, restQuaternions };
}

function resetRigPose(rig: RigBinding) {
  rig.restQuaternions.forEach((quaternion, bone) => bone.quaternion.copy(quaternion));
  rig.root.updateMatrixWorld(true);
}

function applyRigJointRotation(rig: RigBinding, joint: RigJoint, rotation: [number, number, number]) {
  const bone = rig.bones[joint];
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

function getRigBonePosition(rig: RigBinding, name: string) {
  const bone = rig.bonesByName?.get(name);
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
  } else if (/自然正坐|双腿并拢坐|双手放腿上/.test(name)) {
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
    targets = [{ side: "left", anchor: "head", offset: [0.32, -0.12, 0.27], pole: [0.88, -0.3, 0.5], handDirection: [0, 1, 0.04] }];
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

function applyArmIKTarget(rig: RigBinding, target: ArmIKTarget, safetyFactor: number) {
  const upperArm = rig.bonesByName.get(`upperarm_${target.side === "left" ? "l" : "r"}`);
  const lowerArm = rig.bonesByName.get(`lowerarm_${target.side === "left" ? "l" : "r"}`);
  const hand = rig.bonesByName.get(`hand_${target.side === "left" ? "l" : "r"}`);
  const middleFinger = rig.bonesByName.get(`middle_01_${target.side === "left" ? "l" : "r"}`);
  const leftShoulder = getRigBonePosition(rig, "upperarm_l");
  const rightShoulder = getRigBonePosition(rig, "upperarm_r");
  const head = getRigBonePosition(rig, "Head");
  const chest = getRigBonePosition(rig, "spine_03");
  const pelvis = getRigBonePosition(rig, "pelvis");
  if (!upperArm || !lowerArm || !hand || !leftShoulder || !rightShoulder || !head || !chest || !pelvis) return false;

  const upperRest = rig.restQuaternions.get(upperArm);
  const lowerRest = rig.restQuaternions.get(lowerArm);
  const handRest = rig.restQuaternions.get(hand);
  if (!upperRest || !lowerRest || !handRest) return false;

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
  const shoulderLocal = getRigBonePosition(rig, upperArm.name);
  if (!shoulderLocal) return false;
  const poleLocal = shoulderLocal.clone()
    .addScaledVector(sideAxis, target.pole[0] * shoulderWidth)
    .addScaledVector(upAxis, target.pole[1] * shoulderWidth)
    .addScaledVector(forwardAxis, (target.pole[2] + clearance * 0.5) * shoulderWidth);

  const targetWorld = rig.root.localToWorld(targetLocal.clone());
  const poleWorld = rig.root.localToWorld(poleLocal.clone());
  rig.root.updateMatrixWorld(true);
  const shoulderWorld = upperArm.getWorldPosition(new THREE.Vector3());
  const elbowWorld = lowerArm.getWorldPosition(new THREE.Vector3());
  const handWorld = hand.getWorldPosition(new THREE.Vector3());
  const upperLength = Math.max(shoulderWorld.distanceTo(elbowWorld), 0.001);
  const lowerLength = Math.max(elbowWorld.distanceTo(handWorld), 0.001);
  const reach = targetWorld.clone().sub(shoulderWorld);
  const rawDistance = Math.max(reach.length(), 0.001);
  const minDistance = Math.abs(upperLength - lowerLength) + 0.006;
  const maxDistance = upperLength + lowerLength - 0.006;
  const distance = THREE.MathUtils.clamp(rawDistance, minDistance, maxDistance);
  const direction = reach.normalize();
  const reachableTarget = shoulderWorld.clone().addScaledVector(direction, distance);
  const along = (upperLength * upperLength - lowerLength * lowerLength + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(upperLength * upperLength - along * along, 0));
  const poleDirection = poleWorld.clone().sub(shoulderWorld);
  poleDirection.addScaledVector(direction, -poleDirection.dot(direction));
  if (poleDirection.lengthSq() < 1e-8) poleDirection.copy(forwardAxis).transformDirection(rig.root.matrixWorld);
  poleDirection.normalize();
  const solvedElbow = shoulderWorld.clone().addScaledVector(direction, along).addScaledVector(poleDirection, height);

  aimRigBoneAt(upperArm, lowerArm, solvedElbow, upperRest);
  rig.root.updateMatrixWorld(true);
  aimRigBoneAt(lowerArm, hand, reachableTarget, lowerRest);
  rig.root.updateMatrixWorld(true);
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
  const pelvis = getRigBonePosition(rig, "pelvis");
  const chest = getRigBonePosition(rig, "spine_03");
  const head = getRigBonePosition(rig, "Head");
  const leftShoulder = getRigBonePosition(rig, "upperarm_l");
  const leftElbow = getRigBonePosition(rig, "lowerarm_l");
  const leftHand = getRigBonePosition(rig, "hand_l");
  const rightShoulder = getRigBonePosition(rig, "upperarm_r");
  const rightElbow = getRigBonePosition(rig, "lowerarm_r");
  const rightHand = getRigBonePosition(rig, "hand_r");
  const leftHip = getRigBonePosition(rig, "thigh_l");
  const leftKnee = getRigBonePosition(rig, "calf_l");
  const leftFoot = getRigBonePosition(rig, "foot_l");
  const rightHip = getRigBonePosition(rig, "thigh_r");
  const rightKnee = getRigBonePosition(rig, "calf_r");
  const rightFoot = getRigBonePosition(rig, "foot_r");
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
  if (!profile.allowLegPairContact && sampledSegmentDistance(leftHip, leftKnee, rightHip, rightKnee) < 0.13) return "thigh-thigh";
  if (!profile.allowLegPairContact && sampledSegmentDistance(leftKnee, leftFoot, rightKnee, rightFoot) < 0.11) return "shin-shin";
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
    allowArmPairContact: /抱胸|交叉|鼓掌|捧脸|捂脸|捂嘴|整理头发|持物|托举|看书|看手机|拿相机|蹲|趴卧/.test(safetyText),
    allowHeadContact: /托腮|扶下巴|扶脸|扶头|撑头|摸发|整理头发|扶颈|捧脸|捂脸|捂嘴|遮脸|耳机|打电话|侧躺|趴卧/.test(safetyText),
    allowLegPairContact: /交叉|二郎|并拢|盘腿|抱膝|侧躺|趴卧/.test(safetyText),
    // Targeted hand contacts must still remain outside the torso volume.
    allowTorsoContact: armIKTargets.length === 0 && /抱胸|交叉|持物|托举|看手机|看书|相机|手表|胸前|蹲|撑地|后仰|半躺/.test(safetyText),
  };
  const safetyFactors = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0];
  let fallbackReason: string | null = null;
  for (const safetyFactor of safetyFactors) {
    resetRigPose(rig);
    rigJointOrder.forEach((joint) => {
      const anatomicalSide = joint === "leftArm" || joint === "leftForearm" ? "right" : joint === "rightArm" || joint === "rightForearm" ? "left" : null;
      if (anatomicalSide && ikSides.has(anatomicalSide)) return;
      const rotation = getSafeRigJointRotation(joint, pose[joint], safetyFactor);
      // The supplied character is authored in a T-pose, while PoseBoard presets use
      // relaxed arms as their zero position. Fold that bind-pose offset into shoulders.
      if (joint === "leftArm") rotation[2] += 90;
      if (joint === "rightArm") rotation[2] -= 90;
      applyRigJointRotation(rig, joint, rotation);
    });
    armIKTargets.forEach((target) => applyArmIKTarget(rig, target, safetyFactor));
    rig.root.updateMatrixWorld(true);
    const collision = getRigSelfCollision(rig, collisionProfile);
    if (!collision || safetyFactor === 0) {
      rig.root.userData.poseboardSafetyFactor = safetyFactor;
      rig.root.userData.poseboardCollisionFallbackReason = fallbackReason;
      break;
    }
    fallbackReason = collision;
  }
}

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
    const transform = getSemanticTransform(item);
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
    root.position.set(...transform.position);
    root.rotation.set(...transform.rotation.map(THREE.MathUtils.degToRad) as [number, number, number]);
    root.scale.setScalar(transform.scale / 100);
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
  };
}

type ModelEditState = Pick<EditorState, "pose" | "mirrored" | "position" | "rotation" | "scale" | "visible">;
type ModelListItem = { id: string; name: string };

function getModelEditState(state: EditorState): ModelEditState {
  return {
    pose: state.pose,
    mirrored: state.mirrored,
    position: [...state.position],
    rotation: [...state.rotation],
    scale: state.scale,
    visible: state.visible,
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
  const modelRootRef = useRef<THREE.Group | null>(null);
  const templateModelRef = useRef<THREE.Object3D | null>(null);
  const modelRootsRef = useRef<Record<string, THREE.Group>>({});
  const modelMeshesRef = useRef<Record<string, THREE.Mesh[]>>({});
  const modelRigsRef = useRef<Record<string, RigBinding | null>>({});
  const modelStatesRef = useRef<Record<string, ModelEditState>>({});
  const modelCounterRef = useRef(2);
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
  const [selectedPoseId, setSelectedPoseId] = useState(defaultPose.id);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"library" | "inspector" | null>(null);
  const [toast, setToast] = useState("");
  const [saveState, setSaveState] = useState("已保存 · 刚刚");
  const [aiLoading, setAiLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [modelList, setModelList] = useState<ModelListItem[]>([{ id: "model-1", name: "机器人 01" }]);
  const [selectedModelId, setSelectedModelId] = useState("model-1");
  const [toolMode, setToolMode] = useState<ToolMode>("translate");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("model");
  const [poseThumbnails, setPoseThumbnails] = useState<Record<number, string>>({});
  const [modelInfo, setModelInfo] = useState({ loaded: false, hasSkeleton: false, label: "正在加载 GLB…" });

  const filteredPoses = useMemo(() => {
    const keyword = debouncedQuery.trim().toLowerCase();
    let candidates = poseItems;
    if (quickView === "常用") candidates = candidates.filter((pose) => pose.featured);
    if (quickView === "最近") {
      candidates = recentIds.map((id) => poseItems.find((pose) => pose.id === id)).filter((pose): pose is PoseItem => Boolean(pose));
    }
    if (category === "favorites") candidates = candidates.filter((pose) => favoriteIds.includes(pose.id));
    return candidates.filter((pose) => {
      const searchable = [pose.name, pose.nameEn, ...pose.aliases, ...pose.tags, pose.category, getPoseCategoryLabel(pose.category)].filter(Boolean).join(" ").toLowerCase();
      return (category === "all" || category === "favorites" || pose.category === category)
        && (direction === "any" || pose.direction === direction)
        && (intensity === "any" || pose.intensity === intensity)
        && (hand === "any" || pose.hand.includes(hand))
        && (body === "any" || pose.body.includes(body))
        && (style === "any" || pose.style.includes(style))
        && (!keyword || searchable.includes(keyword));
    });
  }, [body, category, debouncedQuery, direction, favoriteIds, hand, intensity, quickView, recentIds, style]);

  const selectedPose = useMemo(() => poseItems.find((pose) => pose.id === selectedPoseId) ?? defaultPose, [selectedPoseId]);
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
  }, [poseSolverRevision]);

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
  }, [filteredPoses, modelInfo.loaded, poseSolverRevision]);

  useEffect(() => {
    try {
      const favorites = JSON.parse(window.localStorage.getItem("poseboard.favoriteIds") ?? "[]");
      const recent = JSON.parse(window.localStorage.getItem("poseboard.recentIds") ?? "[]");
      const lastSelected = window.localStorage.getItem("poseboard.lastSelectedId");
      if (Array.isArray(favorites)) setFavoriteIds(favorites.filter((id): id is string => typeof id === "string"));
      if (Array.isArray(recent)) setRecentIds(recent.filter((id): id is string => typeof id === "string").slice(0, 20));
      const restoredPose = poseItems.find((pose) => pose.id === lastSelected && pose.status === "ready");
      if (restoredPose) {
        const preset = getSemanticTransform(restoredPose);
        setSelectedPoseId(restoredPose.id);
        setEditor((current) => ({
          ...current,
          pose: restoredPose.enginePoseIndex,
          position: [...preset.position] as [number, number, number],
          rotation: [...preset.rotation] as [number, number, number],
          scale: preset.scale,
        }));
      }
    } finally {
      setPersistenceReady(true);
    }
  }, []);

  useEffect(() => {
    if (!persistenceReady) return;
    window.localStorage.setItem("poseboard.favoriteIds", JSON.stringify(favoriteIds));
    window.localStorage.setItem("poseboard.recentIds", JSON.stringify(recentIds.slice(0, 20)));
    window.localStorage.setItem("poseboard.lastSelectedId", selectedPoseId);
  }, [favoriteIds, persistenceReady, recentIds, selectedPoseId]);

  useEffect(() => {
    editorLatestRef.current = editor;
  }, [editor]);

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
    setSaveState("正在保存…");
    saveTimerRef.current = window.setTimeout(() => setSaveState("已保存 · 刚刚"), 420);
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
    flash("已撤销上一步");
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
    flash("已重做");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobilePanel(null);
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
      flash("当前模型不兼容此 Pose");
      return;
    }
    if (pose.status === "missing") {
      flash("Pose 资源缺失，请稍后重试");
      return;
    }
    const preset = getSemanticTransform(pose);
    commit((current) => ({
      ...current,
      pose: pose.enginePoseIndex,
      mirrored: false,
      position: [...preset.position] as [number, number, number],
      rotation: [...preset.rotation] as [number, number, number],
      scale: preset.scale,
    }));
    setSelectedPoseId(pose.id);
    setRecentIds((ids) => [pose.id, ...ids.filter((id) => id !== pose.id)].slice(0, 20));
    setMobilePanel(null);
    flash(`已应用「${pose.name}」`);
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
    flash(favoriteIds.includes(pose.id) ? `已取消收藏「${pose.name}」` : `已收藏「${pose.name}」`);
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
    setQuery(selectedPose.tags[0] ?? selectedPose.category);
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

  const updateVector = (kind: "position" | "rotation", axis: number, value: number) => {
    commit((current) => {
      const vector = [...current[kind]] as [number, number, number];
      vector[axis] = value;
      return { ...current, [kind]: vector };
    });
  };

  const setLandscapeRatio = (base: "16:9" | "3:2" | "4:3" | "1:1") => {
    commit((current) => ({ ...current, ratio: base }));
    flash(`画幅已切换为 ${base}`);
  };

  const toggleOrientation = () => {
    commit((current) => {
      const ratio: Ratio = current.ratio === "16:9" ? "9:16" : current.ratio === "9:16" ? "16:9" : current.ratio === "3:2" ? "2:3" : current.ratio === "2:3" ? "3:2" : current.ratio === "4:3" ? "3:4" : current.ratio === "3:4" ? "4:3" : "1:1";
      return { ...current, ratio };
    });
    flash("画幅方向已切换");
  };

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
      flash("当前画板最多添加 8 个模型");
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
    flash(`机器人 ${String(sequence).padStart(2, "0")} 已添加`);
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

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
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
    const handleTransformMouseUp = () => flash(transformControls.getMode() === "rotate" ? "模型旋转已更新" : "模型位置已更新");
    transformControls.addEventListener("mouseDown", handleTransformMouseDown);
    transformControls.addEventListener("objectChange", handleTransformChange);
    transformControls.addEventListener("dragging-changed", handleTransformDragging);
    transformControls.addEventListener("mouseUp", handleTransformMouseUp);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x6d7480, 2.2));
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

    const rim = new THREE.DirectionalLight(0xcbd5ff, 2.1);
    rim.position.set(-5, 4, -3);
    scene.add(rim);

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

        const rig = createRigBinding(model);
        const hasSkeleton = Boolean(rig);
        if (!rig) originalMeshes.forEach((mesh) => prepareRigidPoseGeometry(mesh.geometry));

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const fit = 3.45 / Math.max(size.y, 0.001);
        model.scale.setScalar(fit);
        model.position.set(-center.x * fit, -box.min.y * fit, -center.z * fit);
        root.add(model);

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
        setModelInfo({ loaded: true, hasSkeleton, label: hasSkeleton ? "Quaternius Humanoid · 64 骨骼" : "Pose preview · Prototype mapping" });
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
    };
  }, [poseSolverRevision]);

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
    if (rig) applyRigPose(rig, editor.pose, editor.mirrored);
    else deformableMeshesRef.current.forEach((mesh) => applyRigidPose(mesh, editor.pose, editor.mirrored));
    if (viewportRef.current) {
      viewportRef.current.dataset.poseSafety = String(rig?.root.userData.poseboardSafetyFactor ?? 1);
      viewportRef.current.dataset.poseCollision = String(rig?.root.userData.poseboardCollisionFallbackReason ?? "none");
      viewportRef.current.dataset.poseSolverRevision = poseSolverRevision;
    }
    renderer.shadowMap.enabled = editor.shadow;
    camera.fov = editor.fov;
    camera.updateProjectionMatrix();
    scene.background = new THREE.Color(editor.background);
    if (scene.fog instanceof THREE.Fog) scene.fog.color.set(editor.background);
  }, [editor, modelInfo.loaded, selectedModelId, toolMode, poseSolverRevision]);

  const exportPng = async () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const host = viewportRef.current;
    if (!renderer || !scene || !camera || !host || !modelInfo.loaded || exporting) {
      flash(modelInfo.loaded ? "导出暂不可用" : "3D 场景仍在加载");
      return;
    }

    setExporting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 180));

    const oldSize = renderer.getSize(new THREE.Vector2());
    const oldPixelRatio = renderer.getPixelRatio();
    const transformControls = transformControlsRef.current;
    const transformHelper = transformControls?.getHelper();
    const oldTransformHelperVisible = transformHelper?.visible ?? false;

    try {
      const [targetWidth, targetHeight] = ratioSize[editor.ratio];
      if (transformHelper) transformHelper.visible = false;
      renderer.setPixelRatio(1);
      renderer.setSize(targetWidth, targetHeight, false);
      camera.aspect = targetWidth / targetHeight;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);

      const link = document.createElement("a");
      link.href = renderer.domElement.toDataURL("image/png");
      link.download = `poseboard-${selectedPose.name}-${targetWidth}x${targetHeight}.png`;
      link.click();
      flash(`PNG 已按 ${editor.ratio} 画幅导出`);
    } catch {
      flash("PNG 导出失败，请重试");
    } finally {
      renderer.setPixelRatio(oldPixelRatio);
      renderer.setSize(oldSize.x, oldSize.y, false);
      camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      camera.updateProjectionMatrix();
      if (transformHelper) transformHelper.visible = oldTransformHelperVisible;
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
    controlsRef.current?.reset();
    flash("场景已重置");
  };

  const aiSuggestPose = () => {
    if (aiLoading || !modelInfo.loaded) return;
    setAiLoading(true);
    const available = filteredPoses.filter((pose) => pose.status === "ready");
    const nextPose = available[(available.findIndex((pose) => pose.id === selectedPose.id) + 7 + available.length) % Math.max(available.length, 1)] ?? defaultPose;
    window.setTimeout(() => {
      selectPose(nextPose);
      setAiLoading(false);
      flash(`AI 推荐：${nextPose.name}`);
    }, 720);
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
          <span className="brand-name">PoseBoard <b>AI</b></span>
          <span className="file-state" aria-live="polite">{saveState}</span>
        </div>

        <div className="toolbar-center" aria-label="画板工具">
          <div className="segmented" aria-label="画板比例">
            {(["16:9", "3:2", "4:3", "1:1"] as const).map((ratio) => (
              <button key={ratio} className={landscapeRatio === ratio ? "active" : ""} aria-pressed={landscapeRatio === ratio} onClick={() => setLandscapeRatio(ratio)}>{ratio}</button>
            ))}
          </div>
          <button className="icon-button swap-button" onClick={toggleOrientation} title="切换横竖屏" aria-label="切换横竖屏"><ArrowsLeftRight size={18} /></button>
          <span className="toolbar-separator" />
          <button className="reset-scene-button" onClick={resetAll} title="重置整个场景"><ArrowCounterClockwise size={17} /><span>重置场景</span></button>
          <button className="icon-button mobile-only" aria-expanded={mobilePanel === "library"} onClick={() => setMobilePanel(mobilePanel === "library" ? null : "library")} title="姿势库" aria-label="打开姿势库"><SidebarSimple size={19} /></button>
          <button className="icon-button mobile-only" aria-expanded={mobilePanel === "inspector"} onClick={() => setMobilePanel(mobilePanel === "inspector" ? null : "inspector")} title="检查器" aria-label="打开检查器"><SlidersHorizontal size={19} /></button>
        </div>

        <div className="toolbar-right">
          <button className="icon-button" onClick={undo} disabled={!canUndo} title="撤销 ⌘/Ctrl Z" aria-label="撤销"><ArrowCounterClockwise size={18} /></button>
          <button className="icon-button" onClick={redo} disabled={!canRedo} title="重做 ⌘/Ctrl Shift Z" aria-label="重做"><ArrowClockwise size={18} /></button>
          <span className="toolbar-separator" />
          <button className={`ai-button ${aiLoading ? "loading" : ""}`} onClick={aiSuggestPose} disabled={aiLoading || !modelInfo.loaded} aria-busy={aiLoading}><Sparkle size={17} weight="fill" /> {aiLoading ? "分析构图…" : "AI 推荐"}</button>
          <button className={`export-button ${exporting ? "loading" : ""}`} onClick={exportPng} disabled={exporting || !modelInfo.loaded} aria-busy={exporting}><DownloadSimple size={18} weight="bold" /> {exporting ? "导出中…" : "导出 PNG"}</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="panel library-panel" aria-label="Pose Library">
          <div className="library-scroll-header">
            <div className="panel-title-row">
              <div><h2>姿势预设库</h2></div>
              <span className="count">{poseItems.length} poses</span>
            </div>

            <div className="search-field" role="search">
              <span><MagnifyingGlass size={18} /></span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姿势，例如：回头 / 冲刺 / 叉腰" aria-label="搜索姿势" />
              {query && <button className="clear-search" onClick={() => setQuery("")} aria-label="清除搜索" title="清除搜索"><X size={15} /></button>}
            </div>

            <div className="quick-entry" aria-label="快捷入口">
              {(["常用", "最近"] as const).map((item) => (
                <button key={item} className={quickView === item ? "active" : ""} aria-pressed={quickView === item} onClick={() => setQuickView(quickView === item ? null : item)}>
                  {item}{item === "最近" ? ` ${recentIds.length}` : ""}
                </button>
              ))}
              <button className={`filter-toggle ${filtersExpanded ? "active" : ""}`} aria-expanded={filtersExpanded} onClick={() => setFiltersExpanded((value) => !value)} title="展开或收起筛选">
                <FunnelSimple size={15} weight={hasActiveFilters ? "fill" : "regular"} /> 筛选
              </button>
            </div>

            <div className="category-list" role="listbox" aria-label="姿势一级分类">
              {poseCategoryTabs.map((item) => <button key={item.value} className={category === item.value ? "active" : ""} role="option" aria-selected={category === item.value} title={item.english} onClick={() => { setCategory(item.value); setQuickView(null); }}>
                {item.value === "favorites" && <Star size={13} weight={category === "favorites" ? "fill" : "regular"} />}{item.label}{item.value === "favorites" ? ` ${favoriteIds.length}` : ""}
              </button>)}
            </div>

            {filtersExpanded && <div className="pose-filters">
              <FilterChips label="朝向" options={directionOptions} value={direction} onChange={(value) => setDirection(value as PoseDirection | "any")} />
              <FilterChips label="动态程度" options={intensityOptions} value={intensity} onChange={(value) => setIntensity(value as PoseIntensity | "any")} />
              <FilterChips label="手部" options={handOptions} value={hand} onChange={(value) => setHand(value as PoseHand | "any")} />
              <FilterChips label="身体" options={bodyOptions} value={body} onChange={(value) => setBody(value as PoseBody | "any")} />
              <FilterChips label="风格" options={styleOptions} value={style} onChange={(value) => setStyle(value as PoseStyle | "any")} />
            </div>}

            <div className="result-line">
              <strong>{quickView ?? getPoseTabLabel(category)}</strong><span>· {filteredPoses.length}</span>
              {hasActiveFilters && <button onClick={clearPoseFilters}>清空筛选</button>}
            </div>
          </div>

          <div ref={poseGridRef} className="pose-grid" aria-label="姿势结果">
            {filteredPoses.map((pose) => {
              const selected = selectedPose.id === pose.id;
              const favorited = favoriteIds.includes(pose.id);
              const unavailable = pose.status !== "ready";
              return <article key={pose.id} data-pose-index={pose.enginePoseIndex} className={`pose-card ${selected ? "active" : ""} ${unavailable ? "disabled" : ""}`}>
                <button className="pose-card-main" aria-pressed={selected} onClick={() => selectPose(pose)} disabled={unavailable} title={pose.status === "incompatible" ? "当前模型不兼容此 Pose" : pose.status === "missing" ? "Pose 资源缺失" : `应用 ${pose.name}`}>
                  <span className="pose-thumb">
                    {poseThumbnails[pose.enginePoseIndex]
                      ? <img src={poseThumbnails[pose.enginePoseIndex]} alt={`${pose.name} 白膜姿态预览`} loading="lazy" />
                      : <i className="pose-thumb-loading" />}
                    {unavailable && <em>{pose.status === "missing" ? "资源缺失" : "骨骼不兼容"}</em>}
                  </span>
                  <span className="pose-card-body"><strong>{pose.name}</strong><small>{[getPoseCategoryLabel(pose.category), ...pose.tags].slice(0, 3).join(" · ")}</small></span>
                  {selected && <span className="selected-dot"><Check size={14} weight="bold" /></span>}
                </button>
                <div className="pose-card-actions">
                  <button className={favorited ? "favorite active" : "favorite"} onClick={() => toggleFavorite(pose)} aria-label={favorited ? `取消收藏 ${pose.name}` : `收藏 ${pose.name}`} title={favorited ? "取消收藏" : "收藏"}><Star size={15} weight={favorited ? "fill" : "regular"} /></button>
                  <button onClick={() => flash(`Pose ID · ${pose.id}`)} aria-label={`更多 ${pose.name}`} title={`Pose ID · ${pose.id}`}><DotsThree size={17} weight="bold" /></button>
                </div>
              </article>;
            })}

            {!filteredPoses.length && <div className="pose-empty-state">
              <span>{category === "favorites" ? <Star size={20} /> : <MagnifyingGlass size={20} />}</span>
              <strong>{category === "favorites" ? "还没有收藏姿势" : quickView === "最近" ? "还没有最近使用" : "没有匹配的姿势"}</strong>
              <p>{category === "favorites" ? "点击卡片上的星标加入收藏。" : "清空筛选，或从下面的常用 Pose 开始。"}</p>
              <button onClick={clearPoseFilters}>清空筛选</button>
              <div className="empty-recommendations">
                {poseItems.filter((pose) => pose.featured).slice(0, 3).map((pose) => <button key={pose.id} onClick={() => selectPose(pose)}>{pose.name}</button>)}
              </div>
            </div>}
          </div>

          <div className="current-pose-toolbar" aria-label="当前姿势快捷控制">
            <div className="current-pose-meta"><span>当前姿势</span><strong>{selectedPose.name}</strong><small>{getPoseCategoryLabel(selectedPose.category)} · {selectedPose.id}</small></div>
            <div className="current-pose-actions">
              <button className={editor.mirrored ? "active" : ""} onClick={() => { commit((current) => ({ ...current, mirrored: !current.mirrored })); flash(editor.mirrored ? "已恢复原始姿态" : "已镜像骨骼姿态"); }} aria-pressed={editor.mirrored} title="镜像骨骼姿态"><ArrowsLeftRight size={16} /></button>
              <button onClick={() => selectAdjacentPose(-1)} title="上一个"><ArrowLeft size={16} /></button>
              <button onClick={() => selectAdjacentPose(1)} title="下一个"><ArrowRight size={16} /></button>
              <button onClick={selectRandomPose} title="在当前筛选中随机"><Shuffle size={16} /></button>
              <button className={favoriteIds.includes(selectedPose.id) ? "active favorite" : "favorite"} onClick={() => toggleFavorite(selectedPose)} title="收藏当前姿势"><Star size={16} weight={favoriteIds.includes(selectedPose.id) ? "fill" : "regular"} /></button>
              <button onClick={showSimilarPoses} title="查看相似动作"><Sparkle size={16} /></button>
              <button onClick={() => selectPose(defaultPose)} title="恢复自然站立"><ArrowCounterClockwise size={16} /></button>
            </div>
          </div>
        </aside>

        <section className="canvas-area">
          <div className="canvas-header">
            <div className="canvas-meta"><span className={`status-dot ${modelInfo.loaded ? "ready" : ""}`} /><span>{modelInfo.label}</span></div>
            <div className="tool-dock" role="toolbar" aria-label="模型编辑模式">
              <button className={toolMode === "translate" ? "active" : ""} aria-pressed={toolMode === "translate"} onClick={(event) => { event.stopPropagation(); activateTool("translate"); }} title="点击模型后移动"><ArrowsOutCardinal size={16} /> 选择并移动</button>
              <button className={toolMode === "rotate" ? "active" : ""} aria-pressed={toolMode === "rotate"} onClick={(event) => { event.stopPropagation(); activateTool("rotate"); }} title="旋转模型"><ArrowClockwise size={16} /> 旋转</button>
            </div>
            <div className="canvas-actions">
              <button className={editor.grid ? "active" : ""} aria-pressed={editor.grid} onClick={(event) => { event.stopPropagation(); commit((current) => ({ ...current, grid: !current.grid })); flash(editor.grid ? "构图线已关闭" : "构图线已开启"); }} title="构图线" aria-label="切换构图线"><GridFour size={17} /></button>
              <button onClick={(event) => { event.stopPropagation(); controlsRef.current?.reset(); flash("镜头已归位"); }} title="归位镜头" aria-label="归位镜头"><HouseLine size={17} /></button>
            </div>
          </div>

          <div className="canvas-stage">
            <div className="artboard-wrap" style={{ aspectRatio: editor.ratio.replace(":", " / "), width: `${zoomWidth}%` }}>
              <div className="artboard-label"><span /> ARTBOARD · {currentSize[0]} × {currentSize[1]}</div>
              <div className="artboard-shell">
                <div ref={viewportRef} className="three-viewport" />
                {!modelInfo.loaded && <div className="model-loader"><span /><p>{modelInfo.label}</p></div>}
                {editor.grid && <div className="composition-grid"><i /><i /><b /><b /></div>}
                <div className="viewport-hint">
                  {toolMode === "translate" && "选择并移动 · 点击机器人选中，拖动彩色箭头移动"}
                  {toolMode === "rotate" && "旋转模式 · 拖动彩色圆环旋转当前模型"}
                </div>
              </div>
            </div>
          </div>

          <div className="zoom-control">
            <button onClick={() => setZoom((value) => clamp(value - 8, 34, 100))} aria-label="缩小"><Minus size={16} /></button>
            <button className="zoom-value" onClick={() => setZoom(76)} aria-label={`当前缩放 ${zoom}%，点击恢复默认`}>{zoom}%</button>
            <button onClick={() => setZoom((value) => clamp(value + 8, 34, 100))} aria-label="放大"><Plus size={16} /></button>
            <span />
            <button onClick={() => setZoom(76)}>适应</button>
          </div>
        </section>

        <aside className="panel inspector-panel" aria-label="Inspector">
          <div className="selection-header">
            <span className="cube-icon"><Cube size={19} weight="duotone" /></span>
            <div><strong>{selectedModel?.name ?? "机器人模型"}</strong><small>{modelInfo.hasSkeleton ? "Rigged Humanoid" : "Pose Preview · Prototype"}</small></div>
            <button className={editor.visible ? "visible" : ""} onClick={() => { commit((current) => ({ ...current, visible: !current.visible })); flash(editor.visible ? "模型已隐藏" : "模型已显示"); }} aria-label={editor.visible ? "隐藏模型" : "显示模型"}>{editor.visible ? <Eye size={18} /> : <EyeSlash size={18} />}</button>
            <button className="add-model-button" onClick={addModel} disabled={!modelInfo.loaded || modelList.length >= 8} aria-label="添加机器人模型" title="添加机器人模型"><Plus size={18} weight="bold" /></button>
          </div>

          <div className="inspector-tabs" role="tablist" aria-label="属性类型">
            <button className={inspectorTab === "model" ? "active" : ""} role="tab" aria-selected={inspectorTab === "model"} onClick={() => setInspectorTab("model")}>模型</button>
            <button className={inspectorTab === "camera" ? "active" : ""} role="tab" aria-selected={inspectorTab === "camera"} onClick={() => setInspectorTab("camera")}>镜头</button>
            <button className={inspectorTab === "scene" ? "active" : ""} role="tab" aria-selected={inspectorTab === "scene"} onClick={() => setInspectorTab("scene")}>场景</button>
          </div>

          <div className="inspector-content">
            {inspectorTab === "model" && <>
              <div className="model-stack" aria-label="画板模型列表">
                <div className="model-stack-title"><span>画板模型</span><small>{modelList.length} / 8</small></div>
                <div className="model-stack-list">
                  {modelList.map((model) => (
                    <button key={model.id} className={selectedModelId === model.id ? "active" : ""} onClick={() => selectModel(model.id)}>
                      <Cube size={16} weight={selectedModelId === model.id ? "fill" : "regular"} />
                      <span>{model.name}</span>
                      {selectedModelId === model.id && <Check size={14} weight="bold" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="active-tool-card">
                <span>{toolMode === "translate" ? <ArrowsOutCardinal size={18} /> : <ArrowClockwise size={18} />}</span>
                <div><small>当前模式</small><strong>{toolMode === "translate" ? "选择并移动" : "旋转模型"}</strong></div>
              </div>

              <InspectorSection title="模型变换" onReset={() => commit((current) => ({ ...current, position: [0, 0, 0], rotation: [0, 0, 0], scale: 100 }))}>
                <VectorField label="位置" values={editor.position} step={0.05} onChange={(axis, value) => updateVector("position", axis, value)} />
                <VectorField label="旋转" values={editor.rotation} step={1} onChange={(axis, value) => updateVector("rotation", axis, value)} />
                <ControlRow label="缩放"><div className="range-with-value"><input type="range" min="50" max="300" value={editor.scale} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateContinuousEdit((current) => ({ ...current, scale: Number(event.target.value) }))} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label="模型缩放" /><output>{editor.scale}%</output></div></ControlRow>
              </InspectorSection>
            </>}

            {inspectorTab === "camera" && <InspectorSection title="镜头设置" onReset={() => { commit((current) => ({ ...current, fov: 34 })); controlsRef.current?.reset(); }}>
              <ControlRow label="视场角"><div className="range-with-value"><input type="range" min="18" max="70" value={editor.fov} onPointerDown={beginContinuousEdit} onFocus={beginContinuousEdit} onChange={(event) => updateContinuousEdit((current) => ({ ...current, fov: Number(event.target.value) }))} onPointerUp={endContinuousEdit} onBlur={endContinuousEdit} aria-label="相机视场角" /><output>{editor.fov}°</output></div></ControlRow>
              <ControlRow label="投影"><select defaultValue="perspective" aria-label="相机投影"><option value="perspective">透视</option></select></ControlRow>
              <div className="camera-tip"><span><Info size={17} /></span><p>在画板空白区域拖动旋转镜头，滚轮缩放视图。</p></div>
            </InspectorSection>}

            {inspectorTab === "scene" && <>
              <InspectorSection title="场景外观" onReset={() => commit((current) => ({ ...current, background: "#eef0f4", shadow: true }))}>
                <ControlRow label="背景"><label className="color-control"><span>{editor.background.toUpperCase()}</span><input type="color" value={editor.background} onFocus={beginContinuousEdit} onChange={(event) => updateContinuousEdit((current) => ({ ...current, background: event.target.value }))} onBlur={endContinuousEdit} aria-label="场景背景颜色" /></label></ControlRow>
                <ToggleRow label="模型阴影" active={editor.shadow} onClick={() => commit((current) => ({ ...current, shadow: !current.shadow }))} />
              </InspectorSection>
              <div className="model-diagnostics">
                <span className={modelInfo.hasSkeleton ? "ok" : "warn"}>{modelInfo.hasSkeleton ? "HUMANOID V1" : "PROTOTYPE"}</span>
                <p>{modelInfo.hasSkeleton ? "已检测到兼容骨骼，Pose 切换不会重新加载模型。" : "当前白模没有 Skeleton；原型使用 PoseItem 到程序化预览的映射。生产环境需替换为已 Rig 的 humanoid_v1 白模。"}</p>
              </div>
            </>}
          </div>
        </aside>
      </section>

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
      {mobilePanel && <button className="mobile-scrim" onClick={() => setMobilePanel(null)} aria-label="关闭面板" />}
    </main>
  );
}

function FilterChips({ label, options, value, onChange }: { label: string; options: ReadonlyArray<readonly [string, string]>; value: string; onChange: (value: string) => void }) {
  return <div className="filter-row"><span>{label}</span><div>{options.map(([optionLabel, optionValue]) => <button key={optionValue} className={value === optionValue ? "active" : ""} aria-pressed={value === optionValue} onClick={() => onChange(optionValue)}>{optionLabel}</button>)}</div></div>;
}

function InspectorSection({ title, children, onReset }: { title: string; children: React.ReactNode; onReset: () => void }) {
  return <section className="inspector-section"><div className="section-heading"><h3>{title}</h3><button onClick={onReset} title={`重置 ${title}`} aria-label={`重置 ${title}`}><ArrowCounterClockwise size={17} /></button></div>{children}</section>;
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="control-row"><span>{label}</span>{children}</div>;
}

function VectorField({ label, values, step, onChange }: { label: string; values: [number, number, number]; step: number; onChange: (axis: number, value: number) => void }) {
  return <ControlRow label={label}><div className="vector-field">{["X", "Y", "Z"].map((axis, index) => <label key={axis}><span>{axis}</span><input type="number" step={step} value={Number(values[index].toFixed(2))} aria-label={`${label} ${axis}`} onChange={(event) => onChange(index, Number(event.target.value))} /></label>)}</div></ControlRow>;
}

function ToggleRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <div className="toggle-row"><span>{label}</span><button className={`toggle ${active ? "active" : ""}`} onClick={onClick} role="switch" aria-label={`切换${label}`} aria-checked={active}><i /></button></div>;
}
