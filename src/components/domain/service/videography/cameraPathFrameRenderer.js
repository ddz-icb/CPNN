import { buildExportGridLines } from "../download/exportGrid.js";
import { build2DFrameGraphData, build3DFrameGraphData, renderGraphFrameToCanvas } from "../download/exportRender.js";
import { sampleCameraPathAtMs } from "./cameraPathTimeline.js";
import { getFrameRenderContext } from "./cameraPathFrameContext.js";
import { hasGraphData } from "./graphTransitionData.js";
import { VIEW_MODE_3D } from "./videoExportConfig.js";
import { get2DFrameTransform, getPixiCanvas, getVideoViewportTransform, resolveCanvasBackground } from "./videoCanvas.js";

export function createCameraPathFrameRenderer({
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
  showNodeLabels = false,
  enableShading = true,
  showGrid = false,
  gridLines = [],
  background,
  drawOverlay,
}) {
  const sourceCanvas = getPixiCanvas(app);
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
  const frameBackground = background ?? resolveCanvasBackground(sourceCanvas);
  let lastStaticKeyframe = null;
  let lastContext = null;

  return {
    drawFrameAtTime(context, timeline, timeMs) {
      const sample = sampleCameraPathAtMs(timeline, timeMs);
      if (!sample?.view) return;
      if (sample.stepType === "hold" && sample.keyframe === lastStaticKeyframe && context === lastContext) {
        return;
      }
      const frameContext = getFrameRenderContext(sample, fallbackRenderContext);

      context.save();
      context.fillStyle = frameBackground;
      context.fillRect(0, 0, outputContainer.width, outputContainer.height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.translate(viewportTransform.x, viewportTransform.y);
      context.scale(viewportTransform.k, viewportTransform.k);

      if (sample.mode === VIEW_MODE_3D) {
        renderFrame3D(context, sample, frameContext, container, frameGridLineCache);
      } else {
        renderFrame2D(context, sample, frameContext, container, frameGraph2DCache);
      }

      drawOverlay?.(context, { sample, frameContext, sourceContainer: container, outputContainer });
      context.restore();
      lastStaticKeyframe = sample.stepType === "hold" ? sample.keyframe : null;
      lastContext = context;
    },
  };
}

function renderFrame3D(context, sample, frameContext, container, frameGridLineCache) {
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
}

function renderFrame2D(context, sample, frameContext, container, frameGraph2DCache) {
  const frameGraph2D = getFrameGraph2D(frameContext.graphData, frameContext.nodeMap, frameContext.showNodeLabels, frameGraph2DCache);
  renderGraphFrameToCanvas(context, frameGraph2D, frameContext.drawParams, {
    transform: get2DFrameTransform(sample.view, container),
  });
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
