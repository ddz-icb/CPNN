import { createCameraPathTimeline } from "./cameraPathTimeline.js";
import { createCameraPathFrameRenderer } from "./cameraPathFrameRenderer.js";
import {
  VIDEO_EXPORT_FPS,
  getVideoExportConfig,
} from "./videoExportConfig.js";
import {
  createVideoPreviewCanvas,
  createVideoPreviewPanelCanvas,
  createVideoFrameSchedule,
  getVideoExportContainer,
  getVideoPreviewContainer,
  getVideoViewportTransform,
} from "./videoCanvas.js";

export function createRenderedCameraPathExportSetup({
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
  showNodeLabels,
  enableShading,
  showGrid,
  gridLines,
  holdSeconds,
  exportQualityPreset,
  exportBitrateMbps,
  background,
  drawOverlay,
}) {
  const exportConfig = getVideoExportConfig(exportQualityPreset, exportBitrateMbps);
  const outputContainer = getVideoExportContainer(sceneContainer, exportConfig);
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
    sceneContainer,
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
  sceneContainer = container,
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
  const outputContainer = getVideoPreviewContainer(sceneContainer);
  const previewCanvas = createVideoPreviewCanvas(sourceCanvas, outputContainer);
  const context = previewCanvas.getContext("2d", { alpha: false });
  if (!context) {
    previewCanvas.remove();
    throw new Error("Could not prepare the video preview canvas.");
  }
  const panelCanvas = drawOverlay ? createVideoPreviewPanelCanvas(outputContainer) : null;
  const panelContext = panelCanvas?.getContext("2d");
  if (panelCanvas && !panelContext) {
    previewCanvas.remove();
    panelCanvas.remove();
    throw new Error("Could not prepare the video node information panel.");
  }
  const viewportTransform = getVideoViewportTransform(sceneContainer, outputContainer);
  const drawPreviewOverlay = panelContext && drawOverlay ? (_context, frame) => {
    panelContext.clearRect(0, 0, outputContainer.width, outputContainer.height);
    panelContext.save();
    panelContext.translate(viewportTransform.x, viewportTransform.y);
    panelContext.scale(viewportTransform.k, viewportTransform.k);
    drawOverlay(panelContext, frame);
    panelContext.restore();
  } : null;

  const timeline = createCameraPathTimeline(keyframes, holdSeconds);
  const frameRenderer = createRenderedFrameRenderer({
    app,
    container,
    sceneContainer,
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
    drawOverlay: drawPreviewOverlay,
  });

  return { previewCanvas, panelCanvas, context, timeline, frameRenderer };
}

function createRenderedFrameRenderer({
  app,
  container,
  sceneContainer,
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
    sceneContainer,
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
