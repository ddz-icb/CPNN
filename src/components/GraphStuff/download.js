import log from "../../logger.js";
import canvasToSvg from "canvas-to-svg";
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { drawCircleCanvas, drawLineCanvas } from "../Other/draw.js";
import { getNodeLabelOffsetY } from "./graphCalculations.js";

export function downloadAsPNG(app, document) {
  function getHtmlImageElement() {
    return app.renderer.extract.image(app.stage, "image/png");
  }

  getHtmlImageElement()
    .then((image) => {
      const scale = 1.5; // set this higher for higher resolution
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;

      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const dataURL = canvas.toDataURL("image/png", 1);

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "Graph.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((error) => {
      log.error("Error downloading the graph picture:", error);
    });
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
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  for (const node of graph.nodes) {
    const { circle, nodeLabel } = nodeMap[node.id];

    if (nodeLabel && nodeLabel.visible) {
      tempCtx.font = `${nodeLabel._fontSize || 12}px sans-serif`;
    }

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
    const { circle } = nodeMap[node.id];

    drawCircleCanvas(ctx, node, circle, circleBorderColor, nodeColorScheme.colorScheme, nodeAttribsToColorIndices);
  }

  for (const node of graph.nodes) {
    const { nodeLabel } = nodeMap[node.id];
    if (nodeLabel && nodeLabel.visible) {
      ctx.font = `${nodeLabel._fontSize || 12}px sans-serif`;
      ctx.fillStyle = textColor;
      const textWidth = ctx.measureText(nodeLabel.text).width;
      ctx.fillText(nodeLabel.text, nodeLabel.x - textWidth / 2, nodeLabel.y + 10);
    }
  }

  const mySerializedSVG = ctx.getSerializedSvg();

  const blob = new Blob([mySerializedSVG], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Graph.svg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  for (const node of graph.nodes) {
    const { circle, nodeLabel } = nodeMap[node.id];

    if (nodeLabel && nodeLabel.visible) {
      tempCtx.font = `${nodeLabel._fontSize || 12}px sans-serif`;
    }

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
    const { circle } = nodeMap[node.id];
    drawCircleCanvas(ctx, node, circle, circleBorderColor, nodeColorScheme.colorScheme, nodeAttribsToColorIndices);
    const { nodeLabel } = nodeMap[node.id];
    if (nodeLabel && nodeLabel.visible) {
      ctx.font = `${nodeLabel._fontSize || 12}px sans-serif`;
      ctx.fillStyle = textColor;
      const textWidth = ctx.measureText(nodeLabel.text).width;
      ctx.fillText(nodeLabel.text, nodeLabel.x - textWidth / 2, nodeLabel.y + 10);
    }
  }

  const pdf = new jsPDF({
    orientation: width > height ? "landscape" : "portrait",
    unit: "px",
    format: [width + 20, height + 20],
  });
  pdf.setFontSize(10);
  pdf.setFillColor(255, 255, 255);

  svg2pdf(svgElement, pdf, { xOffset: 10, yOffset: 10, scale: 1 }).then(() => {
    pdf.save("Graph.pdf");
  });
}

export function downloadGraphJson(graph, filename) {
  // this function maps the objects contained in source and target to its id (representing the node id)
  function convertLinks(links) {
    return links.map((link) => ({
      ...link,
      source: link.source.id,
      target: link.target.id,
    }));
  }
  const blob = new Blob([JSON.stringify({ nodes: graph.nodes, links: convertLinks(graph.links) }, null, 4)], {
    type: "application/json",
  });

  log.info("Downloading graph as JSON");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadGraphJsonWithCoordinates(graph, filename, nodeMap) {
  // this function maps the objects contained in source and target to its id (representing the node id)
  function convertLinks(links) {
    return links.map((link) => ({
      ...link,
      source: link.source.id,
      target: link.target.id,
    }));
  }
  const exportedNodes = graph.nodes.map((node) => {
    const { circle } = nodeMap[node.id];
    return { ...node, x: circle.x, y: circle.y };
  });
  const blob = new Blob([JSON.stringify({ nodes: exportedNodes, links: convertLinks(graph.links) }, null, 4)], {
    type: "application/json",
  });

  log.info("Downloading graph as JSON");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadGraphJsonWithCoordinatesPhysics(graph, filename, nodeMap, physics) {
  // this function maps the objects contained in source and target to its id (representing the node id)
  function convertLinks(links) {
    return links.map((link) => ({
      ...link,
      source: link.source.id,
      target: link.target.id,
    }));
  }
  const exportedNodes = graph.nodes.map((node) => {
    const { circle } = nodeMap[node.id];
    return { ...node, x: circle.x, y: circle.y };
  });
  const blob = new Blob([JSON.stringify({ nodes: exportedNodes, links: convertLinks(graph.links), physics: physics }, null, 4)], {
    type: "application/json",
  });

  log.info("Downloading graph as JSON");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadObjectAsFile(object, name) {
  const formattedJson = typeof object === "string" ? JSON.stringify(JSON.parse(object), null, 4) : JSON.stringify(object, null, 4);

  const blob = new Blob([formattedJson], { type: "application/json" });

  console.info("Downloading object as file");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsvFile(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  console.info("Downloading CSV file");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadLegendPdf(
  graph,
  linkColorScheme,
  linkAttribsToColorIndices,
  nodeColorScheme,
  nodeAttribsToColorIndices,
  activeAnnotationMapping
) {
  const padding = 20;
  const rectWidth = 18;

  const tempPdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  tempPdf.setFontSize(15);

  let maxTextWidth = tempPdf.getTextWidth("Nodes");
  for (const key in nodeAttribsToColorIndices) {
    if (nodeAttribsToColorIndices.hasOwnProperty(key)) {
      const label = activeAnnotationMapping?.groupMapping?.[key]?.name || key;
      const textWidth = tempPdf.getTextWidth(label);
      if (textWidth > maxTextWidth) {
        maxTextWidth = textWidth;
      }
    }
  }
  maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth("No Value Available"));
  maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth("Links"));
  for (const key in linkAttribsToColorIndices) {
    if (linkAttribsToColorIndices.hasOwnProperty(key)) {
      const textWidth = tempPdf.getTextWidth(key);
      if (textWidth > maxTextWidth) {
        maxTextWidth = textWidth;
      }
    }
  }

  const pdfWidth = padding + rectWidth + 6 + maxTextWidth + padding;

  let y = padding;
  y += 6;
  const nodesCount = Object.keys(nodeAttribsToColorIndices).length;
  y += nodesCount * 20;
  y += 20;
  y += 30;
  y += 6;
  const linksCount = Object.keys(linkAttribsToColorIndices).length;
  y += linksCount * 20; // Pro Link 20pt
  y += 20;
  const pdfHeight = y + padding;

  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
    unit: "pt",
    format: [pdfWidth, pdfHeight],
  });
  pdf.setFontSize(15);

  y = padding;
  pdf.setFontSize(18);
  pdf.text("Nodes", padding, y);
  pdf.setFontSize(15);
  y += 6;

  for (const key in nodeAttribsToColorIndices) {
    if (nodeAttribsToColorIndices.hasOwnProperty(key)) {
      const colorIndex = nodeAttribsToColorIndices[key];
      const color = nodeColorScheme.colorScheme[colorIndex];
      const label = activeAnnotationMapping?.groupMapping?.[key]?.name || key;

      y += 20;
      pdf.setFillColor(color);
      pdf.rect(padding, y - 12, rectWidth, 10, "F");
      pdf.text(label, padding + rectWidth + 6, y - 3);
    }
  }

  y += 20;
  pdf.setFillColor("#cccccc");
  pdf.rect(padding, y - 12, rectWidth, 10, "F");
  pdf.text("No Value Available", padding + rectWidth + 6, y - 3);

  y += 30;
  pdf.setFontSize(18);
  pdf.text("Links", padding, y);
  pdf.setFontSize(15);
  y += 6;

  for (const key in linkAttribsToColorIndices) {
    if (linkAttribsToColorIndices.hasOwnProperty(key)) {
      const colorIndex = linkAttribsToColorIndices[key];
      const color = linkColorScheme.colorScheme[colorIndex];

      y += 20;
      pdf.setFillColor(color);
      pdf.rect(padding, y - 12, rectWidth, 10, "F");
      pdf.text(key, padding + rectWidth + 6, y - 3);
    }
  }

  y += 20;
  pdf.setFillColor("#cccccc");
  pdf.rect(padding, y - 12, rectWidth, 10, "F");
  pdf.text("No Value Available", padding + rectWidth + 6, y - 3);

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
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  for (const node of graph.nodes) {
    const { circle, nodeLabel } = nodeMap[node.id];

    if (nodeLabel && nodeLabel.visible) {
      tempCtx.font = `${nodeLabel._fontSize || 12}px sans-serif`;
    }

    const textWidth = nodeLabel?.visible ? tempCtx.measureText(nodeLabel.text).width : 0;
    const labelXMin = nodeLabel?.visible ? nodeLabel.x - textWidth / 2 : circle.x;
    const labelXMax = nodeLabel?.visible ? nodeLabel.x + textWidth / 2 : circle.x;
    const labelY = nodeLabel?.visible ? nodeLabel.y + 10 : circle.y;

    minX = Math.min(minX, circle.x - 10, labelXMin - 10);
    maxX = Math.max(maxX, circle.x + 10, labelXMax + 10);
    minY = Math.min(minY, circle.y - 10, labelY - 10);
    maxY = Math.max(maxY, circle.y + 10, labelY + 10);
  }
  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;
  const graphAreaWidth = graphWidth + 20;
  const graphAreaHeight = graphHeight + 20;

  const ctx = new canvasToSvg(graphWidth, graphHeight);
  const svgElement = ctx.getSvg();
  svgElement.setAttribute("viewBox", `${minX} ${minY} ${graphWidth} ${graphHeight}`);
  svgElement.setAttribute("width", graphWidth);
  svgElement.setAttribute("height", graphHeight);
  for (const link of graph.links) {
    drawLineCanvas(ctx, link, linkColorScheme.colorScheme, linkAttribsToColorIndices);
  }
  for (const node of graph.nodes) {
    const { circle } = nodeMap[node.id];
    drawCircleCanvas(ctx, node, circle, circleBorderColor, nodeColorScheme.colorScheme, nodeAttribsToColorIndices);
    const { nodeLabel } = nodeMap[node.id];
    if (nodeLabel && nodeLabel.visible) {
      ctx.font = `${nodeLabel._fontSize || 12}px sans-serif`;
      ctx.fillStyle = textColor;
      const textWidth = ctx.measureText(nodeLabel.text).width;
      ctx.fillText(nodeLabel.text, nodeLabel.x - textWidth / 2, nodeLabel.y + 10);
    }
  }

  const padding = 20;
  const rectWidth = 18;
  const headerFontSize = 18;
  const labelFontSize = 15;
  const tempPdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  tempPdf.setFontSize(labelFontSize);
  let maxTextWidth = 0;
  for (const key in nodeAttribsToColorIndices) {
    if (nodeAttribsToColorIndices.hasOwnProperty(key)) {
      const label = activeAnnotationMapping?.groupMapping?.[key]?.name || key;
      maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth(label));
    }
  }
  maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth("No Value Available"));
  for (const key in linkAttribsToColorIndices) {
    if (linkAttribsToColorIndices.hasOwnProperty(key)) {
      maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth(key));
    }
  }
  tempPdf.setFontSize(headerFontSize);
  maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth("Nodes"), tempPdf.getTextWidth("Links"));

  const legendWidth = padding + rectWidth + 6 + maxTextWidth + padding;

  let legendY = padding;
  legendY += 6;
  const nodesCount = Object.keys(nodeAttribsToColorIndices).length;
  legendY += nodesCount * 20;
  legendY += 20;
  legendY += 30;
  legendY += 6;
  const linksCount = Object.keys(linkAttribsToColorIndices).length;
  legendY += linksCount * 20;
  legendY += 20;
  const legendHeight = legendY + padding;

  const pdfWidth = graphAreaWidth + legendWidth;
  const pdfHeight = Math.max(graphAreaHeight, legendHeight);

  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
    unit: "pt",
    format: [pdfWidth, pdfHeight],
  });
  pdf.setFontSize(10);
  pdf.setFillColor(255, 255, 255);

  const graphOffsetX = 10;
  const graphOffsetY = 10;

  svg2pdf(svgElement, pdf, { xOffset: graphOffsetX, yOffset: graphOffsetY, scale: 1 }).then(() => {
    const legendOffsetX = pdfWidth - legendWidth;
    const legendOffsetY = pdfHeight - legendHeight;

    pdf.setFillColor(245, 245, 245);
    pdf.rect(legendOffsetX, legendOffsetY, legendWidth, legendHeight, "F");

    let yPos = legendOffsetY + padding;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.text("Nodes", legendOffsetX + padding, yPos);
    pdf.setFontSize(15);
    yPos += 6;
    for (const key in nodeAttribsToColorIndices) {
      if (nodeAttribsToColorIndices.hasOwnProperty(key)) {
        const colorIndex = nodeAttribsToColorIndices[key];
        const color = nodeColorScheme.colorScheme[colorIndex];
        const label = activeAnnotationMapping?.groupMapping?.[key]?.name || key;
        yPos += 20;
        pdf.setFillColor(color);
        pdf.rect(legendOffsetX + padding, yPos - 12, rectWidth, 10, "F");
        pdf.text(label, legendOffsetX + padding + rectWidth + 6, yPos - 3);
      }
    }
    yPos += 20;
    pdf.setFillColor("#cccccc");
    pdf.rect(legendOffsetX + padding, yPos - 12, rectWidth, 10, "F");
    pdf.text("No Value Available", legendOffsetX + padding + rectWidth + 6, yPos - 3);
    yPos += 30;
    pdf.setFontSize(18);
    pdf.text("Links", legendOffsetX + padding, yPos);
    pdf.setFontSize(15);
    yPos += 6;
    for (const key in linkAttribsToColorIndices) {
      if (linkAttribsToColorIndices.hasOwnProperty(key)) {
        const colorIndex = linkAttribsToColorIndices[key];
        const color = linkColorScheme.colorScheme[colorIndex];
        yPos += 20;
        pdf.setFillColor(color);
        pdf.rect(legendOffsetX + padding, yPos - 12, rectWidth, 10, "F");
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(legendOffsetX, legendOffsetY, legendWidth, legendHeight);
        pdf.text(key, legendOffsetX + padding + rectWidth + 6, yPos - 3);
      }
    }
    yPos += 20;
    pdf.setFillColor("#cccccc");
    pdf.rect(legendOffsetX + padding, yPos - 12, rectWidth, 10, "F");
    pdf.text("No Value Available", legendOffsetX + padding + rectWidth + 6, yPos - 3);

    pdf.save("Graph_With_Legend.pdf");
  });
}
