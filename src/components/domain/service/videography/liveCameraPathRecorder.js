import { playCameraPath, renderCameraPathFrameSchedule } from "./cameraPathPlayback.js";
import { createCameraPathTimeline, validateCameraPath } from "./cameraPathTimeline.js";
import { getViewMode } from "./cameraView.js";
import { createMp4CanvasEncoder } from "./mp4Encoding.js";
import { createWebMCanvasEncoder, VIDEO_ENCODER_ERROR_CODE } from "./videoEncoding.js";
import {
  VIDEO_EXPORT_FORMAT_DEFAULT,
  VIDEO_EXPORT_FORMAT_MP4,
  VIDEO_EXPORT_FORMAT_WEBM,
  VIDEO_EXPORT_FPS,
  VIDEO_EXPORT_QUALITY_DEFAULT,
  getVideoExportFormat,
  getVideoExportConfig,
} from "./videoExportConfig.js";
import {
  buildTrackingShotFilename,
  getSupportedRecorderMimeType,
  getVideoExtension,
  triggerDownload,
} from "./videoOutput.js";
import {
  createCanvasCaptureStream,
  createVideoFrameSchedule,
  getFrameScheduleDurationMs,
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
  exportFormat = VIDEO_EXPORT_FORMAT_DEFAULT,
  onProgress,
  onKeyframeEnter,
  onTransitionStart,
  onTransitionFrame,
  drawOverlay,
}) {
  validateCameraPath(keyframes, getViewMode(appearance));

  const sourceCanvas = getPixiCanvas(app);
  if (!sourceCanvas) {
    throw new Error("The graph canvas is not ready for video export.");
  }

  const exportConfig = getVideoExportConfig(exportQualityPreset);
  const outputContainer = getVideoExportContainer(container, exportConfig);
  const captureCanvas = createCaptureCanvas(outputContainer);

  const context = captureCanvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Could not prepare the video export canvas.");
  }

  const rendererScale = upscaleRendererForExport(app, container, outputContainer);
  const background = resolveCanvasBackground(sourceCanvas);
  const viewportTransform = getVideoViewportTransform(container, outputContainer);

  const drawFrame = (frame = {}) => {
    context.save();
    context.fillStyle = background;
    context.fillRect(0, 0, outputContainer.width, outputContainer.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      sourceCanvas,
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height,
      viewportTransform.x,
      viewportTransform.y,
      container.width * viewportTransform.k,
      container.height * viewportTransform.k,
    );
    context.translate(viewportTransform.x, viewportTransform.y);
    context.scale(viewportTransform.k, viewportTransform.k);
    drawOverlay?.(context, {
      ...frame,
      sourceContainer: container,
      outputContainer,
    });
    context.restore();
  };

  try {
    const normalizedFormat = getVideoExportFormat(exportFormat);
    if (normalizedFormat === VIDEO_EXPORT_FORMAT_MP4) {
      const mp4Result = await recordGpuFramesWithMp4Encoder({
        keyframes,
        app,
        appearance,
        container,
        graphName,
        holdSeconds,
        exportConfig,
        outputContainer,
        captureCanvas,
        drawFrame,
        onProgress,
        onKeyframeEnter,
        onTransitionStart,
        onTransitionFrame,
      });
      if (mp4Result) return mp4Result;
    }

    if (normalizedFormat === VIDEO_EXPORT_FORMAT_WEBM) {
      const webmResult = await recordGpuFramesWithWebCodecs({
        keyframes,
        app,
        appearance,
        container,
        graphName,
        holdSeconds,
        exportConfig,
        outputContainer,
        captureCanvas,
        drawFrame,
        onProgress,
        onKeyframeEnter,
        onTransitionStart,
        onTransitionFrame,
      });
      if (webmResult) return webmResult;
    }

    return await recordGpuFramesWithMediaRecorder({
      keyframes,
      app,
      appearance,
      container,
      captureCanvas,
      drawFrame,
      exportConfig,
      exportFormat: normalizedFormat,
      graphName,
      holdSeconds,
      onProgress,
      onKeyframeEnter,
      onTransitionStart,
      onTransitionFrame,
    });
  } finally {
    restoreRendererScale(app, container, rendererScale);
  }
}

async function recordGpuFramesWithMp4Encoder({
  keyframes,
  app,
  appearance,
  container,
  graphName,
  holdSeconds,
  exportConfig,
  outputContainer,
  captureCanvas,
  drawFrame,
  onProgress,
  onKeyframeEnter,
  onTransitionStart,
  onTransitionFrame,
}) {
  const encoder = await createMp4CanvasEncoder({
    canvas: captureCanvas,
    width: outputContainer.width,
    height: outputContainer.height,
    fps: VIDEO_EXPORT_FPS,
    bitrate: exportConfig.bitrateMbps * 1000 * 1000,
  });
  if (!encoder) return null;

  return recordGpuFramesWithOfflineEncoder({
    encoder,
    keyframes,
    app,
    appearance,
    container,
    graphName,
    holdSeconds,
    captureCanvas,
    drawFrame,
    onProgress,
    onKeyframeEnter,
    onTransitionStart,
    onTransitionFrame,
  });
}

async function recordGpuFramesWithWebCodecs({
  keyframes,
  app,
  appearance,
  container,
  graphName,
  holdSeconds,
  exportConfig,
  outputContainer,
  captureCanvas,
  drawFrame,
  onProgress,
  onKeyframeEnter,
  onTransitionStart,
  onTransitionFrame,
}) {
  const timeline = createCameraPathTimeline(keyframes, holdSeconds);
  const frameSchedule = createVideoFrameSchedule(timeline.totalMs, VIDEO_EXPORT_FPS);
  const encoder = await createWebMCanvasEncoder({
    width: outputContainer.width,
    height: outputContainer.height,
    fps: VIDEO_EXPORT_FPS,
    bitrate: exportConfig.bitrateMbps * 1000 * 1000,
    durationMs: getFrameScheduleDurationMs(frameSchedule),
  });
  if (!encoder) return null;

  try {
    return await recordGpuFramesWithOfflineEncoder({
      encoder,
      keyframes,
      app,
      appearance,
      container,
      graphName,
      holdSeconds,
      captureCanvas,
      drawFrame,
      onProgress,
      onKeyframeEnter,
      onTransitionStart,
      onTransitionFrame,
    });
  } catch (error) {
    if (error?.code === VIDEO_ENCODER_ERROR_CODE) return null;
    throw error;
  }
}

async function recordGpuFramesWithOfflineEncoder({
  encoder,
  keyframes,
  app,
  appearance,
  container,
  graphName,
  holdSeconds,
  captureCanvas,
  drawFrame,
  onProgress,
  onKeyframeEnter,
  onTransitionStart,
  onTransitionFrame,
}) {
  const timeline = createCameraPathTimeline(keyframes, holdSeconds);
  const frameSchedule = createVideoFrameSchedule(timeline.totalMs, VIDEO_EXPORT_FPS);

  try {
    await renderCameraPathFrameSchedule({
      keyframes,
      app,
      appearance,
      container,
      holdSeconds,
      frameSchedule,
      onProgress,
      onKeyframeEnter,
      onTransitionStart,
      onTransitionFrame,
      onFrame: async (frame) => {
        drawFrame(frame);
        await encoder.encodeCanvasFrame(captureCanvas, frame.frame);
      },
    });

    const blob = await encoder.finalize();
    const filename = buildTrackingShotFilename(graphName, encoder.extension);
    triggerDownload(blob, filename);
    return { blob, filename };
  } catch (error) {
    encoder.close();
    throw error;
  }
}

async function recordGpuFramesWithMediaRecorder({
  keyframes,
  app,
  appearance,
  container,
  captureCanvas,
  drawFrame,
  exportConfig,
  exportFormat,
  graphName,
  holdSeconds,
  onProgress,
  onKeyframeEnter,
  onTransitionStart,
  onTransitionFrame,
}) {
  if (typeof MediaRecorder === "undefined" || typeof captureCanvas.captureStream !== "function") {
    throw new Error("This browser does not support downloadable camera path video export.");
  }

  const { stream, requestFrame } = createCanvasCaptureStream(captureCanvas);
  const { recorder, recorderStopped } = createCanvasRecorder(stream, exportConfig, exportFormat);

  try {
    const recorderStarted = waitForRecorderStart(recorder);
    recorder.start(250);
    await recorderStarted;
    await playCameraPath({
      keyframes,
      app,
      appearance,
      container,
      holdSeconds,
      onProgress,
      onFrame: () => {
        drawFrame();
        requestFrame();
      },
      onKeyframeEnter,
      onTransitionStart,
      onTransitionFrame,
      syncZoomAtEnd: true,
    });
    drawFrame();
    requestFrame();
    await wait(Math.max(50, Math.round(1000 / VIDEO_EXPORT_FPS) * 2));
    recorder.stop();

    const blob = await recorderStopped;
    const extension = getVideoExtension(blob.type || recorder.mimeType);
    const filename = buildTrackingShotFilename(graphName, extension);
    triggerDownload(blob, filename);
    return { blob, filename };
  } catch (error) {
    if (recorder.state !== "inactive") recorder.stop();
    throw error;
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

function createCaptureCanvas(outputContainer) {
  const captureCanvas = document.createElement("canvas");
  captureCanvas.width = outputContainer.width;
  captureCanvas.height = outputContainer.height;
  return captureCanvas;
}

function createCanvasRecorder(stream, exportConfig, exportFormat) {
  const mimeType = getSupportedRecorderMimeType(exportFormat);
  if (!mimeType) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error(`This browser does not support ${exportFormat.toUpperCase()} video export.`);
  }
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
    recorder.onstop = () => {
      if (chunks.length === 0) {
        reject(new Error("No video frames were recorded."));
        return;
      }
      resolve(new Blob(chunks, { type: recorder.mimeType || mimeType }));
    };
  });

  return { recorder, recorderStopped };
}

function waitForRecorderStart(recorder) {
  if (recorder.state === "recording") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      recorder.removeEventListener("start", handleStart);
      recorder.removeEventListener("error", handleError);
    };
    const handleStart = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(recorder.error ?? new Error("Video recording failed to start."));
    };

    recorder.addEventListener("start", handleStart, { once: true });
    recorder.addEventListener("error", handleError, { once: true });
  });
}

function upscaleRendererForExport(app, container, outputContainer) {
  const targetResolution = Math.min(
    4,
    Math.max(outputContainer.width / Math.max(1, container.width), outputContainer.height / Math.max(1, container.height)),
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
