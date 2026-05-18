import { CAMERA_PATH_LIMITS, DEFAULT_EASING } from "./videoExportConfig.js";
import { clamp, ease, finiteOr, sanitizeNumber } from "./cameraPathMath.js";
import { getRouteMode } from "./cameraPathKeyframes.js";
import { getViewModeLabel, interpolateCameraView } from "./cameraView.js";

export function validateCameraPath(keyframes, currentMode) {
  if (!Array.isArray(keyframes) || keyframes.length < 2) {
    throw new Error("Add at least two keyframes before previewing or exporting a video.");
  }

  const routeMode = getRouteMode(keyframes);
  if (!routeMode) {
    throw new Error("The camera path has no valid view mode.");
  }

  const mixedMode = keyframes.some((keyframe) => keyframe.mode !== routeMode);
  if (mixedMode) {
    throw new Error("All keyframes in one camera path must use the same graph mode.");
  }

  if (currentMode && currentMode !== routeMode) {
    throw new Error(`Switch back to ${getViewModeLabel(routeMode)} mode before previewing or exporting this path.`);
  }
}

export function getCameraPathDurationMs(keyframes, holdSeconds = 0) {
  return createCameraPathTimeline(keyframes, holdSeconds).totalMs;
}

export function getKeyframeHoldSeconds(keyframe, fallbackHoldSeconds = 0) {
  return sanitizeNumber(
    keyframe?.holdSeconds,
    finiteOr(fallbackHoldSeconds, 0),
    CAMERA_PATH_LIMITS.holdSeconds.min,
    CAMERA_PATH_LIMITS.holdSeconds.max,
  );
}

export function createCameraPathTimeline(keyframes, holdSeconds = 0) {
  if (!Array.isArray(keyframes) || keyframes.length === 0) {
    return { steps: [], totalMs: 0, mode: null, firstKeyframe: null, lastKeyframe: null };
  }

  const steps = [];
  let elapsedMs = 0;

  for (let index = 0; index < keyframes.length; index += 1) {
    const current = keyframes[index];
    const holdMs = getKeyframeHoldSeconds(current, holdSeconds) * 1000;
    if (holdMs > 0) {
      steps.push({
        type: "hold",
        startMs: elapsedMs,
        endMs: elapsedMs + holdMs,
        keyframe: current,
      });
      elapsedMs += holdMs;
    }

    const next = keyframes[index + 1];
    if (!next) continue;

    const transitionMs = Math.max(0, finiteOr(next.transitionSeconds, 0)) * 1000;
    if (transitionMs <= 0) {
      continue;
    }

    steps.push({
      type: "transition",
      startMs: elapsedMs,
      endMs: elapsedMs + transitionMs,
      from: current,
      to: next,
      easing: next.easing ?? DEFAULT_EASING,
    });
    elapsedMs += transitionMs;
  }

  return {
    steps,
    totalMs: elapsedMs,
    mode: getRouteMode(keyframes),
    firstKeyframe: keyframes[0],
    lastKeyframe: keyframes[keyframes.length - 1],
  };
}

export function sampleCameraPathAtMs(timeline, timeMs) {
  if (!timeline?.firstKeyframe) return null;

  const steps = timeline.steps ?? [];
  if (steps.length === 0 || timeline.totalMs <= 0) {
    return {
      mode: timeline.lastKeyframe.mode,
      view: timeline.lastKeyframe.view,
      keyframe: timeline.lastKeyframe,
      from: timeline.lastKeyframe,
      to: timeline.lastKeyframe,
      stepType: "hold",
      rawT: 1,
      easedT: 1,
    };
  }

  const clampedTime = clamp(timeMs, 0, timeline.totalMs);
  const currentStep = steps.find((step) => clampedTime <= step.endMs) ?? steps[steps.length - 1];

  if (currentStep.type === "hold") {
    return {
      mode: currentStep.keyframe.mode,
      view: currentStep.keyframe.view,
      keyframe: currentStep.keyframe,
      from: currentStep.keyframe,
      to: currentStep.keyframe,
      stepType: "hold",
      rawT: 0,
      easedT: 0,
    };
  }

  const durationMs = Math.max(currentStep.endMs - currentStep.startMs, 1);
  const rawT = clamp((clampedTime - currentStep.startMs) / durationMs, 0, 1);
  const easedT = ease(currentStep.easing, rawT);

  return {
    mode: currentStep.from.mode,
    view: interpolateCameraView(currentStep.from, currentStep.to, easedT),
    keyframe: currentStep.to,
    from: currentStep.from,
    to: currentStep.to,
    stepType: "transition",
    rawT,
    easedT,
  };
}
