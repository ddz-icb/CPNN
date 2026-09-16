import log from "../../../adapters/logging/logger.js";
import { jsPDF } from "jspdf";
import * as svg2pdfPackage from "svg2pdf.js";
import { getFileNameWithoutExtension } from "../parsing/fileParsing.js";
import { buildExportGraphData, drawLegendOnPdf } from "./exportGraph.js";
import { build3DRenderQueue, createSvgContext, measureGraphBounds, render2DGraph, render3DQueue } from "./exportRender.js";
import { buildExportGridLines } from "./exportGrid.js";
import { projectGridLines } from "./exportProjection.js";
import { triggerDownload } from "./fileDownload.js";
import { downloadGraphJson } from "./graphJsonDownload.js";

const pdfPadding = 10;
const svg2pdf = svg2pdfPackage.svg2pdf ?? svg2pdfPackage.default?.svg2pdf;

const serializeSvgElement = (svgElement) => new XMLSerializer().serializeToString(svgElement);

export { downloadGraphJson };
export {
  buildColorschemeTsvDownload,
  buildCsvFileDownload,
  buildNodeIdsCsvDownload,
  buildObjectJsonDownload,
  buildTsvFileDownload,
  downloadColorschemeTsv,
  downloadCsvFile,
  downloadNodeIdsCsv,
  downloadObjectAsFile,
  downloadTsvFile,
  serializeColorschemeTsv,
} from "./dataDownload.js";

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
