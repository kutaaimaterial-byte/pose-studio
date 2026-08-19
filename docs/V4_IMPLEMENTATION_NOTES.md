# PoseBoard V4.0 implementation baseline

## Current stack

- vinext 1.0 beta, React 19, TypeScript and Vite 8.
- Three.js 0.180 with GLTFLoader, SkeletonUtils, OrbitControls and TransformControls.
- Local React state and refs; project, favorites, recents and saved poses use `localStorage`.
- Cloudflare Sites-compatible build and hosting configuration.

## Relevant files

- `app/page.tsx`: scene lifecycle, pose engine integration, history, persistence, export and current workspace UI.
- `app/globals.css`: all workspace and dialog styling.
- `app/pose-data.ts`: pose catalog and searchable metadata.
- `app/prompt-to-pose.ts`: deterministic local prompt matching and semantic modifiers.
- `app/perspective-grid.tsx`: ground grid and one/two/three-point overlay behavior.
- `tests/rendered-html.test.mjs`: server-rendered shell regression checks.

## State dependencies before V4 migration

- `toolMode` controls TransformControls and IK handle visibility.
- `inspectorTab` determines model, camera or scene content independently of the canvas tool.
- `EditorState` stores serializable pose, model transform, camera, lighting and perspective fields.
- Three.js objects remain in refs and are not persisted.
- Undo/redo stores cloned `EditorState` snapshots; continuous edits commit one snapshot.

## Core issues

1. The shell reserves a large pose panel and a large inspector at the same time, reducing canvas space.
2. Tool navigation and interaction mode are coupled, so the UI does not clearly distinguish browsing from editing.
3. Camera, perspective and lighting controls are grouped behind a generic inspector rather than task-level tools.
4. Export is immediate and repeated inside perspective controls instead of using one global decision point.
5. The page component is very large, so this migration keeps 3D internals stable and extracts durable workspace types first.

## Migration sequence

1. Introduce `ActiveTool` and `InteractionMode`, then route all controller visibility through one mode.
2. Replace the three-column shell with Top Bar, Tool Rail, one Context Panel, Canvas and Context Action Bar.
3. Move existing Pose, Model, Camera, Perspective, Lighting and Prompt controls into tool-specific contexts.
4. Add one export dialog and canvas HUD controls.
5. Verify keyboard behavior, persistence, responsive widths, build and rendered HTML.

## Preserved behavior

- Existing GLTF scene setup and model resources.
- Pose selection, mirror, favorites, recents and saved custom poses.
- IK target manipulation and limb color groups.
- Character copy, paste and delete shortcuts.
- Uploaded image layers including lock, move, opacity and delete.
- Camera and lighting presets, perspective grids, PNG export and project/prompt export.

## Risks and rollback

- Main risk: UI state changes accidentally leave Three.js controls active. Verification checks DOM visibility plus controller `.enabled` state.
- Main risk: shell resize changes camera intent. The renderer ResizeObserver remains unchanged.
- Rollback is branch-scoped: branch `1.0.2` remains the previous UI, while `1.0.3` contains the V4 shell migration.
