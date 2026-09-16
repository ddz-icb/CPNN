import log from "../../../adapters/logging/logger.js";
import { jsPDF } from "jspdf";
import * as svg2pdfPackage from "svg2pdf.js";
import { getFileNameWithoutExtension } from "../parsing/fileParsing.js";
import { drawLegendOnPdf } from "./exportGraph.js";
import { downloadGraphJson } from "./graphJsonDownload.js";
import { buildGraphSvgElement } from "./svgDownload.js";

const pdfPadding = 10;
const svg2pdf = svg2pdfPackage.svg2pdf ?? svg2pdfPackage.default?.svg2pdf;

export { downloadGraphJson };
export { buildGraphSvgDownload, buildGraphSvgElement, downloadAsSVG } from "./svgDownload.js";
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
    options
  );
  if (!svgExport) return;

  const { svgElement, width, height } = svgExport;

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
