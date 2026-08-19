# PoseBoard 3D Studio

PoseBoard is a canvas-first 3D posing workspace for illustrators, storyboard artists and AI image creators. Version `1.0.3` introduces the V4 workstation UI: a compact global header, a dedicated tool rail, one contextual panel at a time and a larger uninterrupted artboard.

## Version branches

- `1.0.3`: current V4 UI/UX redesign.
- `1.0.2`: previous interaction UI baseline and rollback branch.
- `1.0.1`: perspective-grid release.

## Run locally

Requirements: Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000/`.

## Verify

```bash
npm run lint
npm run build
npm test
```

## V4 workspace

- Global Top Bar for project name, canvas ratio, undo/redo, help and export.
- Tool Rail for Pose, Models, Camera, Perspective, Lighting and Prompt.
- One contextual panel that can be collapsed to expand the canvas.
- Explicit interaction modes: camera browse, model transform, IK pose edit and perspective edit.
- Context Action Bar for the selected tool's most useful actions.
- Responsive layouts verified at 1440, 1280 and 1024 pixels with no horizontal overflow.

Existing production capabilities remain available: pose browsing and local prompt matching, per-limb IK controls, character duplication/deletion, locked image layers, perspective grids, camera and lighting presets, saved custom poses, PNG exports and project JSON export.

## Keyboard shortcuts

- `Esc`: return to camera browsing or close the top dialog.
- `F`: fit the selected character.
- `Shift + F`: fit the artboard.
- `M`: mirror the current pose.
- `G`: toggle the perspective grid.
- `Command/Ctrl + C`: copy the selected character.
- `Command/Ctrl + V`: paste the copied character.
- `Delete` / `Backspace`: delete the selected character or image layer.

## Persistence and project format

Project name, workspace preferences, favorite/recent poses, saved custom poses, character state and image-layer metadata are stored in browser `localStorage`. Project JSON exported by V4 carries `schemaVersion: "4.0"` and `appVersion: "1.0.3"`.

Uploaded image pixels are kept in the current browser session/local browser storage; they are not uploaded to an external service by the app.

## Architecture

- `app/page.tsx`: Three.js scene lifecycle, pose engine, history, persistence and tool contexts.
- `app/workspace-ui.tsx`: durable V4 tool-rail and action-bar primitives.
- `app/perspective-grid.tsx`: perspective grid overlay and edit handles.
- `app/globals.css`: design tokens and responsive workstation layout.
- `app/pose-data.ts`: searchable pose catalog.
- `app/prompt-to-pose.ts`: deterministic local prompt matching.
- `tests/rendered-html.test.mjs`: rendered shell and responsive contract checks.
- `PRODUCT.md` / `DESIGN.md`: product truth and visual-system guidance.

## Release and rollback

The production build is deployed from the release branch after lint, build, rendered-shell tests and browser screenshots pass. Roll back the V4 UI by redeploying the tracked `1.0.2` branch; project JSON remains versioned so migrations can be handled explicitly.

See `docs/V4_IMPLEMENTATION_NOTES.md` and `docs/RELEASE_1.0.3.md` for migration and verification details.
