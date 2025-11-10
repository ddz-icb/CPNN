import log from "../../../adapters/logging/logger.js";
import canvasToSvg from "canvas-to-svg";
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { drawCircleCanvas, drawLineCanvas } from "../canvas_drawing/draw.js";
import { getFileNameWithoutExtension } from "../parsing/fileParsing.js";

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
  nodeAttribsToColorIndices
) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  const tempCtx = document.createElement("canvas").getContext("2d");

  for (const node of graphData.nodes) {
    const { circle, nodeLabel } = nodeMap[node.id];
    if (nodeLabel?.visible) tempCtx.font = `${nodeLabel._fontSize || 12}px sans-serif`;
    const textWidth = nodeLabel?.visible ? tempCtx.measureText(nodeLabel.text).width : 0;
    const labelXMin = nodeLabel?.visible ? nodeLabel.x - textWidth / 2 : circle.x;
    const labelXMax = nodeLabel?.visible ? nodeLabel.x + textWidth / 2 : circle.x;
    const labelY = nodeLabel?.visible ? nodeLabel.y + 10 : circle.y;

    minX = Math.min(minX, circle.x - 10, labelXMin - 10);
    maxX = Math.max(maxX, circle.x + 10, labelXMax + 10);
    minY = Math.min(minY, circle.y - 10, labelY - 10);
    maxY = Math.max(maxY, circle.y + 10, labelY + 10);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const ctx = new canvasToSvg(width, height);
  const svgElement = ctx.getSvg();
  svgElement.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
  svgElement.setAttribute("width", width);
  svgElement.setAttribute("height", height);

  for (const link of graphData.links) {
    drawLineCanvas(ctx, link, linkWidth, linkColorscheme, linkAttribsToColorIndices);
  }

  for (const node of graphData.nodes) {
    const { circle, nodeLabel } = nodeMap[node.id];
    drawCircleCanvas(ctx, node, circle, circleBorderColor, nodeColorscheme, nodeAttribsToColorIndices);
    if (nodeLabel?.visible) {
      ctx.font = `${nodeLabel._fontSize || 12}px sans-serif`;
      ctx.fillStyle = textColor;
      const textWidth = ctx.measureText(nodeLabel.text).width;
      ctx.fillText(nodeLabel.text, nodeLabel.x - textWidth / 2, nodeLabel.y + 10);
    }
  }

  return { svgElement, width, height };
}

function drawLegendOnPdf(pdf, offsetX, offsetY, nodeColorscheme, nodeAttribsToColorIndices, linkColorscheme, linkAttribsToColorIndices, mapping, section = "both") {
  const padding = 20;
  const rectSize = 12;
  const rectSpacing = 8;
  const labelFontSize = 11;
  const headerFontSize = 13;
  const headerBottomSpacing = 10;
  const rowSpacing = 6;
  const groupSpacing = 16;

  const sectionsConfig = [
    {
      key: "nodes",
      attribs: nodeAttribsToColorIndices ?? {},
      colorscheme: nodeColorscheme ?? {},
    },
    {
      key: "links",
      attribs: linkAttribsToColorIndices ?? {},
      colorscheme: linkColorscheme ?? {},
    },
  ];

  const normalizedSection = typeof section === "string" ? section.toLowerCase() : "both";
  let sections =
    normalizedSection === "both"
      ? sectionsConfig
      : sectionsConfig.filter(({ key }) => key === normalizedSection);

  sections = sections.map((sectionConfig) => {
    const { attribs, colorscheme } = sectionConfig;
    const validKeys = Object.keys(attribs).filter((key) => {
      if (!Object.hasOwnProperty.call(attribs, key)) return false;
      const colorIndex = attribs[key];
      return Boolean(colorscheme[colorIndex]);
    });
    return { ...sectionConfig, validKeys };
  });

  if (!sections.length) return { legendWidth: 0, legendHeight: 0 };

  const tempPdf = new jsPDF({ unit: "pt" });
  tempPdf.setFontSize(labelFontSize);
  let maxTextWidth = tempPdf.getTextWidth("No Value Available");

  sections.forEach(({ validKeys }) => {
    validKeys.forEach((key) => {
      maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth(key));
    });
  });

  const legendWidth = padding * 2 + rectSize + rectSpacing + maxTextWidth;

  tempPdf.setFontSize(headerFontSize);
  const headerMetricsSample =
    typeof tempPdf.getTextDimensions === "function" ? tempPdf.getTextDimensions("Ag") : null;
  const headerSampleHeight = headerMetricsSample?.h ?? headerFontSize;
  const headerSampleBaseline = headerMetricsSample?.baseline ?? headerSampleHeight * 0.8;
  const headerBlockHeight = headerSampleBaseline + headerBottomSpacing;

  const sectionHeights = sections.map(({ validKeys }) => {
    const rowCount = validKeys.length + 1;
    const rowsHeight = rowCount * rectSize + rowSpacing * Math.max(rowCount - 1, 0);
    return headerBlockHeight + rowsHeight;
  });
  const legendHeight =
    padding * 2 +
    sectionHeights.reduce((height, sectionHeight) => height + sectionHeight, 0) +
    groupSpacing * Math.max(sections.length - 1, 0);

  pdf.setFillColor(255, 255, 255);
  pdf.rect(offsetX, offsetY, legendWidth, legendHeight, "F");
  pdf.setDrawColor(220, 220, 220);
  pdf.rect(offsetX, offsetY, legendWidth, legendHeight);

  let yPos = offsetY + padding;
  pdf.setTextColor(60, 60, 60);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(labelFontSize);

  const metricsSample =
    typeof pdf.getTextDimensions === "function" ? pdf.getTextDimensions("Ag") : null;
  const sampleHeight = metricsSample?.h ?? labelFontSize;
  const sampleBaseline = metricsSample?.baseline ?? sampleHeight * 0.8;
  const labelBaselineOffset = rectSize / 2 + sampleBaseline - sampleHeight / 2;

  const headerBaselineOffset = headerSampleBaseline;

  const drawRow = (label, color, isLastRow) => {
    const fillColor = color ?? "#f3f3f3";
    pdf.setFillColor(fillColor);
    pdf.rect(offsetX + padding, yPos, rectSize, rectSize, "F");
    pdf.setDrawColor(230, 230, 230);
    pdf.rect(offsetX + padding, yPos, rectSize, rectSize);
    pdf.setDrawColor(0, 0, 0);

    const baseline = yPos + labelBaselineOffset;
    pdf.text(label, offsetX + padding + rectSize + rectSpacing, baseline);

    yPos += rectSize;
    if (!isLastRow) {
      yPos += rowSpacing;
    }
  };

  sections.forEach(({ key, validKeys, attribs, colorscheme }, sectionIndex) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(headerFontSize);
    const headerLabel = key === "nodes" ? "Nodes" : "Links";
    pdf.text(headerLabel, offsetX + padding, yPos + headerBaselineOffset);
    yPos += headerBlockHeight;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(labelFontSize);
    const rows = validKeys
      .map((key) => ({
        label: key,
        color: colorscheme[attribs[key]],
      }))
      .concat({ label: "No Value Available", color: "#f3f3f3" });

    rows.forEach((row, rowIndex) => {
      const isLastRow = rowIndex === rows.length - 1;
      drawRow(row.label, row.color, isLastRow);
    });

    if (sectionIndex < sections.length - 1) {
      yPos += groupSpacing;
    }
  });

  return { legendWidth, legendHeight };
}



export function downloadAsPNG(app, document, graphName) {
  app.renderer.extract
    .image(app.stage, "image/png")
    .then((image) => {
      const scale = 1.5; // Set higher for better resolution
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const dataURL = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = getFileNameWithoutExtension(graphName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((error) => log.error("Error downloading PNG:", error));
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
  nodeMap
) {
  const { svgElement } = createGraphSvgElement(
    graph.data,
    nodeMap,
    linkWidth,
    linkColorscheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    textColor,
    nodeColorscheme,
    nodeAttribsToColorIndices
  );
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, `${getFileNameWithoutExtension(graph.name)}.svg`);
}

export function downloadAsPDF(
  graph,
  linkWidth,
  linkColorscheme,
  linkAttribsToColorIndices,
  circleBorderColor,
  textColor,
  nodeColorscheme,
  nodeAttribsToColorIndices,
  nodeMap
) {
  const { svgElement, width, height } = createGraphSvgElement(
    graph.data,
    nodeMap,
    linkWidth,
    linkColorscheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    textColor,
    nodeColorscheme,
    nodeAttribsToColorIndices
  );

  const pdf = new jsPDF({
    orientation: width > height ? "landscape" : "portrait",
    unit: "px",
    format: [width + 20, height + 20],
  });

  svg2pdf(svgElement, pdf, { xOffset: 10, yOffset: 10 }).then(() => {
    pdf.save(`${getFileNameWithoutExtension(graph.name)}.pdf`);
  });
}

export function downloadGraphJson(graph, nodeMap, physics, filter) {
  const convertLinks = (links) => links.map(({ source, target, ...rest }) => ({ ...rest, source: source.id, target: target.id }));

  let nodes = graph.data.nodes;
  if (nodeMap) {
    nodes = graph.data.nodes.map((node) => ({
      ...node,
      x: Math.round(nodeMap[node.id].circle.x * 100) / 100,
      y: Math.round(nodeMap[node.id].circle.y * 100) / 100,
    }));
  }

  const data = { nodes, links: convertLinks(graph.data.links) };
  if (physics) data.physics = physics;
  if (filter) data.filter = filter;

  const blob = new Blob([JSON.stringify(data, null, 4)], { type: "application/json" });
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

export function downloadNodeIdsCsv(graph) {
  const nodes = graph?.data?.nodes ?? [];
  const rows = nodes.map((node) => node.id ?? "");
  const baseName = getFileNameWithoutExtension(graph?.name ?? "graph");
  downloadCsvFile(rows.join(","), `${baseName}_node_ids`);
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

    drawLegendOnPdf(
      pdf,
      0,
      0,
      nodeColorscheme,
      nodeAttribsToColorIndices,
      linkColorscheme,
      linkAttribsToColorIndices,
      mapping,
      section
    );
    pdf.save(`${baseFileName}_legend_${suffix}.pdf`);
  });
}
