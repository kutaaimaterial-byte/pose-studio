"use client";

import type { ReactNode } from "react";
import { Button, Toolbar } from "@fluentui/react-components";
import {
  Camera,
  Copy,
  Cube,
  Lightbulb,
  Perspective,
  SidebarSimple,
  Sparkle,
} from "@phosphor-icons/react";

export type ActiveTool = "pose" | "model" | "camera" | "perspective" | "lighting" | "prompt";
export type InteractionMode = "camera-browse" | "model-transform" | "ik-edit" | "perspective-edit";

const toolIcons = {
  pose: Sparkle,
  model: Cube,
  camera: Camera,
  perspective: Perspective,
  lighting: Lightbulb,
  prompt: Copy,
} as const;

export function ToolRail({
  activeTool,
  labels,
  panelOpen,
  onChange,
  onTogglePanel,
}: {
  activeTool: ActiveTool;
  labels: Record<ActiveTool, string>;
  panelOpen: boolean;
  onChange: (tool: ActiveTool) => void;
  onTogglePanel: () => void;
}) {
  return <nav className="tool-rail" aria-label="Workspace tools">
    <div className="tool-rail-list">
      {(Object.keys(toolIcons) as ActiveTool[]).map((tool) => {
        const Icon = toolIcons[tool];
        const selected = activeTool === tool;
        return <button
          type="button"
          key={tool}
          className={selected ? "active" : ""}
          aria-current={selected ? "page" : undefined}
          aria-label={labels[tool]}
          title={labels[tool]}
          onClick={() => onChange(tool)}
        >
          <Icon size={20} weight={selected ? "fill" : "regular"} />
          <span>{labels[tool]}</span>
        </button>;
      })}
    </div>
    <button
      type="button"
      className="tool-rail-collapse"
      aria-label={panelOpen ? "Collapse context panel" : "Open context panel"}
      title={panelOpen ? "Collapse context panel" : "Open context panel"}
      onClick={onTogglePanel}
    >
      <SidebarSimple size={19} weight={panelOpen ? "fill" : "regular"} />
    </button>
  </nav>;
}

export function ContextActionBar({
  label,
  title,
  actions,
  nextLabel,
  onNext,
}: {
  label: string;
  title: string;
  actions: ReactNode;
  nextLabel: string;
  onNext: () => void;
}) {
  return <div className="context-action-bar" aria-label="Current tool actions">
    <div className="context-result">
      <span>{label}</span>
      <strong>{title}</strong>
    </div>
    <Toolbar className="context-quick-actions" aria-label="Context actions">{actions}</Toolbar>
    <Button appearance="subtle" className="next-action" onClick={onNext}>{nextLabel}<span aria-hidden="true">→</span></Button>
  </div>;
}
