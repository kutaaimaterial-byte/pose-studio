---
name: PoseBoard project home and workspace
description: Scoped Precision Light extension around the existing editor.
colors:
  primary: "#246bfd"
  primary-hover: "#1759d8"
  primary-soft: "#eaf1ff"
  app-background: "#f5f7fa"
  surface-primary: "#fff"
  surface-secondary: "#f8fafc"
  border-default: "#dce3ec"
  text-primary: "#182230"
  text-secondary: "#64748b"
  error-background: "#fff1ef"
  error-border: "#f4b4ab"
  error-text: "#912018"
typography:
  headline: { fontSize: "28px", fontWeight: 700 }
  title: { fontSize: "18px" }
  body: { fontFamily: "Inter, PingFang SC, Microsoft YaHei, sans-serif", fontSize: "14px" }
  metadata: { fontSize: "12px" }
rounded:
  compact: "6px"
  upload: "7px"
  control: "8px"
  card: "10px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  search-input: { backgroundColor: "{colors.surface-secondary}", rounded: "{rounded.control}", padding: "0 14px", height: "40px", width: "280px" }
  import-action: { backgroundColor: "{colors.surface-primary}", rounded: "{rounded.upload}", padding: "10px 14px" }
  template-card: { backgroundColor: "{colors.surface-primary}", rounded: "{rounded.card}", padding: "20px" }
  page-switcher: { backgroundColor: "{colors.surface-secondary}", textColor: "{colors.text-primary}", rounded: "{rounded.compact}", height: "32px" }
  recovery-banner: { backgroundColor: "{colors.error-background}", textColor: "{colors.error-text}", rounded: "{rounded.control}", padding: "12px 16px" }
---

# Design System: PoseBoard project home and workspace

## Overview

**Creative North Star: “冷静的舞台工作台”**

This additive, surface-scoped reference extends the incumbent Precision Light identity. It documents the project home and multi-page wrapper in `app/page.tsx` and `app/project-workspace.css`, not a replacement editor or a new brand. Root `DESIGN.md` remains authoritative for the retained studio; this file records only the wrapper's observed values and behavior.

**Key Characteristics:**

- Flat white surfaces, cool-gray structure, and functional blue state.
- Explicit project → page → shared-content hierarchy around the existing editor.
- Compact controls, visible local-save status, and recoverable failures.

## Colors

Studio Blue identifies primary actions, focus and template entry icons; soft blue distinguishes continuation and selected controls. White surfaces and hairline gray borders establish structure. Ink and slate carry primary and supporting copy. Red is reserved for the recovery banner and failed-save state. Existing subtle cover variants remain functional fallbacks; do not expand them into a new accent system.

## Typography

Keep the pinned Inter stack with the implemented Chinese fallbacks. Home headings use the headline role; section headings use the title role, project-card names use 17px, template names 16px, controls 14px, and timestamps/save status 12px. At 720px and below the home heading becomes 24px. Project names are user data, not display typography.

## Layout

Home uses a scrollable viewport, a 76px white header and a centered 1300px content maximum with 36px side padding. Templates form four columns; project cards form three. At 1100px and below both become two columns. At 720px and below search takes its own header row, content side padding becomes 16px, and projects form one column; templates retain two columns.

The recent-project row keeps its text container shrinkable and wraps the name anywhere. At 720px and below the text takes a full row and the actions wrap below it. Ordinary project-card names also wrap; compact page navigation and workspace-header names use ellipsis.

Workspace uses a 48px project header over a full-width flexible editor. Project identity and local-save state live in the outer header. Page switching, adding and management are consolidated into a compact 32px header control; there is no permanent page rail. The inner studio keeps its existing tools, canvas and timeline.

## Elevation & Depth

Cards and the workspace frame stay flat with 1px borders. Only temporary menus add the observed shadow (`0 8px 24px #1822301c`). Reuse existing Fluent dialogs; do not introduce lifted cards or decorative motion.

## Shapes

Use the observed compact-to-card radius steps for controls, menus, the page switcher and project cards. Desktop header boundaries are straight. Card covers preserve user-image aspect with `object-fit: contain`; absent covers use a task icon and template label, not generated catalog art.

## Components

- **Search and upload:** Search is a labeled cool-white field. Import and change-cover labels retain a keyboard-focusable file input; `:focus-within` puts the blue 2px outline with 3px offset on the visible label. All other wrapper controls use matching `:focus-visible` treatment.
- **Templates and projects:** Template cards use a blue border on hover. Project cards expose name, template, page count and timestamp; separate menus hold management actions. Grid/list and library/trash controls expose pressed state.
- **Recent project:** Soft-blue continuation area with a fully wrapping name, page count, last-opened text and continuation/management actions; never truncate its name to protect buttons.
- **Page navigation:** A compact header selector switches pages. Its adjacent plus adds a linked view, while the overflow menu exposes rename, independent-copy, ordering and deletion. It must remain visually subordinate to editor tools.
- **Recovery:** The runtime error banner is fixed 20px from the bottom and sides, above the workspace, with `role="alert"`, a 45dvh maximum and scrolling. Active work offers retry-save, export-current-project and dismiss; the home variant offers retry and local-backup export. Actions wrap on narrow screens. The initial storage-loading error remains an inline alert.

## Do's and Don'ts

- **Do** preserve the incumbent editor and the project/page/shared-content hierarchy.
- **Do** keep local-save language, wrapping recent names, visible upload focus and reachable recovery actions.
- **Don't** change the pinned Inter/blue-white identity or overwrite the root design reference.
- **Don't** add unsupported cloud/account claims, catalog art, decorative motion or new accent systems.
