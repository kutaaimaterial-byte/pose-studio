"use client";

import { useMemo, useRef } from "react";
import {
  ArrowCounterClockwise,
  ArrowClockwise,
  ArrowsLeftRight,
  CaretDown,
  Copy,
  CornersOut,
  DownloadSimple,
  FilmStrip,
  FloppyDisk,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat,
  Scissors,
  SkipBack,
  SkipForward,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";

import { type AnimationInterpolation, type AnimationTimeline, type CameraMotionId, type MotionId } from "./animation-timeline";
import { formatTimecode, type VideoShot, type VideoTimeline } from "./video-timeline";

type ClipDragMode = "move" | "trim-start" | "trim-end";

type VideoTimelinePanelProps<TSnapshot> = {
  timeline: VideoTimeline<TSnapshot>;
  animationTimeline: AnimationTimeline;
  playhead: number;
  activeShotId: string | null;
  playing: boolean;
  pixelsPerSecond: number;
  height: number;
  isZh: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onCollapse: () => void;
  onOpenGraph: () => void;
  simple?: boolean;
  onOpenPrompt: () => void;
  onAddShot: () => void;
  onUpdateShot: () => void;
  onSplitShot: () => void;
  onDuplicateShot: () => void;
  onDeleteShot: () => void;
  onTogglePlayback: () => void;
  onPreviousShot: () => void;
  onNextShot: () => void;
  onRestart: () => void;
  onToggleLoop: () => void;
  onToggleRipple: () => void;
  onFit: () => void;
  onZoom: (next: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onSelectShot: (shot: VideoShot<TSnapshot>) => void;
  onEditShotText: (shotId: string, promptText: string) => void;
  onScrubStart: () => void;
  onScrub: (time: number, applyShot?: boolean) => void;
  onClipPointerDown: (shotId: string, mode: ClipDragMode, event: React.PointerEvent<HTMLElement>) => void;
  onResizePointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onToggleAutoKey: () => void;
  onAddKeyframe: () => void;
  onStepFrame: (direction: -1 | 1) => void;
  onSetInterpolation: (value: AnimationInterpolation) => void;
  onLoadMotion: (motionId: MotionId) => void;
  onClearMotion: () => void;
  onLoadCameraMotion: (cameraMotionId: CameraMotionId) => void;
  onClearCameraMotion: () => void;
};

function rulerStep(pixelsPerSecond: number) {
  if (pixelsPerSecond >= 110) return 0.5;
  if (pixelsPerSecond >= 60) return 1;
  if (pixelsPerSecond >= 32) return 2;
  return 5;
}

export function VideoTimelinePanel<TSnapshot>({
  timeline,
  animationTimeline,
  playhead,
  activeShotId,
  playing,
  pixelsPerSecond,
  height,
  isZh,
  canUndo,
  canRedo,
  onCollapse,
  onOpenGraph,
  simple = false,
  onOpenPrompt,
  onAddShot,
  onUpdateShot,
  onSplitShot,
  onDuplicateShot,
  onDeleteShot,
  onTogglePlayback,
  onPreviousShot,
  onNextShot,
  onRestart,
  onToggleLoop,
  onToggleRipple,
  onFit,
  onZoom,
  onUndo,
  onRedo,
  onExport,
  onSelectShot,
  onEditShotText,
  onScrubStart,
  onScrub,
  onClipPointerDown,
  onResizePointerDown,
  onToggleAutoKey,
  onAddKeyframe,
  onStepFrame,
  onSetInterpolation,
  onLoadMotion,
  onClearMotion,
  onLoadCameraMotion,
  onClearCameraMotion,
}: VideoTimelinePanelProps<TSnapshot>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const text = (english: string, chinese: string) => isZh ? chinese : english;
  const trackWidth = Math.max(760, timeline.duration * pixelsPerSecond);
  const baseStep = rulerStep(pixelsPerSecond);
  // Keep the ruler light even for hour-long or day-long projects. The timeline
  // itself remains unbounded; only the number of rendered labels is capped.
  const majorStep = Math.max(baseStep, Math.ceil(timeline.duration / 2000 / baseStep) * baseStep);
  const ticks = useMemo(() => {
    const values: number[] = [];
    for (let time = 0; time <= timeline.duration + 0.001; time += majorStep) values.push(Number(time.toFixed(3)));
    return values;
  }, [majorStep, timeline.duration]);
  const activeShot = timeline.shots.find((shot) => shot.id === activeShotId) ?? null;
  const activeShotStart = activeShot?.start ?? 0;
  const shotsById = useMemo(() => new Map(animationTimeline.shots.map((shot) => [shot.shotId, {
    shot,
    motion: animationTimeline.motionLibrary.find((motion) => motion.id === shot.motionId),
    cameraMotion: animationTimeline.cameraMotionLibrary.find((motion) => motion.id === shot.cameraMotionId),
  }] as const).reverse()), [animationTimeline.shots, animationTimeline.motionLibrary, animationTimeline.cameraMotionLibrary]);
  const activeAnimationShot = activeShotId !== null ? shotsById.get(activeShotId)?.shot ?? null : null;
  const errors = timeline.issues.filter((issue) => issue.severity === "error");

  const scrubFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const content = contentRef.current;
    if (!content) return;
    const rect = content.getBoundingClientRect();
    const time = Math.min(timeline.duration, Math.max(0, (event.clientX - rect.left) / pixelsPerSecond));
    onScrub(time, true);
  };

  return (
    <section className="video-timeline-panel animation-sequencer" style={{ height }} aria-label={text("3D animation sequencer", "3D 动画时间轴")}>
      <button className="timeline-resize-handle" onPointerDown={onResizePointerDown} aria-label={text("Resize timeline", "调整时间轴高度")} />
      <header className="timeline-header">
        <div className="timeline-heading">
          <span className="timeline-heading-icon"><FilmStrip size={17} weight="fill" /></span>
          <div><strong>{text("Animation Sequencer", "动画时间轴")}</strong><small>V3.4 · {timeline.shots.length} Shots · {text("Stage + shot framing", "舞台与景别分镜")} · {timeline.fps} FPS</small></div>
        </div>
        <div className="timeline-header-actions">
          <select className="timeline-motion-select" value={activeAnimationShot?.motionId ?? ""} onChange={(event) => {
            const value = event.target.value as MotionId | "";
            if (value) onLoadMotion(value);
            else onClearMotion();
          }} disabled={!activeShot} aria-label={text("Motion library", "动作库")}>
            <option value="">{text("No motion", "未分配动作")}</option>
            {animationTimeline.motionLibrary.map((motion) => <option key={motion.id} value={motion.id}>{isZh ? motion.name : motion.nameEn}</option>)}
          </select>
          <select className="timeline-camera-motion-select" value={activeAnimationShot?.cameraMotionId ?? ""} onChange={(event) => {
            const value = event.target.value as CameraMotionId | "";
            if (value) onLoadCameraMotion(value);
            else onClearCameraMotion();
          }} disabled={!activeShot} aria-label={text("Camera motion library", "镜头运动库")}>
            <option value="">{text("No camera move", "未分配镜头运动")}</option>
            {animationTimeline.cameraMotionLibrary.map((motion) => <option key={motion.id} value={motion.id}>{isZh ? motion.name : motion.nameEn}</option>)}
          </select>
          <button className={animationTimeline.autoKey ? "active" : ""} onClick={onToggleAutoKey} title={text("Automatically key edited values", "自动记录编辑值")}><i className="auto-key-dot" />Auto Key</button>
          <button onClick={onAddKeyframe} disabled={!activeShot}><Plus size={15} />{text("Keyframe", "关键帧")}</button>
          <button onClick={onOpenPrompt}><Plus size={15} />{text("From prompt", "解析分镜")}</button>
          <button onClick={onAddShot}><Plus size={15} />{text("Add shot", "新增镜头")}</button>
          <button onClick={onUpdateShot} disabled={!activeShot}><FloppyDisk size={15} />{text("Update shot", "更新镜头")}{activeShot?.dirty && <i />}</button>
          <span />
          <button className="icon-only" onClick={onUndo} disabled={!canUndo} title={text("Undo timeline edit", "撤销时间轴编辑")}><ArrowCounterClockwise size={16} /></button>
          <button className="icon-only" onClick={onRedo} disabled={!canRedo} title={text("Redo timeline edit", "重做时间轴编辑")}><ArrowClockwise size={16} /></button>
          <button className="icon-only" onClick={onExport} disabled={!timeline.shots.length} title={text("Export timeline JSON", "导出时间轴 JSON")}><DownloadSimple size={16} /></button>
          <button onClick={onOpenGraph}>{simple ? "分镜卡片" : text("Nodes", "节点视图")}</button>
          <button className="icon-only" onClick={onCollapse} title={text("Collapse timeline", "收起时间轴")}><CaretDown size={17} /></button>
        </div>
      </header>

      <div className="timeline-workspace">
        <aside className="timeline-controls">
          <div className="timeline-transport">
            <button onClick={onRestart} disabled={!timeline.shots.length} title={text("Back to start", "回到开头")} aria-label={text("Back to start", "回到开头")}><SkipBack size={18} weight="fill" /></button>
            <button onClick={() => onStepFrame(-1)} disabled={!timeline.shots.length} title={text("Previous frame", "上一帧")} aria-label={text("Previous frame", "上一帧")}><SkipBack size={18} /></button>
            <button className="timeline-play" onClick={onTogglePlayback} disabled={!timeline.shots.length} title={text("Play or pause · Space", "播放或暂停 · Space")} aria-label={text("Play or pause", "播放或暂停")}>{playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}</button>
            <button onClick={() => onStepFrame(1)} disabled={!timeline.shots.length} title={text("Next frame", "下一帧")} aria-label={text("Next frame", "下一帧")}><SkipForward size={18} /></button>
            <button className={timeline.loop ? "active timeline-loop" : "timeline-loop"} onClick={onToggleLoop} title={text("Cycle loop: all, shot, off", "循环模式：全部、单镜头、关闭")} aria-label={text("Cycle loop mode", "切换循环模式")}><Repeat size={18} />{timeline.loop && <small>{timeline.loopMode === "shot" ? "S" : "A"}</small>}</button>
          </div>
          <div className="timeline-time"><strong>{formatTimecode(playhead, true, timeline.fps)}</strong><span>/ {formatTimecode(timeline.duration, true, timeline.fps)}</span></div>
          <div className="timeline-mode-row">
            <button onClick={onPreviousShot} disabled={!timeline.shots.length} title={text("Previous shot", "上一镜头")}><SkipBack size={18} /></button>
            <button onClick={onNextShot} disabled={!timeline.shots.length} title={text("Next shot", "下一镜头")}><SkipForward size={18} /></button>
            <button className={timeline.ripple ? "active" : ""} onClick={onToggleRipple} title={text("Toggle ripple editing", "切换联动编辑")} aria-label={text("Toggle ripple editing", "切换联动编辑")}><ArrowsLeftRight size={18} /></button>
            <button onClick={onSplitShot} disabled={!activeShot} title={text("Split shot", "切分镜头")} aria-label={text("Split shot", "切分镜头")}><Scissors size={18} /></button>
            <button onClick={onDuplicateShot} disabled={!activeShot} title={text("Duplicate shot", "复制镜头")} aria-label={text("Duplicate shot", "复制镜头")}><Copy size={18} /></button>
            <button onClick={onDeleteShot} disabled={!activeShot} title={text("Delete shot", "删除镜头")} aria-label={text("Delete shot", "删除镜头")}><Trash size={18} /></button>
          </div>
          <div className="timeline-zoom">
            <button onClick={() => onZoom(Math.max(24, pixelsPerSecond - 12))} title={text("Zoom out", "缩小时间轴")} aria-label={text("Zoom out", "缩小时间轴")}><Minus size={18} /></button>
            <button onClick={onFit} title={text("Fit timeline", "适配时间轴")} aria-label={text("Fit timeline", "适配时间轴")}><CornersOut size={18} /></button>
            <button onClick={() => onZoom(Math.min(160, pixelsPerSecond + 12))} title={text("Zoom in", "放大时间轴")} aria-label={text("Zoom in", "放大时间轴")}><Plus size={18} /></button>
          </div>
        </aside>

        <div ref={scrollRef} className="timeline-scroll">
          {!timeline.shots.length ? (
            <button className="timeline-empty" onClick={onOpenPrompt}>
              <span><FilmStrip size={24} /></span>
              <div><strong>{simple ? "选好镜头，时间轴自动就绪" : text("Build a cut preview from a timed prompt", "用带时间段的提示词建立切镜预览")}</strong><small>{simple ? "从左侧选预设或套组，点击使用即可播放分镜。" : text("Paste 0–2s / 2–5s shot descriptions, then preview the real rhythm.", "粘贴 0–2 秒、2–5 秒等分镜描述，即可按真实时长预演。")}</small></div>
              <em>{simple ? "描述分镜" : text("Create timeline", "创建时间轴")}</em>
            </button>
          ) : (
            <div
              ref={contentRef}
              className="timeline-content"
              style={{ width: trackWidth }}
              onPointerDown={(event) => {
                if ((event.target as HTMLElement).closest(".timeline-clip")) return;
                scrubFromPointer(event);
              }}
            >
              <div className="timeline-ruler">
                {ticks.map((time) => <i key={time} style={{ left: time * pixelsPerSecond }}><span>{formatTimecode(time)}</span></i>)}
              </div>
              <div className="timeline-track-label"><span>{text("SHOT TRACK", "镜头轨")}</span><small>{text("Hard cuts", "硬切")}</small></div>
              <div className="timeline-track shot-track">
                {timeline.shots.map((shot) => {
                  const { motion: clipMotion, cameraMotion: clipCameraMotion } = shotsById.get(shot.id) ?? {};
                  return (
                  <button
                    key={shot.id}
                    className={`timeline-clip ${activeShotId === shot.id ? "selected" : ""} ${shot.start <= playhead && playhead < shot.end ? "playing" : ""}`}
                    style={{ left: shot.start * pixelsPerSecond, width: Math.max(34, shot.duration * pixelsPerSecond), "--shot-color": shot.color } as React.CSSProperties}
                    onClick={(event) => { event.stopPropagation(); onSelectShot(shot); }}
                    onPointerDown={(event) => onClipPointerDown(shot.id, "move", event)}
                    aria-pressed={activeShotId === shot.id}
                    title={`${formatTimecode(shot.start)}–${formatTimecode(shot.end)} · ${shot.promptText}`}
                  >
                    <span className="clip-trim clip-trim-start" onPointerDown={(event) => { event.stopPropagation(); onClipPointerDown(shot.id, "trim-start", event); }} />
                    <span className="clip-color" />
                    <span className="clip-copy"><strong>SHOT {String(shot.index).padStart(2, "0")}{shot.dirty && <i />}</strong><small>{shot.title}{clipMotion && <b> · {isZh ? clipMotion.name : clipMotion.nameEn}</b>}{clipCameraMotion && <b className="camera-motion-name"> · {isZh ? clipCameraMotion.name : clipCameraMotion.nameEn}</b>}</small></span>
                    <em>{shot.duration.toFixed(1)}s</em>
                    <span className="clip-trim clip-trim-end" onPointerDown={(event) => { event.stopPropagation(); onClipPointerDown(shot.id, "trim-end", event); }} />
                  </button>
                  );
                })}
              </div>
              {activeAnimationShot && activeShot && <div className="animation-track-stack">
                {activeAnimationShot.tracks.map((track) => <div className={`animation-track-row track-${track.kind}`} key={track.id}>
                  <span className="animation-track-name">{track.kind === "pose" ? text("POSE", "姿态") : track.kind === "root" ? text("ROOT", "根运动") : text("CAMERA", "相机")}</span>
                  {track.keyframes.map((keyframe) => <button
                    key={keyframe.id}
                    className="animation-keyframe"
                    style={{ left: (activeShotStart + keyframe.time) * pixelsPerSecond }}
                    onClick={(event) => { event.stopPropagation(); onScrub(activeShotStart + keyframe.time, true); }}
                    title={`${track.name} · ${formatTimecode(keyframe.time, true, timeline.fps)} · ${keyframe.interpolation}`}
                    aria-label={`${track.name} ${formatTimecode(keyframe.time, true, timeline.fps)}`}
                  />)}
                </div>)}
              </div>}
              <button
                className="timeline-playhead"
                style={{ left: playhead * pixelsPerSecond }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onScrubStart();
                  const handle = event.currentTarget;
                  const pointerOffset = event.clientX - handle.getBoundingClientRect().left;
                  let pendingClientX = event.clientX;
                  let scrubFrame: number | null = null;
                  const timeFromClientX = (clientX: number) => {
                    const content = contentRef.current;
                    if (!content) return playhead;
                    const rect = content.getBoundingClientRect();
                    return Math.min(timeline.duration, Math.max(0, (clientX - pointerOffset - rect.left) / pixelsPerSecond));
                  };
                  const applyPendingScrub = () => {
                    scrubFrame = null;
                    onScrub(timeFromClientX(pendingClientX), false);
                  };
                  const move = (pointerEvent: PointerEvent) => {
                    pendingClientX = pointerEvent.clientX;
                    handle.style.left = `${timeFromClientX(pendingClientX) * pixelsPerSecond}px`;
                    if (scrubFrame === null) scrubFrame = window.requestAnimationFrame(applyPendingScrub);
                  };
                  const end = (pointerEvent: PointerEvent) => {
                    window.removeEventListener("pointermove", move);
                    window.removeEventListener("pointerup", end);
                    window.removeEventListener("pointercancel", end);
                    if (scrubFrame !== null) window.cancelAnimationFrame(scrubFrame);
                    pendingClientX = pointerEvent.clientX;
                    handle.style.left = `${timeFromClientX(pendingClientX) * pixelsPerSecond}px`;
                    onScrub(timeFromClientX(pendingClientX), true);
                    handle.classList.remove("dragging");
                  };
                  handle.classList.add("dragging");
                  window.addEventListener("pointermove", move);
                  window.addEventListener("pointerup", end);
                  window.addEventListener("pointercancel", end);
                }}
                aria-label={text("Drag playhead", "拖动播放头")}
              ><span>{formatTimecode(playhead)}</span></button>
            </div>
          )}
        </div>
      </div>

      <div className="timeline-footer-stack">
        {activeShot && <div className="timeline-sequencer-footer" key={activeShot.id}>
          <label className="timeline-shot-editor">
          <span>SHOT {String(activeShot.index).padStart(2, "0")}</span>
          <input defaultValue={activeShot.promptText} onBlur={(event) => onEditShotText(activeShot.id, event.target.value)} aria-label={text("Selected shot prompt", "当前镜头提示词")} />
          <time>{formatTimecode(activeShot.start)} - {formatTimecode(activeShot.end)}</time>
          </label>
          <label className="timeline-interpolation"><span>{text("Interpolation", "插值")}</span><select value={animationTimeline.interpolation} onChange={(event) => onSetInterpolation(event.target.value as AnimationInterpolation)}><option value="hold">Hold</option><option value="linear">Linear</option><option value="ease-in-out">Ease In-Out</option></select></label>
        </div>}
        {(timeline.issues.length > 0 || timeline.unassigned.length > 0) && (
          <footer className={`timeline-status ${errors.length ? "has-error" : ""}`}>
            <WarningCircle size={15} weight="fill" />
            <span>{errors.length
              ? text(`${errors.length} timing errors must be resolved`, `${errors.length} 个时间错误需要处理`)
              : text(`${timeline.issues.length} timeline note${timeline.issues.length === 1 ? "" : "s"}`, `${timeline.issues.length} 条时间轴提示`)}</span>
            {timeline.unassigned.length > 0 && <small>{text(`${timeline.unassigned.length} unassigned`, `${timeline.unassigned.length} 段待分配`)}</small>}
          </footer>
        )}
      </div>
    </section>
  );
}
