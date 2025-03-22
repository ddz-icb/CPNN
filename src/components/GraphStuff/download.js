import log from "../../logger.js";
import canvasToSvg from "canvas-to-svg";
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { drawCircleCanvas, drawLineCanvas } from "../Other/draw.js";

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
  linksAttribsToColorIndices,
  circleBorderColor,
  nodeColorScheme,
  nodeAttribsToColorIndices,
  nodeMap
) {
  const firstNode = graph.nodes[0];
  const { alsoFirstNode, circle: firstCircle } = nodeMap[firstNode.id];

  let minX = firstCircle.x;
  let maxX = firstCircle.x;
  let minY = firstCircle.y;
  let maxY = firstCircle.y;

  for (const node of graph.nodes) {
    const { sameNode, circle } = nodeMap[node.id];
    if (circle.x < minX) {
      minX = circle.x;
    }

    if (circle.x > maxX) {
      maxX = circle.x;
    }

    if (circle.y < minY) {
      minY = circle.y;
    }

    if (circle.y > maxY) {
      maxY = circle.y;
    }
  }

  minX = minX - 10;
  maxX = maxX + 10;
  minY = minY - 10;
  maxY = maxY + 10;

  const width = maxX - minX;
  const height = maxY - minY;

  const ctx = new canvasToSvg(width, height);

  const svgElement = ctx.getSvg();
  svgElement.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);

  svgElement.setAttribute("width", width);
  svgElement.setAttribute("height", height);

  for (const link of graph.links) {
    drawLineCanvas(ctx, link, linkColorScheme.colorScheme, linksAttribsToColorIndices);
  }

  for (const node of graph.nodes) {
    const { sameNode, circle } = nodeMap[node.id];

    drawCircleCanvas(ctx, node, circle, circleBorderColor, nodeColorScheme.colorScheme, nodeAttribsToColorIndices);
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
  linksAttribsToColorIndices,
  circleBorderColor,
  nodeColorScheme,
  nodeAttribsToColorIndices,
  nodeMap
) {
  const firstNode = graph.nodes[0];
  const { circle: firstCircle } = nodeMap[firstNode.id];

  let minX = firstCircle.x;
  let maxX = firstCircle.x;
  let minY = firstCircle.y;
  let maxY = firstCircle.y;

  for (const node of graph.nodes) {
    const { circle } = nodeMap[node.id];
    minX = Math.min(minX, circle.x);
    maxX = Math.max(maxX, circle.x);
    minY = Math.min(minY, circle.y);
    maxY = Math.max(maxY, circle.y);
  }

  // Puffer hinzufügen
  minX -= 10;
  maxX += 10;
  minY -= 10;
  maxY += 10;

  const width = maxX - minX;
  const height = maxY - minY;

  const ctx = new canvasToSvg(width, height);
  const svgElement = ctx.getSvg();
  svgElement.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
  svgElement.setAttribute("width", width);
  svgElement.setAttribute("height", height);

  for (const link of graph.links) {
    drawLineCanvas(ctx, link, linkColorScheme.colorScheme, linksAttribsToColorIndices);
  }

  for (const node of graph.nodes) {
    const { circle } = nodeMap[node.id];
    drawCircleCanvas(ctx, node, circle, circleBorderColor, nodeColorScheme.colorScheme, nodeAttribsToColorIndices);
  }

  // PDF-Seite auf die SVG-Größe plus Rand einstellen (10px an allen Seiten)
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

export function downloadLegendPdf(settings, graphData) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const padding = 20;
  const rectWidth = 18;
  let y = padding;

  pdf.setFontSize(13);
  pdf.text("Nodes", padding, y);
  y += 6;

  for (const key in settings.appearance.nodeAttribsToColorIndices) {
    if (settings.appearance.nodeAttribsToColorIndices.hasOwnProperty(key)) {
      const colorIndex = settings.appearance.nodeAttribsToColorIndices[key];
      const color = settings.appearance.nodeColorScheme.colorScheme[colorIndex];
      const label = graphData.activeAnnotationMapping?.groupMapping?.[key]?.name || key;

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
  pdf.setFontSize(13);
  pdf.text("Links", padding, y);
  y += 6;

  for (const key in settings.appearance.linkAttribsToColorIndices) {
    if (settings.appearance.linkAttribsToColorIndices.hasOwnProperty(key)) {
      const colorIndex = settings.appearance.linkAttribsToColorIndices[key];
      const color = settings.appearance.linkColorScheme.colorScheme[colorIndex];

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
