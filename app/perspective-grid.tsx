"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";

export type PerspectiveGridMode = "off" | "ground" | "one-point" | "two-point" | "three-point";
export type PerspectiveGridCoordinateMode = "camera-linked" | "independent";
export type PerspectiveGridPlane = "XZ" | "XY" | "YZ";
export type PerspectivePoint = { x: number; y: number };

export type PerspectiveGridState = {
  enabled: boolean;
  mode: PerspectiveGridMode;
  coordinateMode: PerspectiveGridCoordinateMode;
  plane: PerspectiveGridPlane;
  origin: [number, number, number];
  rotation: [number, number, number];
  size: number;
  majorStep: number;
  subdivisions: number;
  opacity: number;
  lineWidth: number;
  majorColor: string;
  minorColor: string;
  horizonY: number;
  vanishingPoints: PerspectivePoint[];
  lock: boolean;
  snapToFeet: boolean;
  includeInExport: boolean;
};

export const initialPerspectiveGrid: PerspectiveGridState = {
  enabled: false,
  mode: "off",
  coordinateMode: "independent",
  plane: "XZ",
  origin: [0, 0, 0],
  rotation: [0, 0, 0],
  size: 20,
  majorStep: 1,
  subdivisions: 5,
  opacity: 0.35,
  lineWidth: 1,
  majorColor: "#6B7280",
  minorColor: "#B8BFCA",
  horizonY: 0.48,
  vanishingPoints: [{ x: 0.5, y: 0.48 }],
  lock: false,
  snapToFeet: true,
  includeInExport: true,
};

const modeDefaults: Record<PerspectiveGridMode, Pick<PerspectiveGridState, "enabled" | "mode" | "horizonY" | "vanishingPoints">> = {
  off: { enabled: false, mode: "off", horizonY: 0.48, vanishingPoints: [{ x: 0.5, y: 0.48 }] },
  ground: { enabled: true, mode: "ground", horizonY: 0.48, vanishingPoints: [{ x: 0.5, y: 0.48 }] },
  "one-point": { enabled: true, mode: "one-point", horizonY: 0.48, vanishingPoints: [{ x: 0.5, y: 0.48 }] },
  "two-point": { enabled: true, mode: "two-point", horizonY: 0.48, vanishingPoints: [{ x: -0.28, y: 0.48 }, { x: 1.28, y: 0.48 }] },
  "three-point": { enabled: true, mode: "three-point", horizonY: 0.58, vanishingPoints: [{ x: -0.28, y: 0.58 }, { x: 1.28, y: 0.58 }, { x: 0.5, y: -0.52 }] },
};

export function perspectiveDefaultsForMode(mode: PerspectiveGridMode, current: PerspectiveGridState = initialPerspectiveGrid): PerspectiveGridState {
  const defaults = modeDefaults[mode];
  return {
    ...current,
    ...defaults,
    vanishingPoints: defaults.vanishingPoints.map((point) => ({ ...point })),
  };
}

export function clonePerspectiveGrid(state: PerspectiveGridState): PerspectiveGridState {
  return {
    ...state,
    origin: [...state.origin],
    rotation: [...state.rotation],
    vanishingPoints: state.vanishingPoints.map((point) => ({ ...point })),
  };
}

export function normalizePerspectiveGrid(value: unknown): PerspectiveGridState {
  if (!value || typeof value !== "object") return clonePerspectiveGrid(initialPerspectiveGrid);
  const raw = value as Partial<PerspectiveGridState>;
  const mode = ["off", "ground", "one-point", "two-point", "three-point"].includes(raw.mode ?? "") ? raw.mode as PerspectiveGridMode : "off";
  const base = perspectiveDefaultsForMode(mode);
  const numericTuple = (candidate: unknown, fallback: [number, number, number]) => (
    Array.isArray(candidate) && candidate.length === 3 && candidate.every((part) => typeof part === "number" && Number.isFinite(part))
      ? [...candidate] as [number, number, number]
      : [...fallback] as [number, number, number]
  );
  const points = Array.isArray(raw.vanishingPoints)
    ? raw.vanishingPoints.flatMap((point) => point && typeof point.x === "number" && typeof point.y === "number" ? [{ x: point.x, y: point.y }] : [])
    : base.vanishingPoints;
  return {
    ...base,
    enabled: mode !== "off",
    coordinateMode: raw.coordinateMode === "camera-linked" ? "camera-linked" : "independent",
    plane: raw.plane === "XY" || raw.plane === "YZ" ? raw.plane : "XZ",
    origin: numericTuple(raw.origin, base.origin),
    rotation: numericTuple(raw.rotation, base.rotation),
    size: clampNumber(raw.size, 6, 50, base.size),
    majorStep: clampNumber(raw.majorStep, 0.25, 5, base.majorStep),
    subdivisions: Math.round(clampNumber(raw.subdivisions, 1, 10, base.subdivisions)),
    opacity: clampNumber(raw.opacity, 0.08, 0.8, base.opacity),
    lineWidth: clampNumber(raw.lineWidth, 0.5, 3, base.lineWidth),
    majorColor: validColor(raw.majorColor, base.majorColor),
    minorColor: validColor(raw.minorColor, base.minorColor),
    horizonY: clampNumber(raw.horizonY, 0.04, 0.96, base.horizonY),
    vanishingPoints: points.length ? points.slice(0, 3) : base.vanishingPoints.map((point) => ({ ...point })),
    lock: Boolean(raw.lock),
    snapToFeet: raw.snapToFeet !== false,
    includeInExport: raw.includeInExport !== false,
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function validColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.LineSegments)) return;
    child.geometry.dispose();
    if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
    else child.material.dispose();
  });
}

export function rebuildGroundGrid(group: THREE.Group, state: PerspectiveGridState) {
  const oldChildren = [...group.children];
  oldChildren.forEach((child) => {
    group.remove(child);
    disposeObject(child);
  });
  group.visible = state.enabled && state.mode === "ground";
  if (!group.visible) return;

  const divisions = Math.min(120, Math.max(4, Math.round((state.size / state.majorStep) * state.subdivisions)));
  const half = state.size / 2;
  const step = state.size / divisions;
  const major: number[] = [];
  const minor: number[] = [];
  for (let index = 0; index <= divisions; index += 1) {
    const position = -half + index * step;
    const destination = index % state.subdivisions === 0 ? major : minor;
    destination.push(-half, 0, position, half, 0, position);
    destination.push(position, 0, -half, position, 0, half);
  }
  const addLines = (positions: number[], color: string, opacity: number) => {
    if (!positions.length) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false });
    const lines = new THREE.LineSegments(geometry, material);
    lines.renderOrder = -2;
    group.add(lines);
  };
  addLines(minor, state.minorColor, state.opacity * 0.58);
  addLines(major, state.majorColor, Math.min(0.9, state.opacity * 1.28));

  const planeRotation: Record<PerspectiveGridPlane, [number, number, number]> = {
    XZ: [0, 0, 0],
    XY: [Math.PI / 2, 0, 0],
    YZ: [0, 0, Math.PI / 2],
  };
  const base = planeRotation[state.plane];
  group.rotation.set(
    base[0] + THREE.MathUtils.degToRad(state.rotation[0]),
    base[1] + THREE.MathUtils.degToRad(state.rotation[1]),
    base[2] + THREE.MathUtils.degToRad(state.rotation[2]),
  );
}

type Segment = { x1: number; y1: number; x2: number; y2: number; major: boolean };

function perspectiveSegments(state: PerspectiveGridState): Segment[] {
  if (!state.enabled || state.mode === "off" || state.mode === "ground") return [];
  const segments: Segment[] = [{ x1: -0.25, y1: state.horizonY, x2: 1.25, y2: state.horizonY, major: true }];
  const groundAnchors = Array.from({ length: 13 }, (_, index) => -0.08 + index * (1.16 / 12));
  state.vanishingPoints.slice(0, state.mode === "one-point" ? 1 : 2).forEach((point) => {
    groundAnchors.forEach((anchor, index) => segments.push({ x1: point.x, y1: point.y, x2: anchor, y2: 1.08, major: index % 3 === 0 }));
  });
  if (state.mode === "one-point") {
    for (let index = 1; index <= 8; index += 1) {
      const depth = index / 9;
      const y = state.horizonY + (1.04 - state.horizonY) * Math.pow(depth, 1.72);
      segments.push({ x1: -0.08, y1: y, x2: 1.08, y2: y, major: index % 2 === 0 });
    }
  }
  if (state.mode === "three-point" && state.vanishingPoints[2]) {
    const vertical = state.vanishingPoints[2];
    groundAnchors.forEach((anchor, index) => segments.push({ x1: vertical.x, y1: vertical.y, x2: anchor, y2: 1.08, major: index % 3 === 0 }));
  }
  return segments;
}

export function drawPerspectiveOverlay(context: CanvasRenderingContext2D, width: number, height: number, state: PerspectiveGridState) {
  const segments = perspectiveSegments(state);
  context.save();
  context.lineCap = "round";
  for (const segment of segments) {
    context.beginPath();
    context.moveTo(segment.x1 * width, segment.y1 * height);
    context.lineTo(segment.x2 * width, segment.y2 * height);
    context.strokeStyle = segment.major ? state.majorColor : state.minorColor;
    context.globalAlpha = state.opacity * (segment.major ? 1 : 0.66);
    context.lineWidth = state.lineWidth * (segment.major ? 1.18 : 0.76);
    context.stroke();
  }
  context.restore();
}

export function cameraLinkedPerspective(camera: THREE.PerspectiveCamera, target: THREE.Vector3, mode: PerspectiveGridMode) {
  const projectDirection = (direction: THREE.Vector3) => {
    const projected = target.clone().addScaledVector(direction, 1000).project(camera);
    return { x: (projected.x + 1) / 2, y: (1 - projected.y) / 2 };
  };
  if (mode === "one-point") {
    const forward = camera.getWorldDirection(new THREE.Vector3());
    return { horizonY: 0.5, vanishingPoints: [projectDirection(forward)] };
  }
  const horizontal = [projectDirection(new THREE.Vector3(1, 0, 0)), projectDirection(new THREE.Vector3(0, 0, 1))];
  const horizonY = Math.min(0.94, Math.max(0.06, (horizontal[0].y + horizontal[1].y) / 2));
  horizontal.forEach((point) => { point.y = horizonY; });
  if (mode === "three-point") horizontal.push(projectDirection(new THREE.Vector3(0, 1, 0)));
  return { horizonY, vanishingPoints: horizontal };
}

export function PerspectiveGridOverlay({
  state,
  editable = true,
  label,
  horizonLabel,
  vanishingPointLabel,
  onDragStart,
}: {
  state: PerspectiveGridState;
  editable?: boolean;
  label: string;
  horizonLabel: string;
  vanishingPointLabel: string;
  onDragStart: (handle: "horizon" | number, event: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  const segments = perspectiveSegments(state);
  if (!segments.length) return null;
  return <div className={`perspective-grid-overlay ${state.lock ? "locked" : ""} ${editable ? "editable" : "view-only"}`} aria-label={label}>
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
      {segments.map((segment, index) => <line
        key={`${segment.x1}-${segment.y1}-${index}`}
        x1={segment.x1 * 1000}
        y1={segment.y1 * 1000}
        x2={segment.x2 * 1000}
        y2={segment.y2 * 1000}
        stroke={segment.major ? state.majorColor : state.minorColor}
        strokeOpacity={state.opacity * (segment.major ? 1 : 0.66)}
        strokeWidth={state.lineWidth * (segment.major ? 1.18 : 0.76)}
        vectorEffect="non-scaling-stroke"
      />)}
    </svg>
    {editable && <button
      className="perspective-horizon-handle"
      style={{ top: `${state.horizonY * 100}%` }}
      onPointerDown={(event) => onDragStart("horizon", event)}
      disabled={state.lock}
      aria-label={horizonLabel}
      title={horizonLabel}
    />}
    {editable && state.vanishingPoints.slice(0, state.mode === "one-point" ? 1 : state.mode === "two-point" ? 2 : 3).map((point, index) => <button
      key={index}
      className={`perspective-point-handle point-${index + 1}`}
      style={{ left: `${Math.min(0.98, Math.max(0.02, point.x)) * 100}%`, top: `${Math.min(0.98, Math.max(0.02, point.y)) * 100}%` }}
      onPointerDown={(event) => onDragStart(index, event)}
      disabled={state.lock}
      aria-label={`${vanishingPointLabel} ${index + 1}`}
      title={`${vanishingPointLabel} ${index + 1}`}
    ><span>{index + 1}</span></button>)}
  </div>;
}
