import * as d3 from "d3";
import { defaultCamera } from "../canvas_drawing/render3D.js";
import { getFileNameWithoutExtension } from "../parsing/fileParsing.js";

export const VIEW_MODE_2D = "2d";
export const VIEW_MODE_3D = "3d";

export const DEFAULT_EASING = "cinematic";

export const EASING_OPTIONS = [
  { value: DEFAULT_EASING, label: "Cinematic" },
  { value: "smooth", label: "Smooth" },
  { value: "easeInOut", label: "Ease in-out" },
  { value: "linear", label: "Linear" },
];

export const CAMERA_PATH_LIMITS = {
  transitionSeconds: { min: 0.25, max: 20, step: 0.25 },
  holdSeconds: { min: 0, max: 3, step: 0.05 },
};

export const VIDEO_EXPORT_FPS = 60;
export const VIDEO_EXPORT_BITRATE_MBPS = 24;

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 50;
const MIN_FOV = 120;
const MAX_FOV = 2400;
const RECORDER_MIME_TYPES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4;codecs=h264",
  "video/mp4",
];

export function getViewMode(appearance) {
  return appearance?.threeD ? VIEW_MODE_3D : VIEW_MODE_2D;
}

export function getViewModeLabel(mode) {
  return mode === VIEW_MODE_3D ? "3D" : "2D";
}

export function getRouteMode(keyframes) {
  return Array.isArray(keyframes) && keyframes.length > 0 ? keyframes[0].mode : null;
}

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "0";
  return Number.parseFloat(value.toFixed(digits)).toString();
}

export function radToDeg(value) {
  if (!Number.isFinite(value)) return 0;
  return (value * 180) / Math.PI;
}

export function sanitizeNumber(value, fallback, min, max) {
  const parsed = Number.parseFloat(value);
  const safeValue = Number.isFinite(parsed) ? parsed : fallback;
  return clamp(safeValue, min, max);
}

export function createCameraKeyframe({ captured, index, transitionSeconds }) {
  if (!captured) return null;

  const safeTransitionSeconds = sanitizeNumber(
    transitionSeconds,
    3,
    CAMERA_PATH_LIMITS.transitionSeconds.min,
    CAMERA_PATH_LIMITS.transitionSeconds.max
  );

  return {
    id: createKeyframeId(),
    label: `Keyframe ${index + 1}`,
    mode: captured.mode,
    view: captured.view,
    transitionSeconds: safeTransitionSeconds,
    transitionSecondsText: formatNumber(safeTransitionSeconds, 2),
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

export function captureCurrentView({ app, appearance, container }) {
  if (!app || !container?.width || !container?.height) {
    return null;
  }

  const mode = getViewMode(appearance);

  if (mode === VIEW_MODE_3D) {
    const camera = appearance?.cameraRef?.current ?? defaultCamera;
    return {
      mode,
      view: {
        x: finiteOr(camera?.x, container.width / 2),
        y: finiteOr(camera?.y, container.height / 2),
        z: finiteOr(camera?.z, defaultCamera.z),
        fov: clamp(finiteOr(camera?.fov, defaultCamera.fov), MIN_FOV, MAX_FOV),
        rotX: finiteOr(camera?.rotX, defaultCamera.rotX),
        rotY: finiteOr(camera?.rotY, defaultCamera.rotY),
      },
    };
  }

  const stage = app.stage;
  const zoom = clamp(finiteOr(stage?.scale?.x, 1), MIN_ZOOM, MAX_ZOOM);

  return {
    mode,
    view: {
      centerX: (container.width / 2 - finiteOr(stage?.x, 0)) / zoom,
      centerY: (container.height / 2 - finiteOr(stage?.y, 0)) / zoom,
      zoom,
    },
  };
}

export function applyKeyframe(keyframe, params = {}) {
  if (!keyframe?.mode || !keyframe?.view) return;
  applyCameraView(keyframe.mode, keyframe.view, params);
}

export function applyCameraView(mode, view, { app, appearance, container, syncZoom = false } = {}) {
  if (!app || !container?.width || !container?.height || !view) return;

  if (mode === VIEW_MODE_3D) {
    const camera = appearance?.cameraRef?.current;
    if (!camera) return;

    camera.x = finiteOr(view.x, container.width / 2);
    camera.y = finiteOr(view.y, container.height / 2);
    camera.z = finiteOr(view.z, defaultCamera.z);
    camera.fov = clamp(finiteOr(view.fov, defaultCamera.fov), MIN_FOV, MAX_FOV);
    camera.rotX = finiteOr(view.rotX, defaultCamera.rotX);
    camera.rotY = finiteOr(view.rotY, defaultCamera.rotY);

    if (typeof camera.redraw === "function") {
      camera.redraw();
    } else {
      app.renderer?.render?.(app.stage);
    }
    return;
  }

  const zoom = clamp(finiteOr(view.zoom, 1), MIN_ZOOM, MAX_ZOOM);
  const x = container.width / 2 - finiteOr(view.centerX, 0) * zoom;
  const y = container.height / 2 - finiteOr(view.centerY, 0) * zoom;

  if (syncZoom && app.__zoomBehavior && app.__zoomSelection) {
    const transform = d3.zoomIdentity.translate(x, y).scale(zoom);
    app.__zoomSelection.call(app.__zoomBehavior.transform, transform);
    return;
  }

  app.stage.x = x;
  app.stage.y = y;
  app.stage.scale?.set?.(zoom, zoom);
  app.renderer?.render?.(app.stage);
}

export function interpolateCameraView(fromKeyframe, toKeyframe, t) {
  if (!fromKeyframe || !toKeyframe || fromKeyframe.mode !== toKeyframe.mode) {
    return null;
  }

  const amount = clamp(t, 0, 1);
  const mode = fromKeyframe.mode;
  const from = fromKeyframe.view;
  const to = toKeyframe.view;

  if (mode === VIEW_MODE_3D) {
    return {
      x: lerp(from.x, to.x, amount),
      y: lerp(from.y, to.y, amount),
      z: lerp(from.z, to.z, amount),
      fov: lerp(from.fov, to.fov, amount),
      rotX: lerpAngle(from.rotX, to.rotX, amount),
      rotY: lerpAngle(from.rotY, to.rotY, amount),
    };
  }

  return {
    centerX: lerp(from.centerX, to.centerX, amount),
    centerY: lerp(from.centerY, to.centerY, amount),
    zoom: interpolateZoom(from.zoom, to.zoom, amount),
  };
}

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
  if (!Array.isArray(keyframes) || keyframes.length < 2) return 0;
  const holdMs = Math.max(0, finiteOr(holdSeconds, 0)) * 1000;
  const transitionMs = keyframes.slice(1).reduce((total, keyframe) => total + Math.max(0, finiteOr(keyframe.transitionSeconds, 0)) * 1000, 0);
  return transitionMs + holdMs * keyframes.length;
}

export async function playCameraPath({
  keyframes,
  app,
  appearance,
  container,
  holdSeconds = 0,
  onProgress,
  onFrame,
  signal,
  syncZoomAtEnd = true,
}) {
  validateCameraPath(keyframes, getViewMode(appearance));

  const totalMs = getCameraPathDurationMs(keyframes, holdSeconds);
  const holdMs = Math.max(0, finiteOr(holdSeconds, 0)) * 1000;
  let elapsedBeforeStep = 0;

  applyKeyframe(keyframes[0], { app, appearance, container });
  onFrame?.();
  onProgress?.(0);

  for (let i = 0; i < keyframes.length; i += 1) {
    throwIfAborted(signal);

    const current = keyframes[i];
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
      applyKeyframe(next, { app, appearance, container });
      onFrame?.();
      continue;
    }

    await runTimedStep({
      durationMs: transitionMs,
      elapsedBeforeStep,
      totalMs,
      onProgress,
      onFrame,
      signal,
      render: (rawT) => {
        const easedT = ease(next.easing ?? DEFAULT_EASING, rawT);
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

export async function recordCameraPathVideo({
  keyframes,
  app,
  appearance,
  container,
  graphName,
  holdSeconds = 0,
  onProgress,
}) {
  validateCameraPath(keyframes, getViewMode(appearance));

  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser does not support video recording from the canvas.");
  }

  const sourceCanvas = getPixiCanvas(app);
  if (!sourceCanvas) {
    throw new Error("The graph canvas is not ready for video export.");
  }

  const captureCanvas = document.createElement("canvas");
  const outputWidth = Math.max(2, sourceCanvas.width || Math.round(container.width * (window.devicePixelRatio || 1)));
  const outputHeight = Math.max(2, sourceCanvas.height || Math.round(container.height * (window.devicePixelRatio || 1)));
  captureCanvas.width = outputWidth;
  captureCanvas.height = outputHeight;

  if (typeof captureCanvas.captureStream !== "function") {
    throw new Error("This browser does not support canvas video export.");
  }

  const context = captureCanvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare the video export canvas.");
  }

  const stream = captureCanvas.captureStream(VIDEO_EXPORT_FPS);
  const requestFrame = () => {
    stream.getVideoTracks().forEach((track) => track.requestFrame?.());
  };

  const background = resolveCanvasBackground(sourceCanvas);
  const copyFrame = () => {
    context.save();
    context.fillStyle = background;
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(sourceCanvas, 0, 0, outputWidth, outputHeight);
    context.restore();
    requestFrame();
  };

  const mimeType = getSupportedRecorderMimeType();
  const recorderOptions = {};
  if (mimeType) recorderOptions.mimeType = mimeType;
  recorderOptions.videoBitsPerSecond = VIDEO_EXPORT_BITRATE_MBPS * 1000 * 1000;

  const recorder = new MediaRecorder(stream, recorderOptions);
  const chunks = [];
  const recorderStopped = new Promise((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => reject(recorder.error ?? new Error("Video recording failed."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "video/webm" }));
  });

  try {
    recorder.start(250);
    await playCameraPath({
      keyframes,
      app,
      appearance,
      container,
      holdSeconds,
      onProgress,
      onFrame: copyFrame,
      syncZoomAtEnd: true,
    });
    copyFrame();
    await wait(Math.max(50, Math.round(1000 / VIDEO_EXPORT_FPS) * 2));
    recorder.stop();

    const blob = await recorderStopped;
    const extension = getVideoExtension(blob.type || recorder.mimeType || mimeType);
    const filename = `${getFileNameWithoutExtension(graphName ?? "graph")}_tracking_shot.${extension}`;
    triggerDownload(blob, filename);
    return { blob, filename };
  } catch (error) {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    throw error;
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
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

function runTimedStep({ durationMs, elapsedBeforeStep, totalMs, render, onProgress, onFrame, signal }) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();

    const tick = (now) => {
      try {
        throwIfAborted(signal);
        const rawT = durationMs <= 0 ? 1 : clamp((now - startTime) / durationMs, 0, 1);
        render(rawT);
        onFrame?.();
        if (totalMs > 0) {
          onProgress?.(clamp((elapsedBeforeStep + rawT * durationMs) / totalMs, 0, 1));
        }

        if (rawT < 1) {
          requestAnimationFrame(tick);
          return;
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    };

    requestAnimationFrame(tick);
  });
}

function ease(name, t) {
  const value = clamp(t, 0, 1);

  if (name === "linear") return value;
  if (name === "easeInOut") {
    return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }
  if (name === "smooth") {
    return value * value * (3 - 2 * value);
  }

  return value * value * value * (value * (value * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return finiteOr(a, 0) + (finiteOr(b, 0) - finiteOr(a, 0)) * t;
}

function lerpAngle(a, b, t) {
  const start = finiteOr(a, 0);
  const end = finiteOr(b, 0);
  const delta = Math.atan2(Math.sin(end - start), Math.cos(end - start));
  return start + delta * t;
}

function interpolateZoom(a, b, t) {
  const start = clamp(finiteOr(a, 1), MIN_ZOOM, MAX_ZOOM);
  const end = clamp(finiteOr(b, 1), MIN_ZOOM, MAX_ZOOM);
  return start * Math.pow(end / start, t);
}

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createKeyframeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `keyframe-${crypto.randomUUID()}`;
  }

  return `keyframe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getPixiCanvas(app) {
  return app?.canvas ?? app?.renderer?.canvas ?? null;
}

function getSupportedRecorderMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }
  return RECORDER_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function getVideoExtension(mimeType) {
  return mimeType?.includes("mp4") ? "mp4" : "webm";
}

function resolveCanvasBackground(canvas) {
  if (typeof window === "undefined") return "#ffffff";
  const candidates = [canvas, canvas?.parentElement, document.body, document.documentElement].filter(Boolean);

  for (const element of candidates) {
    const color = window.getComputedStyle(element).backgroundColor;
    if (color && !isTransparentCssColor(color)) {
      return color;
    }
  }

  return "#ffffff";
}

function isTransparentCssColor(color) {
  return color === "transparent" || color === "rgba(0, 0, 0, 0)" || color.endsWith(", 0)") || color.endsWith(" 0)");
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function throwIfAborted(signal) {
  if (!signal?.aborted) return;
  throw new DOMException("Camera path rendering was cancelled.", "AbortError");
}
