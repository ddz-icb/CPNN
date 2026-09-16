import { getFileNameWithoutExtension } from "../parsing/fileParsing.js";
import { buildExportGraphData } from "./exportGraph.js";
import { build3DRenderQueue, createSvgContext, measureGraphBounds, render2DGraph, render3DQueue } from "./exportRender.js";
import { buildExportGridLines } from "./exportGrid.js";
import { projectGridLines } from "./exportProjection.js";
import { triggerDownload } from "./fileDownload.js";

function serializeSvgElement(svgElement, serializer = globalThis.XMLSerializer) {
  if (typeof serializer === "function") {
    return new serializer().serializeToString(svgElement);
  }
  if (typeof serializer?.serializeToString === "function") {
    return serializer.serializeToString(svgElement);
  }
  throw new Error("XMLSerializer is unavailable.");
}

function createGraphSvgElement(
  graphData,
  nodeMap,
  linkWidth,
  linkColorscheme,
  linkAttribsToColorIndices,
  circleBorderColor,
  textColor,
  nodeColorscheme,
  nodeAttribsToColorIndices,
  options = {},
) {
  const {
    threeD = false,
    enableShading = true,
    showGrid = false,
    gridSegments = [],
    highlightNodeIds = [],
    highlightLinkIds = [],
    communityHighlightNodeIds = [],
    highlightColor,
    communityHighlightColor,
    canvasFactory,
  } = options;
  const bounds = measureGraphBounds(graphData, nodeMap, { extraSegments: gridSegments });
  const { ctx, svgElement } = createSvgContext(bounds, canvasFactory);
  const highlightParams = {
    highlightNodeIds,
    highlightLinkIds,
    communityHighlightNodeIds,
    highlightColor,
    communityHighlightColor,
  };

  if (threeD) {
    const queue = build3DRenderQueue(graphData, nodeMap);
    render3DQueue(
      ctx,
      queue,
      {
        linkWidth,
        linkColorscheme,
        linkAttribsToColorIndices,
        circleBorderColor,
        nodeColorscheme,
        nodeAttribsToColorIndices,
        textColor,
        enableShading,
        ...highlightParams,
      },
      { showGrid, segments: gridSegments },
    );
  } else {
    render2DGraph(ctx, graphData, nodeMap, {
      linkWidth,
      linkColorscheme,
      linkAttribsToColorIndices,
      circleBorderColor,
      nodeColorscheme,
      nodeAttribsToColorIndices,
      textColor,
      ...highlightParams,
    });
  }

  return { svgElement, width: bounds.width, height: bounds.height };
}

export function buildGraphSvgElement(
  graph,
  linkWidth,
  linkColorscheme,
  linkAttribsToColorIndices,
  circleBorderColor,
  textColor,
  nodeColorscheme,
  nodeAttribsToColorIndices,
  nodeMap,
  options = {},
) {
  const exportGraph = buildExportGraphData(graph.data, nodeMap, { threeD: options.threeD });
  if (!exportGraph) return null;

  const gridLines = options.showGrid ? options.gridLines ?? buildExportGridLines(graph.data, options.container) : [];
  const gridSegments =
    options.threeD && options.showGrid ? projectGridLines(gridLines, options.camera, options.container) : [];

  return createGraphSvgElement(
    exportGraph,
    nodeMap,
    linkWidth,
    linkColorscheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    textColor,
    nodeColorscheme,
    nodeAttribsToColorIndices,
    { ...options, gridSegments },
  );
}

export function buildGraphSvgDownload(
  graph,
  linkWidth,
  linkColorscheme,
  linkAttribsToColorIndices,
  circleBorderColor,
  textColor,
  nodeColorscheme,
  nodeAttribsToColorIndices,
  nodeMap,
  options = {},
) {
  const svgExport = buildGraphSvgElement(
    graph,
    linkWidth,
    linkColorscheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    textColor,
    nodeColorscheme,
    nodeAttribsToColorIndices,
    nodeMap,
    options,
  );
  if (!svgExport) return null;

  const svgString = serializeSvgElement(svgExport.svgElement, options.xmlSerializer);
  return {
    blob: new Blob([svgString], { type: "image/svg+xml;charset=utf-8" }),
    filename: `${getFileNameWithoutExtension(graph.name)}.svg`,
  };
}

export function downloadAsSVG(
  graph,
  linkWidth,
  linkColorscheme,
  linkAttribsToColorIndices,
  circleBorderColor,
  textColor,
  nodeColorscheme,
  nodeAttribsToColorIndices,
  nodeMap,
  options = {},
) {
  const download = buildGraphSvgDownload(
    graph,
    linkWidth,
    linkColorscheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    textColor,
    nodeColorscheme,
    nodeAttribsToColorIndices,
    nodeMap,
    options,
  );
  if (!download) return;

  triggerDownload(download.blob, download.filename);
}
