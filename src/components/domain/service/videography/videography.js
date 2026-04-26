import * as d3 from "d3";
import { defaultCamera } from "../canvas_drawing/render3D.js";
import { getFileNameWithoutExtension } from "../parsing/fileParsing.js";
import { buildExportGridLines } from "../download/exportGrid.js";
import { build2DFrameGraphData, build3DFrameGraphData, renderGraphFrameToCanvas } from "../download/exportRender.js";
import { createWebMCanvasEncoder } from "./videoEncoding.js";

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
  transitionSeconds: { min: 0.05, max: 20, step: 0.25 },
  holdSeconds: { min: 0, max: 3, step: 0.05 },
};

export const VIDEO_EXPORT_FPS = 60;
export const VIDEO_EXPORT_QUALITY_DEFAULT = "default";
export const VIDEO_EXPORT_QUALITY_HIGH = "high";

export const VIDEO_EXPORT_QUALITY_OPTIONS = [
  { value: VIDEO_EXPORT_QUALITY_DEFAULT, label: "Default (1440p)" },
  { value: VIDEO_EXPORT_QUALITY_HIGH, label: "High Quality (4K)" },
];

const VIDEO_EXPORT_PRESETS = {
  [VIDEO_EXPORT_QUALITY_DEFAULT]: {
    targetArea: 2560 * 1440,
    maxEdge: 2560,
    bitrateMbps: 16,
  },
  [VIDEO_EXPORT_QUALITY_HIGH]: {
    targetArea: 3840 * 2160,
    maxEdge: 3840,
    bitrateMbps: 32,
  },
};

const VIDEO_KEYFRAME_INTERVAL_SECONDS = 2;

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 50;
const MIN_FOV = 120;
const MAX_FOV = 2400;
const RECORDER_MIME_TYPES = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4;codecs=h264", "video/mp4"];

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

export function getVideoExportQualityPreset(value) {
  return VIDEO_EXPORT_PRESETS[value] ? value : VIDEO_EXPORT_QUALITY_DEFAULT;
}

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

export async function recordCameraPathSceneVideo({
  keyframes,
  app,
  appearance,
  container,
  graphName,
  holdSeconds = 0,
  exportQualityPreset = VIDEO_EXPORT_QUALITY_DEFAULT,
  onProgress,
  onKeyframeEnter,
  onTransitionStart,
  onTransitionFrame,
  drawOverlay,
}) {
  validateCameraPath(keyframes, getViewMode(appearance));

  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser does not support downloadable camera path video export.");
  }

  const sourceCanvas = getPixiCanvas(app);
  if (!sourceCanvas) {
    throw new Error("The graph canvas is not ready for video export.");
  }

  if (typeof sourceCanvas.captureStream !== "function") {
    throw new Error("This browser does not support downloadable camera path video export.");
  }

  const exportConfig = getVideoExportConfig(exportQualityPreset);
  const outputContainer = getVideoExportContainer(container, exportConfig);

  // Temporarily increase the Pixi renderer resolution so the source canvas has
  // native pixels for the target output size rather than being upscaled from viewport res.
  const targetResolution = Math.min(
    4,
    Math.ceil(Math.max(outputContainer.width / Math.max(1, container.width), outputContainer.height / Math.max(1, container.height))),
  );
  const originalResolution = typeof app?.renderer?.resolution === "number" ? app.renderer.resolution : 1;
  const shouldUpscaleRenderer = targetResolution > originalResolution && typeof app?.renderer?.resize === "function";

  if (shouldUpscaleRenderer) {
    app.renderer.resolution = targetResolution;
    app.renderer.resize(container.width, container.height);
  }

  const captureCanvas = document.createElement("canvas");
  captureCanvas.width = outputContainer.width;
  captureCanvas.height = outputContainer.height;

  const context = captureCanvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Could not prepare the video export canvas.");
  }

  const background = resolveCanvasBackground(sourceCanvas);
  const viewportTransform = getVideoViewportTransform(container, outputContainer);
  const stream = captureCanvas.captureStream(VIDEO_EXPORT_FPS);
  const requestFrame = () => {
    stream.getVideoTracks().forEach((track) => track.requestFrame?.());
  };

  const mimeType = getSupportedRecorderMimeType();
  const recorderOptions = {};
  if (mimeType) recorderOptions.mimeType = mimeType;
  recorderOptions.videoBitsPerSecond = exportConfig.bitrateMbps * 1000 * 1000;

  const recorder = new MediaRecorder(stream, recorderOptions);
  const chunks = [];
  const recorderStopped = new Promise((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => reject(recorder.error ?? new Error("Video recording failed."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "video/webm" }));
  });

  const drawFrame = () => {
    context.save();
    context.fillStyle = background;
    context.fillRect(0, 0, outputContainer.width, outputContainer.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.translate(viewportTransform.x, viewportTransform.y);
    context.scale(viewportTransform.k, viewportTransform.k);
    context.drawImage(sourceCanvas, 0, 0, container.width, container.height);
    drawOverlay?.(context);
    context.restore();
    requestFrame();
  };

  try {
    recorder.start(250);
    await playCameraPath({
      keyframes,
      app,
      appearance,
      container,
      holdSeconds,
      onProgress,
      onFrame: drawFrame,
      onKeyframeEnter,
      onTransitionStart,
      onTransitionFrame,
      syncZoomAtEnd: true,
    });
    drawFrame();
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
    if (shouldUpscaleRenderer) {
      app.renderer.resolution = originalResolution;
      app.renderer.resize(container.width, container.height);
      try {
        app.renderer.render(app.stage);
      } catch (_) {}
    }
  }
}

export async function recordCameraPathVideo({
  keyframes,
  app,
  appearance,
  container,
  graphName,
  graphData,
  nodeMap,
  linkWidth,
  linkColorscheme,
  linkAttribsToColorIndices,
  circleBorderColor,
  textColor,
  nodeColorscheme,
  nodeAttribsToColorIndices,
  highlightColor,
  communityHighlightColor,
  showNodeLabels = false,
  enableShading = true,
  showGrid = false,
  gridLines = [],
  holdSeconds = 0,
  exportQualityPreset = VIDEO_EXPORT_QUALITY_DEFAULT,
  validateCurrentMode = true,
  drawOverlay,
  onProgress,
}) {
  validateCameraPath(keyframes, validateCurrentMode ? getViewMode(appearance) : null);

  if (!graphData?.nodes || !graphData?.links) {
    throw new Error("The graph data is not ready for video export.");
  }

  const sourceCanvas = getPixiCanvas(app);
  const captureCanvas = document.createElement("canvas");
  const exportConfig = getVideoExportConfig(exportQualityPreset);
  const outputContainer = getVideoExportContainer(container, exportConfig);
  captureCanvas.width = outputContainer.width;
  captureCanvas.height = outputContainer.height;

  const context = captureCanvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Could not prepare the video export canvas.");
  }

  const background = resolveCanvasBackground(sourceCanvas);
  const timeline = createCameraPathTimeline(keyframes, holdSeconds);
  const totalMs = timeline.totalMs;
  const frameSchedule = createVideoFrameSchedule(totalMs, VIDEO_EXPORT_FPS);
  const viewportTransform = getVideoViewportTransform(container, outputContainer);
  const frameGraph2DCache = new WeakMap();
  const frameGridLineCache = new WeakMap();

  const fallbackRenderContext = {
    graphData,
    nodeMap,
    linkWidth,
    linkColorscheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    textColor,
    nodeColorscheme,
    nodeAttribsToColorIndices,
    highlightColor,
    communityHighlightColor,
    showNodeLabels,
    enableShading,
    showGrid,
    gridLines,
    container,
  };

  const drawFrameAtTime = (timeMs) => {
    const sample = sampleCameraPathAtMs(timeline, timeMs);
    if (!sample?.view) return;
    const frameContext = getFrameRenderContext(sample, fallbackRenderContext);

    context.save();
    context.fillStyle = background;
    context.fillRect(0, 0, outputContainer.width, outputContainer.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.translate(viewportTransform.x, viewportTransform.y);
    context.scale(viewportTransform.k, viewportTransform.k);

    if (sample.mode === VIEW_MODE_3D) {
      const frameGridLines = frameContext.showGrid ? getFrameGridLines(frameContext.graphData, frameContext, frameGridLineCache) : [];
      const { graph, gridSegments } = build3DFrameGraphData(frameContext.graphData, frameContext.nodeMap, {
        camera: sample.view,
        sourceContainer: container,
        targetContainer: container,
        showNodeLabels: frameContext.showNodeLabels,
        gridLines: frameGridLines,
      });
      renderGraphFrameToCanvas(context, graph, frameContext.drawParams, {
        threeD: true,
        enableShading: frameContext.enableShading,
        showGrid: frameContext.showGrid,
        gridSegments,
      });
    } else {
      const frameGraph2D = getFrameGraph2D(frameContext.graphData, frameContext.nodeMap, frameContext.showNodeLabels, frameGraph2DCache);
      renderGraphFrameToCanvas(context, frameGraph2D, frameContext.drawParams, {
        transform: get2DFrameTransform(sample.view, container),
      });
    }

    drawOverlay?.(context, { sample, frameContext, sourceContainer: container, outputContainer });
    context.restore();
  };
  const webmEncoder = await createWebMCanvasEncoder({
    width: outputContainer.width,
    height: outputContainer.height,
    fps: VIDEO_EXPORT_FPS,
    bitrate: exportConfig.bitrateMbps * 1000 * 1000,
    durationMs: getFrameScheduleDurationMs(frameSchedule),
  });

  if (!webmEncoder) {
    throw new Error("This browser does not support deterministic video export. Use a browser with WebCodecs support.");
  }

  try {
    for (let frameIndex = 0; frameIndex < frameSchedule.length; frameIndex += 1) {
      const frame = frameSchedule[frameIndex];
      drawFrameAtTime(frame.timeMs);
      await webmEncoder.encodeCanvasFrame(captureCanvas, frame);
      onProgress?.(frameSchedule.length <= 1 ? 1 : frameIndex / (frameSchedule.length - 1));
    }

    const blob = await webmEncoder.finalize();
    const filename = `${getFileNameWithoutExtension(graphName ?? "graph")}_tracking_shot.${webmEncoder.extension}`;
    triggerDownload(blob, filename);
    onProgress?.(1);
    return { blob, filename };
  } catch (error) {
    webmEncoder.close();
    throw error;
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

function getFrameRenderContext(sample, fallback) {
  const keyframe = sample?.stepType === "transition" ? sample.to : sample?.keyframe ?? sample?.to ?? sample?.from;
  const scene = keyframe?.scene ?? {};
  const usesSnapshotGraph = hasGraphData(scene.graphSnapshot);
  const frameGraphData = usesSnapshotGraph ? scene.graphSnapshot : fallback.graphData;
  const appearance = scene.appearanceSnapshot ?? {};
  const colorscheme = scene.colorschemeSnapshot ?? {};
  const theme = scene.themeSnapshot ?? {};
  const communityHighlightNodeIds = getCommunityHighlightNodeIds(scene.communitySnapshot);

  const frameLinkWidth = finiteNumberOr(appearance.linkWidth, fallback.linkWidth);
  const frameLinkColorscheme = getColorschemeData(colorscheme.linkColorscheme, fallback.linkColorscheme);
  const frameNodeColorscheme = getColorschemeData(colorscheme.nodeColorscheme, fallback.nodeColorscheme);
  const frameLinkAttribsToColorIndices = getColorIndexMap(colorscheme.linkAttribsToColorIndices, fallback.linkAttribsToColorIndices);
  const frameNodeAttribsToColorIndices = getColorIndexMap(colorscheme.nodeAttribsToColorIndices, fallback.nodeAttribsToColorIndices);

  return {
    graphData: frameGraphData,
    nodeMap: usesSnapshotGraph ? null : fallback.nodeMap,
    gridLines: usesSnapshotGraph ? [] : fallback.gridLines,
    showNodeLabels: typeof appearance.showNodeLabels === "boolean" ? appearance.showNodeLabels : fallback.showNodeLabels,
    enableShading: typeof appearance.enable3DShading === "boolean" ? appearance.enable3DShading : fallback.enableShading,
    showGrid: typeof appearance.show3DGrid === "boolean" ? appearance.show3DGrid : fallback.showGrid,
    container: fallback.container,
    drawParams: {
      linkWidth: frameLinkWidth,
      linkColorscheme: frameLinkColorscheme,
      linkAttribsToColorIndices: frameLinkAttribsToColorIndices,
      circleBorderColor: theme.circleBorderColor ?? fallback.circleBorderColor,
      textColor: theme.textColor ?? fallback.textColor,
      nodeColorscheme: frameNodeColorscheme,
      nodeAttribsToColorIndices: frameNodeAttribsToColorIndices,
      highlightNodeIds: Array.isArray(scene.searchSnapshot?.highlightedNodeIds) ? scene.searchSnapshot.highlightedNodeIds : [],
      communityHighlightNodeIds,
      highlightColor: theme.highlightColor ?? fallback.highlightColor,
      communityHighlightColor: theme.communityHighlightColor ?? fallback.communityHighlightColor,
    },
  };
}

function getFrameGraph2D(graphData, nodeMap, showNodeLabels, cache) {
  if (!hasGraphData(graphData)) return null;

  let graphCache = cache.get(graphData);
  if (!graphCache) {
    graphCache = new Map();
    cache.set(graphData, graphCache);
  }

  const cacheKey = showNodeLabels ? "labels" : "no-labels";
  if (!graphCache.has(cacheKey)) {
    graphCache.set(cacheKey, build2DFrameGraphData(graphData, nodeMap, { showNodeLabels }));
  }

  return graphCache.get(cacheKey);
}

function getFrameGridLines(graphData, frameContext, cache) {
  if (!hasGraphData(graphData)) return [];
  if (Array.isArray(frameContext.gridLines) && frameContext.gridLines.length > 0) {
    return frameContext.gridLines;
  }
  if (!cache.has(graphData)) {
    cache.set(graphData, buildExportGridLines(graphData, frameContext.container));
  }
  return cache.get(graphData);
}

function hasGraphData(graphData) {
  return Array.isArray(graphData?.nodes) && Array.isArray(graphData?.links);
}

function getColorschemeData(snapshotColorscheme, fallbackColorscheme) {
  if (Array.isArray(snapshotColorscheme)) return snapshotColorscheme;
  if (Array.isArray(snapshotColorscheme?.data)) return snapshotColorscheme.data;
  if (Array.isArray(fallbackColorscheme)) return fallbackColorscheme;
  if (Array.isArray(fallbackColorscheme?.data)) return fallbackColorscheme.data;
  return [];
}

function getColorIndexMap(snapshotMap, fallbackMap) {
  const normalizedSnapshot = normalizeColorIndexMap(snapshotMap);
  if (Object.keys(normalizedSnapshot).length > 0) return normalizedSnapshot;
  const normalizedFallback = normalizeColorIndexMap(fallbackMap);
  if (Object.keys(normalizedFallback).length > 0) return normalizedFallback;
  return {};
}

function normalizeColorIndexMap(mapping) {
  if (!mapping || typeof mapping !== "object") return {};
  return Object.fromEntries(
    Object.entries(mapping)
      .filter(([key, value]) => key !== "length" && Number.isFinite(Number.parseInt(value, 10)))
      .map(([key, value]) => [key, Number.parseInt(value, 10)]),
  );
}

function getCommunityHighlightNodeIds(communitySnapshot) {
  const selectedCommunityId = communitySnapshot?.selectedCommunityId;
  if (selectedCommunityId == null || !communitySnapshot?.communityToNodeIds) return [];

  const directMatch = communitySnapshot.communityToNodeIds[selectedCommunityId];
  if (Array.isArray(directMatch)) return directMatch;

  const stringMatch = communitySnapshot.communityToNodeIds[String(selectedCommunityId)];
  return Array.isArray(stringMatch) ? stringMatch : [];
}

function finiteNumberOr(value, fallback) {
  const parsed = Number.parseFloat(value);
  if (Number.isFinite(parsed)) return parsed;
  const fallbackParsed = Number.parseFloat(fallback);
  return Number.isFinite(fallbackParsed) ? fallbackParsed : 0;
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

function getVideoExportContainer(container, exportConfig = VIDEO_EXPORT_PRESETS[VIDEO_EXPORT_QUALITY_DEFAULT]) {
  const safeWidth = Math.max(1, finiteOr(container?.width, 1));
  const safeHeight = Math.max(1, finiteOr(container?.height, 1));
  const aspectRatio = safeWidth / safeHeight;
  const targetArea = Math.max(1, finiteOr(exportConfig?.targetArea, VIDEO_EXPORT_PRESETS[VIDEO_EXPORT_QUALITY_DEFAULT].targetArea));
  const maxEdge = Math.max(2, finiteOr(exportConfig?.maxEdge, VIDEO_EXPORT_PRESETS[VIDEO_EXPORT_QUALITY_DEFAULT].maxEdge));

  let width;
  let height;

  if (aspectRatio >= 1) {
    width = Math.min(maxEdge, Math.round(Math.sqrt(targetArea * aspectRatio)));
    height = Math.round(width / aspectRatio);
  } else {
    height = Math.min(maxEdge, Math.round(Math.sqrt(targetArea / aspectRatio)));
    width = Math.round(height * aspectRatio);
  }

  return {
    width: toEven(Math.max(2, width)),
    height: toEven(Math.max(2, height)),
  };
}

function get2DFrameTransform(view, container) {
  const zoom = clamp(finiteOr(view?.zoom, 1), MIN_ZOOM, MAX_ZOOM);

  return {
    x: container.width / 2 - finiteOr(view?.centerX, 0) * zoom,
    y: container.height / 2 - finiteOr(view?.centerY, 0) * zoom,
    k: zoom,
  };
}

function getVideoViewportTransform(sourceContainer, targetContainer) {
  const sourceWidth = Math.max(1, finiteOr(sourceContainer?.width, 1));
  const sourceHeight = Math.max(1, finiteOr(sourceContainer?.height, 1));
  const targetWidth = Math.max(1, finiteOr(targetContainer?.width, 1));
  const targetHeight = Math.max(1, finiteOr(targetContainer?.height, 1));
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);

  return {
    x: (targetWidth - sourceWidth * scale) / 2,
    y: (targetHeight - sourceHeight * scale) / 2,
    k: scale,
  };
}

function getVideoExportConfig(preset) {
  return VIDEO_EXPORT_PRESETS[getVideoExportQualityPreset(preset)];
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

function toEven(value) {
  return value % 2 === 0 ? value : value - 1;
}

function createVideoFrameSchedule(totalMs, fps) {
  const totalFrames = Math.max(2, Math.ceil((totalMs / 1000) * fps) + 1);
  const keyFrameInterval = Math.max(1, Math.round(fps * VIDEO_KEYFRAME_INTERVAL_SECONDS));
  const fallbackDurationUs = Math.max(1, Math.round(1000000 / fps));
  const frameTimesMs = Array.from({ length: totalFrames }, (_, frameIndex) =>
    totalFrames <= 1 ? 0 : Math.min((frameIndex / (totalFrames - 1)) * totalMs, totalMs),
  );

  return frameTimesMs.map((timeMs, frameIndex) => {
    const nextTimeMs = frameTimesMs[frameIndex + 1] ?? timeMs + 1000 / fps;
    return {
      timeMs,
      timestampUs: Math.max(0, Math.round(timeMs * 1000)),
      durationUs: Math.max(1, Math.round((nextTimeMs - timeMs) * 1000) || fallbackDurationUs),
      keyFrame: frameIndex === 0 || frameIndex === totalFrames - 1 || frameIndex % keyFrameInterval === 0,
    };
  });
}

function getFrameScheduleDurationMs(frameSchedule) {
  const lastFrame = frameSchedule?.[frameSchedule.length - 1];
  if (!lastFrame) return 0;
  return (lastFrame.timestampUs + lastFrame.durationUs) / 1000;
}

function throwIfAborted(signal) {
  if (!signal?.aborted) return;
  throw new DOMException("Camera path rendering was cancelled.", "AbortError");
}
