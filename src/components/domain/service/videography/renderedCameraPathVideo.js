import { playRenderedCameraPathPreview } from "./cameraPathFramePlayback.js";
import { validateCameraPath } from "./cameraPathTimeline.js";
import { getViewMode } from "./cameraView.js";
import { recordRenderedFramesWithMediaRecorder } from "./mediaRecorderVideoExport.js";
import {
  createRenderedCameraPathExportSetup,
  createRenderedCameraPathPreviewSetup,
} from "./renderedCameraPathSetup.js";
import { createWebMCanvasEncoder, VIDEO_ENCODER_ERROR_CODE } from "./videoEncoding.js";
import { createMp4CanvasEncoder } from "./mp4Encoding.js";
import {
  VIDEO_EXPORT_FORMAT_DEFAULT,
  VIDEO_EXPORT_FORMAT_MP4,
  VIDEO_EXPORT_FORMAT_WEBM,
  VIDEO_EXPORT_FPS,
  VIDEO_EXPORT_QUALITY_DEFAULT,
  getVideoExportFormat,
} from "./videoExportConfig.js";
import {
  getFrameScheduleDurationMs,
  getPixiCanvas,
  resolveCanvasBackground,
} from "./videoCanvas.js";
import {
  buildTrackingShotFilename,
  getSupportedRecorderMimeType,
  triggerDownload,
} from "./videoOutput.js";

export async function recordCameraPathVideo({
  keyframes,
  app,
  appearance,
  container,
  sceneContainer = container,
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
  exportFormat = VIDEO_EXPORT_FORMAT_DEFAULT,
  validateCurrentMode = true,
  drawOverlay,
  onProgress,
}) {
  validateCameraPath(keyframes, validateCurrentMode ? getViewMode(appearance) : null);
  assertGraphDataReady(graphData, "export");

  const sourceCanvas = getPixiCanvas(app);
  const exportSetup = createRenderedCameraPathExportSetup({
    keyframes,
    app,
    container,
    sceneContainer,
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
    holdSeconds,
    exportQualityPreset,
    background: resolveCanvasBackground(sourceCanvas),
    drawOverlay,
  });

  if (getVideoExportFormat(exportFormat) === VIDEO_EXPORT_FORMAT_MP4) {
    return recordRenderedCameraPathMp4({ ...exportSetup, graphName, onProgress });
  }

  return recordRenderedCameraPathWebm({ ...exportSetup, graphName, onProgress });
}

export async function previewCameraPathVideo({
  keyframes,
  app,
  container,
  sceneContainer = container,
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
  drawOverlay,
  onFrame,
  onProgress,
  signal,
}) {
  validateCameraPath(keyframes, null);
  assertGraphDataReady(graphData, "preview");

  const sourceCanvas = getPixiCanvas(app);
  if (!sourceCanvas) {
    throw new Error("The graph canvas is not ready for video preview.");
  }

  const { previewCanvas, panelCanvas, context, timeline, frameRenderer } = createRenderedCameraPathPreviewSetup({
    keyframes,
    app,
    container,
    sceneContainer,
    sourceCanvas,
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
    holdSeconds,
    drawOverlay,
  });

  try {
    await playRenderedCameraPathPreview({
      context,
      timeline,
      totalMs: timeline.totalMs,
      frameRenderer,
      onFrame,
      onProgress,
      signal,
    });
  } finally {
    previewCanvas.remove();
    panelCanvas?.remove();
  }
}

async function recordRenderedCameraPathMp4({ captureCanvas, context, timeline, frameSchedule, frameRenderer, exportConfig, graphName, onProgress }) {
  const mp4Encoder = await createMp4CanvasEncoder({
    canvas: captureCanvas,
    width: captureCanvas.width,
    height: captureCanvas.height,
    fps: VIDEO_EXPORT_FPS,
    bitrate: exportConfig.bitrateMbps * 1000 * 1000,
  });
  if (mp4Encoder) {
    try {
      return await recordRenderedFramesWithEncoder(mp4Encoder, { captureCanvas, context, timeline, frameSchedule, frameRenderer, graphName, onProgress });
    } catch (error) {
      mp4Encoder.close();
      if (!getSupportedRecorderMimeType(VIDEO_EXPORT_FORMAT_MP4)) throw error;
    }
  }
  const mp4MimeType = getSupportedRecorderMimeType(VIDEO_EXPORT_FORMAT_MP4);
  if (!mp4MimeType) {
    throw new Error("This browser does not support MP4 video export. Choose WebM, or use a browser with MP4 MediaRecorder support.");
  }

  return recordRenderedFramesWithMediaRecorder({
    captureCanvas,
    context,
    timeline,
    frameSchedule,
    frameRenderer,
    mimeType: mp4MimeType,
    bitrate: exportConfig.bitrateMbps * 1000 * 1000,
    graphName,
    onProgress,
  });
}

async function recordRenderedCameraPathWebm({ captureCanvas, context, timeline, frameSchedule, frameRenderer, exportConfig, graphName, onProgress }) {
  const webmEncoder = await createWebMCanvasEncoder({
    width: captureCanvas.width,
    height: captureCanvas.height,
    fps: VIDEO_EXPORT_FPS,
    bitrate: exportConfig.bitrateMbps * 1000 * 1000,
    durationMs: getFrameScheduleDurationMs(frameSchedule),
  });

  if (!webmEncoder) {
    return recordRenderedCameraPathWebmWithMediaRecorder({
      captureCanvas,
      context,
      timeline,
      frameSchedule,
      frameRenderer,
      exportConfig,
      graphName,
      onProgress,
    });
  }

  try {
    return await recordRenderedFramesWithEncoder(webmEncoder, { captureCanvas, context, timeline, frameSchedule, frameRenderer, graphName, onProgress });
  } catch (error) {
    webmEncoder.close();
    if (error?.code === VIDEO_ENCODER_ERROR_CODE) {
      return recordRenderedCameraPathWebmWithMediaRecorder({
        captureCanvas,
        context,
        timeline,
        frameSchedule,
        frameRenderer,
        exportConfig,
        graphName,
        onProgress,
      });
    }
    throw error;
  }
}

async function recordRenderedFramesWithEncoder(encoder, { captureCanvas, context, timeline, frameSchedule, frameRenderer, graphName, onProgress }) {
  for (let frameIndex = 0; frameIndex < frameSchedule.length; frameIndex += 1) {
    const frame = frameSchedule[frameIndex];
    frameRenderer.drawFrameAtTime(context, timeline, frame.timeMs);
    await encoder.encodeCanvasFrame(captureCanvas, frame);
    onProgress?.(frameSchedule.length <= 1 ? 1 : frameIndex / (frameSchedule.length - 1));
  }

  const blob = await encoder.finalize();
  const filename = buildTrackingShotFilename(graphName, encoder.extension);
  triggerDownload(blob, filename);
  onProgress?.(1);
  return { blob, filename };
}

function recordRenderedCameraPathWebmWithMediaRecorder({
  captureCanvas,
  context,
  timeline,
  frameSchedule,
  frameRenderer,
  exportConfig,
  graphName,
  onProgress,
}) {
  const webmMimeType = getSupportedRecorderMimeType(VIDEO_EXPORT_FORMAT_WEBM);
  if (!webmMimeType) {
    throw new Error("This browser does not support video export. Use a browser with WebCodecs or MediaRecorder video support.");
  }

  return recordRenderedFramesWithMediaRecorder({
    captureCanvas,
    context,
    timeline,
    frameSchedule,
    frameRenderer,
    mimeType: webmMimeType,
    bitrate: exportConfig.bitrateMbps * 1000 * 1000,
    graphName,
    onProgress,
  });
}

function assertGraphDataReady(graphData, action) {
  if (!graphData?.nodes || !graphData?.links) {
    throw new Error(`The graph data is not ready for video ${action}.`);
  }
}
