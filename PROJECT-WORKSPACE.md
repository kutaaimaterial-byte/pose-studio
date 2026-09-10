# Project workspace implementation

## Ownership and storage

- `Project` owns ordered pages and content records. `Page.contentId` links an editor view to content. Content keeps the existing editor's serialized format; this release does not replace the pose/animation engine.
- IndexedDB `poseboard-projects`, version 1: `projects`, `meta`, `backups`. The migration marker and original payload backup use `migration-v1` and `legacy-v1`.
- All editor storage goes through an `EditorBridge`. The only shared browser preferences are the last new-project aspect ratio and legacy migration source.
- Project writes compare revisions within a single read/write transaction. An old window cannot overwrite a newer revision.
- Independent content copies remap instance IDs and exact references together. Linked views deliberately keep the same content ID. Page deletion does not garbage-collect content.

## User-facing behavior

- Four templates: 景别与构图, 剧情分镜, 人物姿态, 自由项目.
- A story project initially links Stage, Storyboard and Animation pages. Other templates use one appropriate page and can add further views.
- Stage presets remain in the existing 舞台 inspector. Storyboard pages default to readable, automatically ordered shot cards. Animation pages default to the existing timeline. Pose pages start without a timeline.
- Per-page state includes active shot, camera, aspect, playhead, zoom, tool, inspector visibility and timeline/card view. Newer shared content takes precedence over stale page camera state. Restored playback is paused. Page switching, adding and management live in the compact workspace header so the editor keeps the full available width; no permanent project-page rail is shown.
- Home supports search, list/grid, recent continuation, rename, cover image, duplicate, portable export/import, trash, restore and confirmed permanent deletion.
- Saving is local to the current browser. Removing browser data removes these projects; export files are the portable backup. This is not cross-device sync or collaboration.

## Verification

Unit tests cover template references, ownership rejection, independent copies, identifier rewriting, credential isolation and confirmed covers. Existing engine/timeline/preset regression tests remain in place; their editor source target moved from `app/page.tsx` to `app/studio-editor.tsx`.

Isolated browser checks exercise template creation, generated dialogue shots shared with the timeline, project isolation, copied-page persistence, reload, legacy migration/backup/idempotence, stale-write rejection, embedded image export and recycle-bin recovery. These checks use disposable browser storage, never the user's existing projects.

The auto-save coordinator must return early after capture when there are no dirty changes. Assigning an already-settled promise as the current save would lock out later writes; the browser copy/reopen regression specifically guards this scenario.

Optional browser regression scripts are `tests/project-workspace.e2e.mjs`, `tests/project-storage.e2e.mjs`, and `tests/project-save-failure.e2e.mjs`. Run against the local development server on port 3000 with Playwright installed, or set `PLAYWRIGHT_MODULE` to an available Playwright module path. They create disposable browser contexts and never reuse a personal browser profile. The failure test intentionally injects a storage error, verifies navigation stays in the workspace, downloads a recoverable project, restores storage and retries successfully.
