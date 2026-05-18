import { playCameraPath } from "./cameraPathPlayback.js";
import { validateCameraPath } from "./cameraPathTimeline.js";
import { getViewMode } from "./cameraView.js";
import {
  VIDEO_EXPORT_FPS,
  VIDEO_EXPORT_QUALITY_DEFAULT,
  getVideoExportConfig,
} from "./videoExportConfig.js";
import {
  buildTrackingShotFilename,
  getSupportedRecorderMimeType,
  getVideoExtension,
  triggerDownload,
} from "./videoOutput.js";
import {
  getPixiCanvas,
  getVideoExportContainer,
  getVideoViewportTransform,
  resolveCanvasBackground,
  wait,
} from "./videoCanvas.js";

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

  const exportConfig = getVideoExportConfig(exportQualityPreset);
  const outputContainer = getVideoExportContainer(container, exportConfig);
  const captureCanvas = createCaptureCanvas(outputContainer);

  if (typeof captureCanvas.captureStream !== "function") {
    throw new Error("This browser does not support downloadable camera path video export.");
  }

  const context = captureCanvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Could not prepare the video export canvas.");
  }

  const rendererScale = upscaleRendererForExport(app, container, outputContainer);
  const background = resolveCanvasBackground(sourceCanvas);
  const viewportTransform = getVideoViewportTransform(container, outputContainer);
  const stream = captureCanvas.captureStream(VIDEO_EXPORT_FPS);
  const requestFrame = () => stream.getVideoTracks().forEach((track) => track.requestFrame?.());
  const { recorder, recorderStopped } = createCanvasRecorder(stream, exportConfig);

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
    const extension = getVideoExtension(blob.type || recorder.mimeType);
    const filename = buildTrackingShotFilename(graphName, extension);
    triggerDownload(blob, filename);
    return { blob, filename };
  } catch (error) {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    throw error;
  } finally {
    stream.getTracks().forEach((track) => track.stop());
    restoreRendererScale(app, container, rendererScale);
  }
}

function createCaptureCanvas(outputContainer) {
  const captureCanvas = document.createElement("canvas");
  captureCanvas.width = outputContainer.width;
  captureCanvas.height = outputContainer.height;
  return captureCanvas;
}

function createCanvasRecorder(stream, exportConfig) {
  const mimeType = getSupportedRecorderMimeType();
  const recorderOptions = {
    videoBitsPerSecond: exportConfig.bitrateMbps * 1000 * 1000,
  };
  if (mimeType) recorderOptions.mimeType = mimeType;

  const recorder = new MediaRecorder(stream, recorderOptions);
  const chunks = [];
  const recorderStopped = new Promise((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => reject(recorder.error ?? new Error("Video recording failed."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "video/webm" }));
  });

  return { recorder, recorderStopped };
}

function upscaleRendererForExport(app, container, outputContainer) {
  const targetResolution = Math.min(
    4,
    Math.ceil(Math.max(outputContainer.width / Math.max(1, container.width), outputContainer.height / Math.max(1, container.height))),
  );
  const originalResolution = typeof app?.renderer?.resolution === "number" ? app.renderer.resolution : 1;
  const shouldUpscale = targetResolution > originalResolution && typeof app?.renderer?.resize === "function";

  if (shouldUpscale) {
    app.renderer.resolution = targetResolution;
    app.renderer.resize(container.width, container.height);
  }

  return { originalResolution, shouldUpscale };
}

function restoreRendererScale(app, container, rendererScale) {
  if (!rendererScale?.shouldUpscale) return;

  app.renderer.resolution = rendererScale.originalResolution;
  app.renderer.resize(container.width, container.height);
  try {
    app.renderer.render(app.stage);
  } catch (_) {}
}
