import { DEFAULT_EASING } from "./videoExportConfig.js";
import { ease, finiteOr } from "./cameraPathMath.js";
import { runTimedStep, throwIfAborted } from "./cameraPathTiming.js";
import { applyCameraView, applyKeyframe, getViewMode, interpolateCameraView } from "./cameraView.js";
import {
  createCameraPathTimeline,
  getCameraPathDurationMs,
  getKeyframeHoldSeconds,
  sampleCameraPathAtMs,
  validateCameraPath,
} from "./cameraPathTimeline.js";

export async function playCameraPath({
  keyframes,
  app,
  appearance,
  container,
  holdSeconds = 0,
  onProgress,
  onFrame,
  onKeyframeEnter,
  onTransitionStart,
  onTransitionFrame,
  signal,
  syncZoomAtEnd = true,
}) {
  validateCameraPath(keyframes, getViewMode(appearance));

  const totalMs = getCameraPathDurationMs(keyframes, holdSeconds);
  let elapsedBeforeStep = 0;

  applyKeyframe(keyframes[0], { app, appearance, container });
  await onKeyframeEnter?.(keyframes[0], 0);
  onFrame?.();
  onProgress?.(0);

  for (let i = 0; i < keyframes.length; i += 1) {
    throwIfAborted(signal);

    const current = keyframes[i];
    if (i > 0) {
      await onKeyframeEnter?.(current, i);
      onFrame?.();
    }
    const holdMs = getKeyframeHoldSeconds(current, holdSeconds) * 1000;
    if (holdMs > 0) {
      await runTimedStep({
        durationMs: holdMs,
        elapsedBeforeStep,
        totalMs,
        onProgress,
        onFrame,
        signal,
        render: () => applyKeyframe(current, { app, appearance, container }),
      });
      elapsedBeforeStep += holdMs;
    }

    const next = keyframes[i + 1];
    if (!next) continue;

    const transitionMs = Math.max(0, finiteOr(next.transitionSeconds, 0)) * 1000;
    if (transitionMs <= 0) {
      await onTransitionStart?.(current, next, i);
      onTransitionFrame?.({ from: current, to: next, rawT: 1, easedT: 1, index: i });
      applyKeyframe(next, { app, appearance, container });
      onFrame?.();
      continue;
    }

    await onTransitionStart?.(current, next, i);

    await runTimedStep({
      durationMs: transitionMs,
      elapsedBeforeStep,
      totalMs,
      onProgress,
      onFrame,
      signal,
      render: (rawT) => {
        const easedT = ease(next.easing ?? DEFAULT_EASING, rawT);
        onTransitionFrame?.({ from: current, to: next, rawT, easedT, index: i });
        const view = interpolateCameraView(current, next, easedT);
        if (!view) return;
        applyCameraView(current.mode, view, { app, appearance, container });
      },
    });
    elapsedBeforeStep += transitionMs;
  }

  applyKeyframe(keyframes[keyframes.length - 1], { app, appearance, container, syncZoom: syncZoomAtEnd });
  onFrame?.();
  onProgress?.(1);
}

export async function renderCameraPathFrameSchedule({
  keyframes,
  app,
  appearance,
  container,
  holdSeconds = 0,
  frameSchedule,
  onProgress,
  onFrame,
  onKeyframeEnter,
  onTransitionStart,
  onTransitionFrame,
  signal,
  syncZoomAtEnd = true,
}) {
  validateCameraPath(keyframes, getViewMode(appearance));

  const timeline = createCameraPathTimeline(keyframes, holdSeconds);
  const frames = Array.isArray(frameSchedule) ? frameSchedule : [];
  const keyframeIndices = new Map(keyframes.map((keyframe, index) => [keyframe, index]));
  const firstKeyframe = keyframes[0];
  let enteredKeyframe = firstKeyframe;
  let activeTransitionTo = null;

  applyKeyframe(firstKeyframe, { app, appearance, container });
  await onKeyframeEnter?.(firstKeyframe, 0);

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
    throwIfAborted(signal);

    const frame = frames[frameIndex];
    const sample = sampleCameraPathAtMs(timeline, frame.timeMs);
    if (!sample?.view) continue;

    if (sample.stepType === "transition") {
      if (activeTransitionTo !== sample.to) {
        activeTransitionTo = sample.to;
        await onTransitionStart?.(sample.from, sample.to, keyframeIndices.get(sample.from) ?? 0);
      }
      await onTransitionFrame?.({
        from: sample.from,
        to: sample.to,
        rawT: sample.rawT,
        easedT: sample.easedT,
        index: keyframeIndices.get(sample.from) ?? 0,
      });
    } else {
      activeTransitionTo = null;
      if (sample.keyframe !== enteredKeyframe) {
        enteredKeyframe = sample.keyframe;
        await onKeyframeEnter?.(sample.keyframe, keyframeIndices.get(sample.keyframe) ?? 0);
      }
    }

    applyCameraView(sample.mode, sample.view, { app, appearance, container });
    await onFrame?.({ frame, frameIndex, sample, timeline });
    onProgress?.(frames.length <= 1 ? 1 : frameIndex / (frames.length - 1));
  }

  applyKeyframe(keyframes[keyframes.length - 1], { app, appearance, container, syncZoom: syncZoomAtEnd });
  onProgress?.(1);
}

export function pauseSimulationForCameraPath(simulation) {
  if (!simulation || typeof simulation.stop !== "function") {
    return () => {};
  }

  const alpha = typeof simulation.alpha === "function" ? simulation.alpha() : 0;
  const alphaTarget = typeof simulation.alphaTarget === "function" ? simulation.alphaTarget() : 0;
  const alphaMin = typeof simulation.alphaMin === "function" ? simulation.alphaMin() : 0;
  const shouldRestart = alphaTarget > 0 || alpha > alphaMin + 0.001;

  simulation.stop();

  return () => {
    if (!shouldRestart || typeof simulation.restart !== "function") return;
    if (typeof simulation.alpha === "function" && Number.isFinite(alpha)) {
      simulation.alpha(alpha);
    }
    simulation.restart();
  };
}
