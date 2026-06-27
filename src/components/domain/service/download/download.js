import log from "../../../adapters/logging/logger.js";
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { getFileNameWithoutExtension } from "../parsing/fileParsing.js";
import { buildExportGraphData, cleanLinks, cleanNodes, cleanNodesNoCoords, drawLegendOnPdf } from "./exportGraph.js";
import { build3DRenderQueue, createSvgContext, measureGraphBounds, render2DGraph, render3DQueue } from "./exportRender.js";
import { buildExportGridLines } from "./exportGrid.js";
import { projectGridLines } from "./exportProjection.js";

const pdfPadding = 10;

const serializeSvgElement = (svgElement) => new XMLSerializer().serializeToString(svgElement);

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function triggerDownload(blob, filename) {
  log.info(`Downloading ${filename}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  options = {}
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
  } = options;
  const bounds = measureGraphBounds(graphData, nodeMap, { extraSegments: gridSegments });
  const { ctx, svgElement } = createSvgContext(bounds);
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
      { showGrid, segments: gridSegments }
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
  options = {}
) {
  const exportGraph = buildExportGraphData(graph.data, nodeMap, { threeD: options.threeD });
  if (!exportGraph) return;

  const gridLines = options.showGrid ? options.gridLines ?? buildExportGridLines(graph.data, options.container) : [];
  const gridSegments =
    options.threeD && options.showGrid ? projectGridLines(gridLines, options.camera, options.container) : [];

  const { svgElement } = createGraphSvgElement(
    exportGraph,
    nodeMap,
    linkWidth,
    linkColorscheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    textColor,
    nodeColorscheme,
    nodeAttribsToColorIndices,
    { ...options, gridSegments }
  );
  const svgString = serializeSvgElement(svgElement);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, `${getFileNameWithoutExtension(graph.name)}.svg`);
}

export async function downloadAsPDF(
  graph,
  linkWidth,
  linkColorscheme,
  linkAttribsToColorIndices,
  circleBorderColor,
  textColor,
  nodeColorscheme,
  nodeAttribsToColorIndices,
  nodeMap,
  options = {}
) {
  const exportGraph = buildExportGraphData(graph.data, nodeMap, { threeD: options.threeD });
  if (!exportGraph) return;

  const gridLines = options.showGrid ? options.gridLines ?? buildExportGridLines(graph.data, options.container) : [];
  const gridSegments =
    options.threeD && options.showGrid ? projectGridLines(gridLines, options.camera, options.container) : [];

  const { svgElement, width, height } = createGraphSvgElement(
    exportGraph,
    nodeMap,
    linkWidth,
    linkColorscheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    textColor,
    nodeColorscheme,
    nodeAttribsToColorIndices,
    { ...options, gridSegments }
  );

  const pdf = new jsPDF({
    orientation: width > height ? "landscape" : "portrait",
    unit: "px",
    format: [width + pdfPadding * 2, height + pdfPadding * 2],
  });

  svg2pdf(svgElement, pdf, { xOffset: pdfPadding, yOffset: pdfPadding })
    .then(() => {
      pdf.save(`${getFileNameWithoutExtension(graph.name)}.pdf`);
    })
    .catch((error) => {
      log.error("Error generating PDF export:", error);
    });
}

function normalizeGraphJsonOptions(options) {
  if (!isObject(options)) return {};
  if (Object.hasOwn(options, "settings") || Object.hasOwn(options, "includeCoordinates")) return options;

  return {
    includeCoordinates: Boolean(options.physics),
    settings: options,
  };
}

export function downloadGraphJson(graph, options = {}) {
  const { includeCoordinates = false, settings = null } = normalizeGraphJsonOptions(options);
  const nodes = includeCoordinates ? cleanNodes(graph.data.nodes) : cleanNodesNoCoords(graph.data.nodes);
  const links = cleanLinks(graph.data.links);

  const data = { nodes, links };
  if (isObject(settings)) {
    Object.assign(data, settings);
  }

  const blob = new Blob([JSON.stringify(data, null, 4)], {
    type: "application/json",
  });

  triggerDownload(blob, `${getFileNameWithoutExtension(graph.name)}.json`);
}

export function downloadObjectAsFile(object, name) {
  const formattedJson = typeof object === "string" ? JSON.stringify(JSON.parse(object), null, 4) : JSON.stringify(object, null, 4);
  const blob = new Blob([formattedJson], { type: "application/json" });
  triggerDownload(blob, name);
}

export function downloadCsvFile(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${getFileNameWithoutExtension(fileName)}.csv`);
}

export function downloadTsvFile(tsvContent, fileName) {
  const blob = new Blob([tsvContent], { type: "text/tab-separated-values;charset=utf-8;" });
  triggerDownload(blob, `${getFileNameWithoutExtension(fileName)}.tsv`);
}

export function serializeColorschemeTsv(colorscheme) {
  if (!colorscheme?.data) {
    throw new Error("No color scheme selected for export.");
  }
  if (!Array.isArray(colorscheme.data) || !colorscheme.data.length) {
    throw new Error("Color scheme export requires at least one color.");
  }

  return ["hex", ...colorscheme.data].join("\n") + "\n";
}

export function downloadColorschemeTsv(colorscheme, suffix = "colorscheme") {
  const baseName = getFileNameWithoutExtension(colorscheme?.name || "colorscheme");
  downloadTsvFile(serializeColorschemeTsv(colorscheme), `${baseName}_${suffix}`);
}

export function downloadNodeIdsCsv(nodes, fileName) {
  if (!nodes) return;

  const rows = nodes.map((node) => node.id ?? "");
  const baseName = getFileNameWithoutExtension(fileName);
  downloadCsvFile(rows.join("\n"), `${baseName}_node_ids`);
}

export function downloadLegendPdf(graphName, linkColorscheme, linkAttribsToColorIndices, nodeColorscheme, nodeAttribsToColorIndices, mapping) {
  const baseFileName = getFileNameWithoutExtension(graphName);
  const sectionsToDownload = [
    { section: "nodes", suffix: "nodes" },
    { section: "links", suffix: "links" },
  ];

  sectionsToDownload.forEach(({ section, suffix }) => {
    const tempPdf = new jsPDF({ unit: "pt" });
    const { legendWidth, legendHeight } = drawLegendOnPdf(
      tempPdf,
      0,
      0,
      nodeColorscheme,
      nodeAttribsToColorIndices,
      linkColorscheme,
      linkAttribsToColorIndices,
      mapping,
      section
    );

    if (!legendWidth || !legendHeight) return;

    const pdf = new jsPDF({
      orientation: legendWidth > legendHeight ? "landscape" : "portrait",
      unit: "pt",
      format: [legendWidth, legendHeight],
    });

    drawLegendOnPdf(pdf, 0, 0, nodeColorscheme, nodeAttribsToColorIndices, linkColorscheme, linkAttribsToColorIndices, mapping, section);
    pdf.save(`${baseFileName}_legend_${suffix}.pdf`);
  });
}
