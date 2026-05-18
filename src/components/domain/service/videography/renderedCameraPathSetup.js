import { createCameraPathTimeline } from "./cameraPathTimeline.js";
import { createCameraPathFrameRenderer } from "./cameraPathFrameRenderer.js";
import {
  VIDEO_EXPORT_FPS,
  getVideoExportConfig,
} from "./videoExportConfig.js";
import {
  createVideoPreviewCanvas,
  createVideoFrameSchedule,
  getVideoExportContainer,
  getVideoPreviewContainer,
} from "./videoCanvas.js";

export function createRenderedCameraPathExportSetup({
  keyframes,
  app,
  container,
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
  background,
  drawOverlay,
}) {
  const exportConfig = getVideoExportConfig(exportQualityPreset);
  const outputContainer = getVideoExportContainer(container, exportConfig);
  const captureCanvas = document.createElement("canvas");
  captureCanvas.width = outputContainer.width;
  captureCanvas.height = outputContainer.height;

  const context = captureCanvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Could not prepare the video export canvas.");
  }

  const timeline = createCameraPathTimeline(keyframes, holdSeconds);
  const frameSchedule = createVideoFrameSchedule(timeline.totalMs, VIDEO_EXPORT_FPS);
  const frameRenderer = createRenderedFrameRenderer({
    app,
    container,
    outputContainer,
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
    background,
    drawOverlay,
  });

  return { captureCanvas, context, timeline, frameSchedule, frameRenderer, exportConfig };
}

export function createRenderedCameraPathPreviewSetup({
  keyframes,
  app,
  container,
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
}) {
  const outputContainer = getVideoPreviewContainer(container);
  const previewCanvas = createVideoPreviewCanvas(sourceCanvas, outputContainer);
  const context = previewCanvas.getContext("2d", { alpha: false });
  if (!context) {
    previewCanvas.remove();
    throw new Error("Could not prepare the video preview canvas.");
  }

  const timeline = createCameraPathTimeline(keyframes, holdSeconds);
  const frameRenderer = createRenderedFrameRenderer({
    app,
    container,
    outputContainer,
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
    drawOverlay,
  });

  return { previewCanvas, context, timeline, frameRenderer };
}

function createRenderedFrameRenderer({
  app,
  container,
  outputContainer,
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
  background,
  drawOverlay,
}) {
  return createCameraPathFrameRenderer({
    app,
    container,
    outputContainer,
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
    background,
    drawOverlay,
  });
}
