# PoseBoard 1.0.3 release record

## Scope

This release implements the V4 UI/UX redesign described in `PoseBoard_UIUX_Redesign_PRD_V4.0_Codex.md` while preserving the established Three.js scene, pose engine and local project behaviors.

## Delivered

- Canvas-first shell: Top Bar, Tool Rail, one Context Panel, Canvas and Context Action Bar.
- Explicit tool and interaction-mode state with predictable controller visibility.
- Task-specific Pose, Models, Camera, Perspective, Lighting and Prompt contexts.
- Global export dialog for clean, perspective-grid and transparent PNG output, plus project JSON.
- Collapsible context panel and responsive desktop/tablet breakpoints.
- Versioned local project export (`schemaVersion 4.0`, `appVersion 1.0.3`).
- Shortcut help plus Fit Character, Fit Artboard, Mirror and Perspective Grid shortcuts.

## Verification

- ESLint: passed.
- vinext production build: passed.
- Rendered HTML tests: 2 passed, 0 failed.
- Responsive browser QA: 1440, 1280 and 1024 px, zero horizontal overflow.
- Tool-mode QA: browsing, model transform, IK editing and perspective editing.
- Perspective edit handles disappear after leaving edit mode while view-only grid lines remain.
- Export choices and context-panel collapse verified in-browser.

Reference screenshots are stored in `.impeccable/review/`.

## Known follow-ups

- `app/page.tsx` still owns most scene and feature orchestration. V4 extracts reusable workspace primitives, but further feature work should continue splitting tool-specific panels and Three.js services without changing behavior.
- The browser bundle still reports a large-chunk warning because Three.js and the pose workspace load together; route-level or feature-level lazy loading is a later performance task.
- Prompt-to-pose matching remains deterministic and local; cloud AI generation is outside this release.

## Rollback

Branch `1.0.2` is the stable pre-redesign rollback point. Deploy that branch to restore the previous interaction UI.
