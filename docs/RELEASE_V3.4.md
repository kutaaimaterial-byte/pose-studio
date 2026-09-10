# V3.4 · Stage & Shot Studio

## Working flows

- Open **舞台 → 舞台** to create, rename, duplicate, save and restore stage documents. Seven lightweight Three.js environments supply real ground geometry and spatial references. Each saved stage contains the existing model, camera, lighting, grid, image-layer and prompt state.
- **舞台 → 景别** offers ECU/CU/MCU/MS/MLS/FS/LS/ELS, nine camera angles and nine composition templates. Position, lens, occupancy, horizon bias, guides and negative space are editable. Camera presets do not modify the pose solver. Save the result as a new timeline shot, or update the current shot.
- **舞台 → 文字分镜** parses one shot or timed shot descriptions locally. This is deterministic Chinese/English matching, not an external AI call. Review and override size, angle, composition and aspect before replacing the timeline. Pose matching and independent character/camera animation remain integrated.
- **舞台 → 快照** exports clean/reference/grid/safe-frame/annotated PNGs at the existing artboard resolutions. Shot number, size, aspect and output variant are reflected in filenames. Saved low-resolution references remain attached to each shot/ratio/variant; full PNGs download to the user's machine.
- **节点视图** supplements the sequencer with ten node types, draggable positions, acyclic connections, upstream Prompt resolution, Shot binding, parameter navigation, JSON save/load and automatic graph creation from timeline shots. It is a storyboard relationship editor, not a general-purpose ComfyUI runtime.

## Persistence and compatibility

Existing V3.3 timelines and animation tracks remain readable. Optional stage, framing, camera-up/rotation/FOV and snapshot-reference fields extend scene snapshots without replacing pose or animation formats. Ratio overrides keep separate cameras and composition offsets.

The existing local cache is retained for draft recovery, now debounced and guarded against storage exhaustion. Explicit **保存舞台 / 保存云端项目** writes the full V3.4 JSON document to a private R2 object. **恢复云端项目** and JSON import validate the document and require confirmation before replacing the current project.

Cloud objects are addressed with the SHA-256 hash of a random 256-bit browser-held bearer capability. The key is sent only in Authorization, never in URLs, exports or object names. There is no public project listing or anonymous read access. ETag preconditions reject stale overwrites. Storage requests are bounded to 24 MB and reject cross-origin requests. Clearing browser credentials removes access to that browser's cloud document, so export JSON before clearing browser data. No account or cross-device key-management interface is introduced.

## Verification

The focused tests cover the requirements' right-side/sky/low/full-body case, all eight shot-size distances, multi-shot parsing, stage geometry, ratio/snapshot serialization, node cycle rejection, private storage isolation and overwrite conflicts. Existing timeline, animation and rendered-shell checks remain part of validation.

Browser interaction/visual QA was not requested in this turn and has not been claimed. Test the five acceptance flows with real project content before deleting older JSON backups.

## Scope

Implements the first-edition Phase 1 and Phase 2 workflows. Existing intra-shot character/camera animation is retained. More detailed environments, specialized Seedance submission/export integration and AI rhythm recommendations from Phase 3 are not newly implemented. Dialogue framing fits existing visible actors; it does not invent or automatically generate additional characters.
