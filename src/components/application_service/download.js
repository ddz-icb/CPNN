import log from "../../logger.js";
import canvasToSvg from "canvas-to-svg";
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { drawCircleCanvas, drawLineCanvas } from "../other/draw.js";

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
    drawLineCanvas(ctx, link, linkWidth, linkColorscheme.content, linkAttribsToColorIndices);
  }

  for (const node of graph.nodes) {
    const { circle, nodeLabel } = nodeMap[node.id];
    drawCircleCanvas(ctx, node, circle, circleBorderColor, nodeColorscheme.content, nodeAttribsToColorIndices);
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
  nodeColorscheme,
  nodeAttribsToColorIndices,
  linkColorscheme,
  linkAttribsToColorIndices,
  activeMapping
) {
  const padding = 15;
  const rectSize = 10;
  const rectSpacing = 8;
  const headerFontSize = 12;
  const labelFontSize = 10;
  const lineHeight = 20;
  const headerSpacing = 20;

  const tempPdf = new jsPDF({ unit: "pt" });
  tempPdf.setFontSize(labelFontSize);
  let maxTextWidth = 0;

  [nodeAttribsToColorIndices, linkAttribsToColorIndices].forEach((attribs, index) => {
    for (const key in attribs) {
      if (Object.hasOwnProperty.call(attribs, key)) {
        const label = index === 0 ? activeMapping?.groupMapping?.[key]?.name || key : key;
        maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth(label));
      }
    }
  });
  maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth("No Value Available"));
  tempPdf.setFontSize(headerFontSize);
  maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth("Nodes"), tempPdf.getTextWidth("Links"));
  const legendWidth = padding * 2 + rectSize + rectSpacing + maxTextWidth;

  const nodeCount = Object.keys(nodeAttribsToColorIndices).length;
  const linkCount = Object.keys(linkAttribsToColorIndices).length;
  const sectionSpacing = 10;
  const totalItemsHeight = (nodeCount + 1 + linkCount + 1) * lineHeight;
  const legendHeight = padding * 2 + headerSpacing * 2 + sectionSpacing + totalItemsHeight;

  pdf.setFillColor(240, 240, 240);
  pdf.rect(offsetX, offsetY, legendWidth, legendHeight, "F");
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(offsetX, offsetY, legendWidth, legendHeight);

  let yPos = offsetY + padding;
  pdf.setTextColor(50, 50, 50);

  const drawSection = (title, attribs, colorscheme, isNode) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(headerFontSize);
    pdf.text(title, offsetX + padding, yPos + 10);
    yPos += headerSpacing;

    pdf.setFontSize(labelFontSize);

    for (const key in attribs) {
      if (Object.hasOwnProperty.call(attribs, key)) {
        const color = colorscheme.content[attribs[key]];
        const label = isNode ? activeMapping?.groupMapping?.[key]?.name || key : key;

        pdf.setFillColor(color);
        pdf.rect(offsetX + padding, yPos, rectSize, rectSize, "F");
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(offsetX + padding, yPos, rectSize, rectSize);
        pdf.text(label, offsetX + padding + rectSize + rectSpacing, yPos + rectSize * 0.75);
        yPos += lineHeight;
      }
    }

    pdf.setFillColor("#cccccc");
    pdf.rect(offsetX + padding, yPos, rectSize, rectSize, "F");
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(offsetX + padding, yPos, rectSize, rectSize);
    pdf.text("No Value Available", offsetX + padding + rectSize + rectSpacing, yPos + rectSize * 0.75);
    yPos += lineHeight;
  };

  drawSection("Nodes", nodeAttribsToColorIndices, nodeColorscheme, true);
  yPos += sectionSpacing;
  drawSection("Links", linkAttribsToColorIndices, linkColorscheme, false);

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
    graph,
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
  triggerDownload(blob, "Graph.svg");
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
    graph,
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

export function downloadLegendPdf(linkColorscheme, linkAttribsToColorIndices, nodeColorscheme, nodeAttribsToColorIndices, activeMapping) {
  const tempPdf = new jsPDF();
  const { legendWidth, legendHeight } = drawLegendOnPdf(
    tempPdf,
    0,
    0,
    nodeColorscheme,
    nodeAttribsToColorIndices,
    linkColorscheme,
    linkAttribsToColorIndices,
    activeMapping
  );

  const pdf = new jsPDF({
    orientation: legendWidth > legendHeight ? "landscape" : "portrait",
    unit: "pt",
    format: [legendWidth, legendHeight],
  });

  drawLegendOnPdf(pdf, 0, 0, nodeColorscheme, nodeAttribsToColorIndices, linkColorscheme, linkAttribsToColorIndices, activeMapping);
  pdf.save("Graph_Legend.pdf");
}
