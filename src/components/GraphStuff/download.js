import log from "../../logger.js";
import canvasToSvg from "canvas-to-svg";
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { drawCircleCanvas, drawLineCanvas } from "../Other/draw.js";

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
  graph,
  nodeMap,
  linkColorScheme,
  linkAttribsToColorIndices,
  circleBorderColor,
  textColor,
  nodeColorScheme,
  nodeAttribsToColorIndices
) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  const tempCtx = document.createElement("canvas").getContext("2d");

  for (const node of graph.nodes) {
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

  for (const link of graph.links) {
    drawLineCanvas(ctx, link, linkColorScheme.colorScheme, linkAttribsToColorIndices);
  }

  for (const node of graph.nodes) {
    const { circle, nodeLabel } = nodeMap[node.id];
    drawCircleCanvas(ctx, node, circle, circleBorderColor, nodeColorScheme.colorScheme, nodeAttribsToColorIndices);
    if (nodeLabel?.visible) {
      ctx.font = `${nodeLabel._fontSize || 12}px sans-serif`;
      ctx.fillStyle = textColor;
      const textWidth = ctx.measureText(nodeLabel.text).width;
      ctx.fillText(nodeLabel.text, nodeLabel.x - textWidth / 2, nodeLabel.y + 10);
    }
  }

  return { svgElement, width, height };
}

function drawLegendOnPdf(
  pdf,
  offsetX,
  offsetY,
  nodeColorScheme,
  nodeAttribsToColorIndices,
  linkColorScheme,
  linkAttribsToColorIndices,
  activeAnnotationMapping,
  scale = 1
) {
  const padding = 20 * scale;
  const rectWidth = 18 * scale;
  const headerFontSize = 18 * scale;
  const labelFontSize = 15 * scale;
  const tempPdf = new jsPDF({ unit: "pt" });

  tempPdf.setFontSize(labelFontSize);
  let maxTextWidth = 0;
  [nodeAttribsToColorIndices, linkAttribsToColorIndices].forEach((attribs, index) => {
    for (const key in attribs) {
      if (Object.hasOwnProperty.call(attribs, key)) {
        const label = index === 0 ? activeAnnotationMapping?.groupMapping?.[key]?.name || key : key;
        maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth(label));
      }
    }
  });
  maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth("No Value Available"));
  tempPdf.setFontSize(headerFontSize);
  maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth("Nodes"), tempPdf.getTextWidth("Links"));
  const legendWidth = padding * 2 + rectWidth + 6 + maxTextWidth;

  let y = padding;
  y += 6 + (Object.keys(nodeAttribsToColorIndices).length + 1) * 20 + 30 + 6 + (Object.keys(linkAttribsToColorIndices).length + 1) * 20;
  const legendHeight = y + padding;

  pdf.setFillColor(245, 245, 245);
  pdf.rect(offsetX, offsetY, legendWidth, legendHeight, "F");
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(offsetX, offsetY, legendWidth, legendHeight);

  let yPos = offsetY + padding;
  pdf.setTextColor(0, 0, 0);

  const drawSection = (title, attribs, colorScheme, isNode) => {
    pdf.setFontSize(headerFontSize);
    pdf.text(title, offsetX + padding, yPos);
    pdf.setFontSize(labelFontSize);
    yPos += 6;

    for (const key in attribs) {
      if (Object.hasOwnProperty.call(attribs, key)) {
        yPos += 20;
        const color = colorScheme.colorScheme[attribs[key]];
        const label = isNode ? activeAnnotationMapping?.groupMapping?.[key]?.name || key : key;
        pdf.setFillColor(color);
        pdf.rect(offsetX + padding, yPos - 12, rectWidth, 10, "F");
        pdf.text(label, offsetX + padding + rectWidth + 6, yPos - 3);
      }
    }
    yPos += 20;
    pdf.setFillColor("#cccccc");
    pdf.rect(offsetX + padding, yPos - 12, rectWidth, 10, "F");
    pdf.text("No Value Available", offsetX + padding + rectWidth + 6, yPos - 3);
  };

  drawSection("Nodes", nodeAttribsToColorIndices, nodeColorScheme, true);
  yPos += 30;
  drawSection("Links", linkAttribsToColorIndices, linkColorScheme, false);

  return { legendWidth, legendHeight };
}

export function downloadAsPNG(app, document) {
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
      link.download = "Graph.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((error) => log.error("Error downloading PNG:", error));
}

export function downloadAsSVG(
  document,
  graph,
  linkColorScheme,
  linkAttribsToColorIndices,
  circleBorderColor,
  textColor,
  nodeColorScheme,
  nodeAttribsToColorIndices,
  nodeMap
) {
  const { svgElement } = createGraphSvgElement(
    graph,
    nodeMap,
    linkColorScheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    textColor,
    nodeColorScheme,
    nodeAttribsToColorIndices
  );
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, "Graph.svg");
}

export function downloadAsPDF(
  graph,
  linkColorScheme,
  linkAttribsToColorIndices,
  circleBorderColor,
  textColor,
  nodeColorScheme,
  nodeAttribsToColorIndices,
  nodeMap
) {
  const { svgElement, width, height } = createGraphSvgElement(
    graph,
    nodeMap,
    linkColorScheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    textColor,
    nodeColorScheme,
    nodeAttribsToColorIndices
  );

  const pdf = new jsPDF({
    orientation: width > height ? "landscape" : "portrait",
    unit: "px",
    format: [width + 20, height + 20],
  });

  svg2pdf(svgElement, pdf, { xOffset: 10, yOffset: 10 }).then(() => {
    pdf.save("Graph.pdf");
  });
}

export function downloadGraphJson(graph, filename, nodeMap, physics) {
  const convertLinks = (links) => links.map(({ source, target, ...rest }) => ({ ...rest, source: source.id, target: target.id }));

  let nodes = graph.nodes;
  if (nodeMap) {
    nodes = graph.nodes.map((node) => ({ ...node, x: nodeMap[node.id].circle.x, y: nodeMap[node.id].circle.y }));
  }

  const data = { nodes, links: convertLinks(graph.links) };
  if (physics) data.physics = physics;

  const blob = new Blob([JSON.stringify(data, null, 4)], { type: "application/json" });
  triggerDownload(blob, filename);
}

export function downloadObjectAsFile(object, name) {
  const formattedJson = typeof object === "string" ? JSON.stringify(JSON.parse(object), null, 4) : JSON.stringify(object, null, 4);
  const blob = new Blob([formattedJson], { type: "application/json" });
  triggerDownload(blob, name);
}

export function downloadCsvFile(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, fileName.endsWith(".csv") ? fileName : `${fileName}.csv`);
}

export function downloadLegendPdf(linkColorScheme, linkAttribsToColorIndices, nodeColorScheme, nodeAttribsToColorIndices, activeAnnotationMapping) {
  const tempPdf = new jsPDF();
  const { legendWidth, legendHeight } = drawLegendOnPdf(
    tempPdf,
    0,
    0,
    nodeColorScheme,
    nodeAttribsToColorIndices,
    linkColorScheme,
    linkAttribsToColorIndices,
    activeAnnotationMapping
  );

  const pdf = new jsPDF({
    orientation: legendWidth > legendHeight ? "landscape" : "portrait",
    unit: "pt",
    format: [legendWidth, legendHeight],
  });

  drawLegendOnPdf(pdf, 0, 0, nodeColorScheme, nodeAttribsToColorIndices, linkColorScheme, linkAttribsToColorIndices, activeAnnotationMapping);
  pdf.save("Graph_Legend.pdf");
}

export function downloadGraphWithLegendPdf(
  graph,
  linkColorScheme,
  linkAttribsToColorIndices,
  circleBorderColor,
  textColor,
  nodeColorScheme,
  nodeAttribsToColorIndices,
  nodeMap,
  activeAnnotationMapping
) {
  const {
    svgElement,
    width: graphWidth,
    height: graphHeight,
  } = createGraphSvgElement(
    graph,
    nodeMap,
    linkColorScheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    textColor,
    nodeColorScheme,
    nodeAttribsToColorIndices
  );

  const tempPdf = new jsPDF();
  const { legendWidth, legendHeight } = drawLegendOnPdf(
    tempPdf,
    0,
    0,
    nodeColorScheme,
    nodeAttribsToColorIndices,
    linkColorScheme,
    linkAttribsToColorIndices,
    activeAnnotationMapping
  );

  const padding = 40; // Increased padding for a cleaner look
  const spacing = 30; // Spacing between the graph and the legend
  const totalWidth = graphWidth + legendWidth + spacing + 2 * padding;
  const totalHeight = Math.max(graphHeight, legendHeight) + 2 * padding;

  // Use a standard page size and scale down if necessary
  const pageFormat = totalWidth > totalHeight ? "a4" : "a4"; // Use landscape or portrait A4
  const pdf = new jsPDF({
    orientation: totalWidth > totalHeight ? "landscape" : "portrait",
    unit: "pt",
    format: pageFormat,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const scale = Math.min(pageWidth / totalWidth, pageHeight / totalHeight, 1); // Scale down if content is too large
  const scaledGraphWidth = graphWidth * scale;
  const scaledGraphHeight = graphHeight * scale;
  const scaledLegendWidth = legendWidth * scale;
  const scaledLegendHeight = legendHeight * scale;
  const scaledSpacing = spacing * scale;

  const totalContentWidth = scaledGraphWidth + scaledLegendWidth + scaledSpacing;
  const graphX = (pageWidth - totalContentWidth) / 2;
  const graphY = (pageHeight - scaledGraphHeight) / 2;
  const legendX = graphX + scaledGraphWidth + scaledSpacing;
  const legendY = (pageHeight - scaledLegendHeight) / 2;

  svg2pdf(svgElement, pdf, {
    xOffset: graphX,
    yOffset: graphY,
    scale: scale,
  }).then(() => {
    // Redraw the legend with the new scaled dimensions and position
    drawLegendOnPdf(
      pdf,
      legendX,
      legendY,
      nodeColorScheme,
      nodeAttribsToColorIndices,
      linkColorScheme,
      linkAttribsToColorIndices,
      activeAnnotationMapping,
      scale
    );
    pdf.save("Graph_With_Legend.pdf");
  });
}
