---
name: PoseBoard 3D Studio 1.0.3
description: Professional Compact PoseBoard workspace governed by the V1.1 component specification and a strict 4px grid.
colors:
  app-background: "#f4f6f8"
  canvas-background: "#e9edf2"
  surface-primary: "#ffffff"
  surface-secondary: "#f8fafc"
  surface-tertiary: "#eef1f5"
  surface-hover: "#f4f6f8"
  border-muted: "#e9edf2"
  border-default: "#dde3ea"
  border-strong: "#c8d1dc"
  text-primary: "#182230"
  text-secondary: "#667085"
  text-tertiary: "#98a2b3"
  primary: "#2684ff"
  primary-hover: "#1672e8"
  primary-pressed: "#125fca"
  primary-soft: "#eaf3ff"
  success: "#169b62"
  warning: "#e28a16"
  danger: "#e5484d"
typography:
  headline:
    fontFamily: "Inter, Noto Sans CJK SC, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Inter, Noto Sans CJK SC, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, Noto Sans CJK SC, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter, Noto Sans CJK SC, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.2
  data:
    fontFamily: "SFMono-Regular, Roboto Mono, IBM Plex Mono, Menlo, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
  caption:
    fontFamily: "Inter, Noto Sans CJK SC, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
rounded:
  xxs: "4px"
  xs: "4px"
  sm: "6px"
  control: "8px"
  compact-card: "9px"
  card: "10px"
  panel: "12px"
  modal: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface-primary}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "40px"
  input:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "40px"
  tool-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.compact-card}"
    padding: "4px"
    height: "56px"
---

# Design System: PoseBoard 3D Studio 1.0.3

## Overview

**Creative North Star: “冷静的舞台工作台”**

PoseBoard is a professional, lightweight instrument around a dominant 3D canvas. The interface should feel quiet and immediately legible: cool whites and pale grays establish structure, while blue appears only where the user can act or where a state is selected. Controls explain the current task without competing with the figure.

The 1.0.3 shell is canvas-first and mode-aware. It uses Fluent 2 React foundations for provider-level buttons, toolbars, and tooltips, then applies PoseBoard's Professional Compact geometry. It consists of a 56px Top Bar, a 64px Tool Rail, one 380px Context Panel, the dominant Canvas, and a 48px full-width Context Action Bar. The panel may collapse or become a left-side overlay; the canvas must always reclaim the released space.

**Key Characteristics:**

- Flat, border-led surfaces with restrained depth.
- Dense but readable desktop controls; labels use task language, not 3D internals.
- One blue primary voice, explicit status text, and mutually exclusive interaction modes.
- Stable frame around a flexible, maximized canvas.

## Colors

The palette is cool and functional. White surfaces sit on pale blue-gray workspace layers; dark navy-gray text supplies contrast; blue signals selection, focus, and primary progress.

### Primary

- **Studio Blue:** Primary buttons, active tools, selected cards, focus, and editable canvas handles. Use its soft tint for selected backgrounds, never as a large decorative field.

### Secondary

- **Success Green:** Saved/ready status dots and affirmative system state.
- **Warning Amber / Danger Red:** Reserved for real warnings, destructive actions, and errors; never use them as category decoration.

### Neutral

- **Cool App Gray:** The workspace outside the artboard.
- **Canvas Gray:** The stage behind the model, distinct from the app background.
- **Paper White / Cool White:** Panels, tool surfaces, buttons, and overlays.
- **Hairline Gray / Strong Gray:** Default separation and high-emphasis outlines.
- **Ink / Secondary Slate / Tertiary Slate:** Primary copy, supporting copy, and metadata respectively.

**The Blue Is State Rule.** Blue must communicate an actionable, selected, focused, or editable state. If everything is blue, the system has lost its hierarchy.

**The Text-Plus-Color Rule.** Saved, current mode, selection, warning, and disabled states need a label, icon, outline, or shape change; color alone is insufficient.

## Typography

**Display and Body Font:** Inter with Noto Sans CJK SC, PingFang SC, Microsoft YaHei, and native sans-serif fallbacks.
**Data Font:** SFMono-Regular with Roboto Mono, IBM Plex Mono, Menlo, and Consolas fallbacks.

The main stack is neutral, compact, and friendly enough for a creative tool. The monospace stack is limited to dimensions, ratios, counts, shortcuts, versions, and other machine-like metadata.

### Hierarchy

- **Panel headline:** 18px/700; panel titles only.
- **Object or dialog title:** 14–16px/650–700; selected object, card, and dialog emphasis.
- **Body/control:** 13–14px/400–650; normal controls and explanatory copy.
- **Label/meta:** 10–12px/400–600; rail labels, status, dimensions, and secondary data.

**The Quiet Type Rule.** Do not introduce oversized display typography, ornamental fonts, or all-caps section systems. Hierarchy comes from weight, spacing, and position.

## Layout

The desktop shell is a fixed frame around a fluid canvas: Top Bar (56px), left Tool Rail (64px), one Context Panel (380px), then a `minmax(0, 1fr)` Canvas. The Context Action Bar is 48px tall and spans the complete workspace bottom. It holds current-result context on the left, quick actions in the middle, and the next primary step on the right.

Use the implemented 4px rhythm and its 8/12/16/20/24px multiples. Panel content normally uses 12–16px horizontal padding; gaps are typically 4–12px. Controls are usually 34–42px high. Preserve whitespace around the artboard so it reads as the work product, not another panel.

Responsive behavior is structural:

- **Below 1440px:** Tool Rail becomes 60px and Context Panel 360px.
- **Below 1280px:** Tool Rail becomes 56px and Context Panel 332px; secondary Top Bar status/version content hides before core actions.
- **Below 1024px:** Context Panel becomes a left-side overlay (up to 340px wide) opened from the rail; canvas remains full-width behind it and a scrim protects mode focus.
- **Below 720px:** Reduce Top Bar metadata, hide nonessential quick actions, and stack dialog grids. Do not miniaturize the canvas to preserve every desktop control.
- **Collapsed panel:** Remove the panel column entirely; expand the canvas immediately while keeping Tool Rail, Top Bar, and Context Action Bar stable.

**The One Panel Rule.** Pose Library or the active tool inspector may occupy the Context Panel, never both. Do not recreate permanent left-and-right inspectors.

**The Canvas Reclaims Space Rule.** Hidden or collapsed UI must not leave reserved columns, blank gutters, or invisible hit targets.

## Elevation & Depth

The default system is flat. Top Bar, Tool Rail, Context Panel, canvas edge, cards, fields, and action bar are separated by 1px borders or tonal steps—not shadows. The artboard may use one low ambient shadow (`0 18px 42px rgba(21, 34, 54, .09)`) so the work surface separates from the stage. Modal dialogs may use stronger elevation (`0 26px 72px rgba(21, 34, 54, .20)`).

**The Flat-by-Default Rule.** Shadows are reserved for an artboard, modal, temporary overlay, or direct manipulation feedback. Do not shadow every card, button, panel, or toolbar.

## Shapes

The form language uses thin, square-edged architecture with gently rounded controls. Most controls use 8px radii; compact metadata uses 4–6px; cards use 12px; overlay panels and dialogs use 14px. Pills are limited to toggles and circular status/handle geometry. Panel-to-canvas boundaries remain straight and unrounded on desktop.

Borders are usually 1px. Selected cards use a clear blue inner outline; focus uses a 2px translucent blue outline with 2px offset. Avoid decorative clipping, blobs, and excessive nested rounded containers.

## Components

### Top Bar

- Fixed 56px white bar with a bottom hairline. Brand/project identity anchors the left; artboard and perspective controls occupy the center; undo/help/export stay on the right.
- Hide secondary metadata responsively before hiding the export or primary workspace controls.

### Tool Rail

- Six task tools—Pose, Models, Camera, Perspective, Lighting, Prompt—use Fluent buttons with Phosphor icons plus a short label. Default is transparent/slate; hover adds white and a neutral border; active uses soft blue, blue text/icon, and a blue-tinted border. Every rail action also exposes a Fluent tooltip and accessible name.
- The bottom collapse control affects only the Context Panel. `activeTool` identifies content; it must not silently activate a 3D controller.

### Context Panel

- Exactly one 332–380px task panel between the Tool Rail and Canvas. Use a 56px title row, hairline section dividers, 16px horizontal padding, and vertical scrolling within the panel rather than the page.
- Pose cards are two-column, flat at hover, and use outline—not lift—to show selection. Advanced controls stay secondary and may be disclosed on demand.
- Pose category controls remain on one horizontal row and scroll without visible scrollbars; they never wrap into a second navigation row.

### Canvas and Artboard

- Canvas gets the largest region. The artboard is centered with visible breathing room, a strong neutral border, subtle ambient shadow, and small dimension metadata above it.
- Canvas HUD controls float at the edges but remain compact. Direct manipulation handles may use group colors, yet blue remains the global selected/editable signal.

### Context Action Bar

- Fixed 48px bar across the workspace bottom. Always state the current result/mode in text. Secondary actions are ghost buttons; the next-step action uses blue text on a soft-blue background so Export remains the only solid primary CTA.
- Follow the workflow direction—Pose → Camera → Export—without turning the bar into a second toolbar full of unrelated commands.

### Buttons, Fields, and States

- Primary buttons are blue with white text and darken on hover. Secondary buttons are white with neutral borders; selected/active variants use soft blue.
- Fields use a cool-white fill, 1px neutral border, and blue focus treatment. Disabled controls use reduced opacity and remain noninteractive.
- `activeTool` and `interactionMode` are separate. Camera browsing, model transform, IK editing, and perspective editing are mutually exclusive; visible UI state and controller state must agree.
- Respect `prefers-reduced-motion`; transitions should be short state feedback, not staged entrance animation.

## Do's and Don'ts

### Do:

- **Do** keep the canvas dominant and let it expand when the Context Panel closes.
- **Do** use borders, tonal surfaces, concise labels, and 4px-based spacing to create hierarchy.
- **Do** reserve blue for primary action, selection, focus, and editable state.
- **Do** expose one current tool and one interaction mode at a time, with text confirmation.
- **Do** preserve keyboard focus visibility, reduced-motion behavior, and non-color state cues.

### Don't:

- **Don't** reintroduce simultaneous permanent left and right panels or generic inspector tabs.
- **Don't** add glassmorphism, broad gradients, decorative backgrounds, thick shadows, or floating cards everywhere.
- **Don't** use large blue areas, multiple competing accent colors, or color-only status communication.
- **Don't** add persistent onboarding bubbles, coach marks, or overlays that occupy the canvas.
- **Don't** expose bone trees, internal field names, or dense expert parameters before task-level presets.
- **Don't** invent unsupported cloud, collaboration, account, testimonial, or usage-statistic UI.
