import canvasToSvg from "canvas-to-svg";
import { computeLightingTint, drawCircleCanvas, drawLineCanvas, radius, rimRadiusFactor, rimWidthFactor } from "../canvas_drawing/draw.js";

function computeNodeBounds(node, mapEntry, tempCtx) {
  const labelVisible = node.labelVisible ?? mapEntry?.nodeLabel?.visible ?? false;
  const labelText = node.labelText ?? mapEntry?.nodeLabel?.text ?? node.id;
  const labelX = node.labelX ?? mapEntry?.nodeLabel?.x ?? node.x;
  const labelY = node.labelY ?? mapEntry?.nodeLabel?.y ?? node.y;
  const fontSize = mapEntry?.nodeLabel?._fontSize || 12;
  const scale = node.scale ?? mapEntry?.circle?.scale?.x ?? 1;
  const nodeRadius = radius * scale;
  const rimOuterRadius = nodeRadius * (rimRadiusFactor + rimWidthFactor);
  const highlightRadius = nodeRadius * 0.65;
  const paddedRadius = Math.max(nodeRadius, rimOuterRadius, highlightRadius) + 2;
  const labelDrawY = labelY + 10;

  if (labelVisible) tempCtx.font = `${fontSize}px sans-serif`;
  const textWidth = labelVisible ? tempCtx.measureText(labelText).width : 0;
  const labelXMin = labelVisible ? labelX - textWidth / 2 : node.x;
  const labelXMax = labelVisible ? labelX + textWidth / 2 : node.x;

  return {
    minX: Math.min(node.x - paddedRadius, labelXMin - 10),
    maxX: Math.max(node.x + paddedRadius, labelXMax + 10),
    minY: Math.min(node.y - paddedRadius, labelDrawY - 10),
    maxY: Math.max(node.y + paddedRadius, labelDrawY + 10),
  };
}

export function measureGraphBounds(graphData, nodeMap) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  const tempCtx = document.createElement("canvas").getContext("2d");

  for (const node of graphData.nodes) {
    const { minX: nx, maxX: nX, minY: ny, maxY: nY } = computeNodeBounds(node, nodeMap?.[node.id], tempCtx);
    minX = Math.min(minX, nx);
    maxX = Math.max(maxX, nX);
    minY = Math.min(minY, ny);
    maxY = Math.max(maxY, nY);
  }

  if (graphData.gridLines?.length) {
    for (const line of graphData.gridLines) {
      minX = Math.min(minX, line.x1, line.x2);
      maxX = Math.max(maxX, line.x1, line.x2);
      minY = Math.min(minY, line.y1, line.y2);
      maxY = Math.max(maxY, line.y1, line.y2);
    }
  }

  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

export function createSvgContext(bounds, canvasFactory) {
  const createCtx = canvasFactory || (() => new canvasToSvg(bounds.width, bounds.height));
  const ctx = createCtx();
  const svgElement = ctx.getSvg();
  svgElement.setAttribute("viewBox", `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`);
  svgElement.setAttribute("width", bounds.width);
  svgElement.setAttribute("height", bounds.height);
  return { ctx, svgElement };
}

export function build3DRenderQueue(graphData, nodeMap) {
  const items = [];
  if (graphData.gridLines?.length) {
    for (const line of graphData.gridLines) {
      items.push({ type: "grid", depth: line.depth ?? 0, line });
    }
  }
  for (const link of graphData.links) {
    items.push({ type: "link", depth: link.depth ?? 0, link });
  }
  for (const node of graphData.nodes) {
    const mapEntry = nodeMap?.[node.id];
    items.push({ type: "node", depth: node.depth ?? 0, node, mapEntry });
    const labelVisible = node.labelVisible ?? mapEntry?.nodeLabel?.visible ?? false;
    if (labelVisible) {
      items.push({ type: "label", depth: node.depth ?? 0, node, mapEntry });
    }
  }

  const priority = { grid: -1, link: 0, node: 1, label: 2 };
  items.sort((a, b) => (b.depth ?? 0) - (a.depth ?? 0) || (priority[a.type] ?? 0) - (priority[b.type] ?? 0));
  return items;
}

const DEFAULT_FONT_SIZE = 12;

export function drawLabel(ctx, node, mapEntry, textColor) {
  const labelText = node.labelText ?? mapEntry?.nodeLabel?.text ?? node.id;
  const baseFontSize = mapEntry?.nodeLabel?._fontSize || DEFAULT_FONT_SIZE;
  const scale = node.scale ?? mapEntry?.circle?.scale?.x ?? 1;
  const labelX = node.labelX ?? mapEntry?.nodeLabel?.x ?? node.x;
  const labelY = (node.labelY ?? mapEntry?.nodeLabel?.y ?? node.y) + 10 * scale;
  const fontSize = baseFontSize * scale;

  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = textColor;
  const textWidth = ctx.measureText(labelText).width;
  ctx.fillText(labelText, labelX - textWidth / 2, labelY);
}

export function render3DQueue(ctx, items, drawParams) {
  const {
    linkWidth,
    linkColorscheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    nodeColorscheme,
    nodeAttribsToColorIndices,
    textColor,
    enableShading,
  } = drawParams;

  for (const item of items) {
    if (item.type === "grid") {
      drawGridLine(ctx, item.line);
    } else if (item.type === "link") {
      const link = item.link;
      const sourceScale = link.source?.scale ?? 1;
      const targetScale = link.target?.scale ?? 1;
      const widthScale = (sourceScale + targetScale) / 2;
      drawLineCanvas(ctx, link, linkWidth, linkColorscheme, linkAttribsToColorIndices, { widthScale });
    } else if (item.type === "node") {
      const { node, mapEntry } = item;
      const scale = node.scale ?? mapEntry?.circle?.scale?.x ?? 1;
      const tint = computeLightingTint(scale);
      drawCircleCanvas(ctx, node, mapEntry?.circle, circleBorderColor, nodeColorscheme, nodeAttribsToColorIndices, {
        scale,
        tint,
        enableShading,
      });
    } else if (item.type === "label") {
      drawLabel(ctx, item.node, item.mapEntry, textColor);
    }
  }
}

export function render2DGraph(ctx, graphData, nodeMap, params) {
  const { linkWidth, linkColorscheme, linkAttribsToColorIndices, circleBorderColor, nodeColorscheme, nodeAttribsToColorIndices, textColor } = params;

  for (const link of graphData.links) {
    drawLineCanvas(ctx, link, linkWidth, linkColorscheme, linkAttribsToColorIndices);
  }

  for (const node of graphData.nodes) {
    const mapEntry = nodeMap?.[node.id];
    drawCircleCanvas(ctx, node, mapEntry?.circle, circleBorderColor, nodeColorscheme, nodeAttribsToColorIndices);
    const labelVisible = node.labelVisible ?? mapEntry?.nodeLabel?.visible ?? false;
    if (labelVisible) {
      drawLabel(ctx, node, mapEntry, textColor);
    }
  }
}

function drawGridLine(ctx, line) {
  if (!line) return;
  ctx.save();
  ctx.globalAlpha = line.edge ? 0.65 : 0.35;
  ctx.lineWidth = line.width ?? 1;
  ctx.strokeStyle = line.edge ? "#a7b4c9" : "#d7dde8";
  ctx.beginPath();
  ctx.moveTo(line.x1, line.y1);
  ctx.lineTo(line.x2, line.y2);
  ctx.stroke();
  ctx.restore();
}
