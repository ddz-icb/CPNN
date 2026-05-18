import {
  CAMERA_PATH_LIMITS,
  DEFAULT_EASING,
  VIEW_MODE_3D,
} from "./videoExportConfig.js";
import { finiteOr, formatNumber, radToDeg, sanitizeNumber } from "./cameraPathMath.js";
import { getViewModeLabel } from "./cameraView.js";

export function getRouteMode(keyframes) {
  return Array.isArray(keyframes) && keyframes.length > 0 ? keyframes[0].mode : null;
}

export function createCameraKeyframe({ captured, index, transitionSeconds, holdSeconds = 0 }) {
  if (!captured) return null;

  const safeTransitionSeconds = sanitizeNumber(
    transitionSeconds,
    3,
    CAMERA_PATH_LIMITS.transitionSeconds.min,
    CAMERA_PATH_LIMITS.transitionSeconds.max,
  );
  const safeHoldSeconds = sanitizeNumber(holdSeconds, 0, CAMERA_PATH_LIMITS.holdSeconds.min, CAMERA_PATH_LIMITS.holdSeconds.max);

  return {
    id: createKeyframeId(),
    label: `Keyframe ${index + 1}`,
    mode: captured.mode,
    view: captured.view,
    transitionSeconds: safeTransitionSeconds,
    transitionSecondsText: formatNumber(safeTransitionSeconds, 2),
    holdSeconds: safeHoldSeconds,
    holdSecondsText: formatNumber(safeHoldSeconds, 2),
    easing: DEFAULT_EASING,
  };
}

export function buildKeyframeRows(keyframes) {
  return (keyframes ?? []).map((keyframe, index) => ({
    ...keyframe,
    primaryText: keyframe.label ?? `Keyframe ${index + 1}`,
    secondaryText: describeKeyframe(keyframe, index),
  }));
}

export function updateKeyframeById(keyframes, id, patch) {
  const resolvePatch = typeof patch === "function" ? patch : () => patch;
  return (keyframes ?? []).map((keyframe) => (keyframe.id === id ? { ...keyframe, ...resolvePatch(keyframe) } : keyframe));
}

export function removeKeyframeById(keyframes, id) {
  return (keyframes ?? []).filter((keyframe) => keyframe.id !== id);
}

export function moveKeyframeById(keyframes, id, direction) {
  const currentKeyframes = [...(keyframes ?? [])];
  const index = currentKeyframes.findIndex((keyframe) => keyframe.id === id);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= currentKeyframes.length) {
    return currentKeyframes;
  }

  const [keyframe] = currentKeyframes.splice(index, 1);
  currentKeyframes.splice(nextIndex, 0, keyframe);
  return currentKeyframes;
}

export function describeKeyframe(keyframe, index = 0) {
  if (!keyframe?.view) return "";

  const prefix = getViewModeLabel(keyframe.mode);
  const transition = index > 0 ? ` - ${formatNumber(finiteOr(keyframe.transitionSeconds, 0), 1)}s` : " - start";

  if (keyframe.mode === VIEW_MODE_3D) {
    return `${prefix} - yaw ${formatNumber(radToDeg(keyframe.view.rotY), 0)} deg - pitch ${formatNumber(radToDeg(keyframe.view.rotX), 0)} deg${transition}`;
  }

  return `${prefix} - zoom ${formatNumber(keyframe.view.zoom, 2)}x${transition}`;
}

export function formatKeyframeView(keyframe) {
  if (!keyframe?.view) return "None";

  if (keyframe.mode === VIEW_MODE_3D) {
    return [
      `yaw ${formatNumber(radToDeg(keyframe.view.rotY), 0)} deg`,
      `pitch ${formatNumber(radToDeg(keyframe.view.rotX), 0)} deg`,
      `depth ${formatNumber(keyframe.view.z, 0)}`,
      `fov ${formatNumber(keyframe.view.fov, 0)}`,
    ].join(", ");
  }

  return [
    `x ${formatNumber(keyframe.view.centerX, 0)}`,
    `y ${formatNumber(keyframe.view.centerY, 0)}`,
    `zoom ${formatNumber(keyframe.view.zoom, 2)}x`,
  ].join(", ");
}

function createKeyframeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `keyframe-${crypto.randomUUID()}`;
  }

  return `keyframe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
