import canvasToSvg from "canvas-to-svg";
import { drawCircleCanvas, radius } from "../canvas_drawing/nodes.js";
import { drawLineCanvas } from "../canvas_drawing/lines.js";
import { computeLightingTint, rimRadiusFactor, rimWidthFactor } from "../canvas_drawing/shading.js";
import { defaultCamera } from "../canvas_drawing/render3D.js";

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

export function measureGraphBounds(graphData, nodeMap, { extraSegments = [] } = {}) {
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

  for (const seg of extraSegments) {
    if (!seg) continue;
    const points = [seg.p1, seg.p2].filter(Boolean);
    for (const p of points) {
      if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y)) continue;
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
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

  const priority = { link: 0, node: 1, label: 2 };
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

export function render3DQueue(ctx, items, drawParams, gridOptions) {
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

  if (gridOptions?.showGrid && Array.isArray(gridOptions.segments)) {
    drawGridExport(ctx, gridOptions.segments, textColor);
  }

  for (const item of items) {
    if (item.type === "link") {
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

function drawGridExport(ctx, segments, color) {
  ctx.save();
  ctx.strokeStyle = color ?? "#6b7280";
  ctx.globalAlpha = 1;

  for (const seg of segments) {
    const { p1, p2, axis } = seg || {};
    if (!p1 || !p2) continue;
    ctx.beginPath();
    ctx.lineWidth = axis ? 3 : 1.5;
    ctx.globalAlpha = axis ? 0.45 : 0.25;
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  ctx.restore();
}

export function projectGridLines(gridLines, camera, container) {
  if (!Array.isArray(gridLines) || !container) return [];
  const view = getViewParams(camera, container.width, container.height);
  const segments = [];

  for (const line of gridLines) {
    const p1 = projectPoint(line.start, view);
    const p2 = projectPoint(line.end, view);
    if (p1 && p2) {
      segments.push({ p1, p2, axis: line.axis });
    }
  }
  return segments;
}

function projectPoint(node, params) {
  const { rotX, rotY, cameraX, cameraY, cameraZ, fov, centerX, centerY } = params;

  const rotated = rotatePoint(node, rotX, rotY, centerX, centerY);

  const dx = rotated.x - cameraX;
  const dy = rotated.y - cameraY;
  let dz = rotated.z - cameraZ;

  if (dz <= 0.000001) {
    return null;
  }

  const depth = Math.abs(dz);
  const scale = fov / depth;

  return {
    x: centerX + dx * scale,
    y: centerY + dy * scale,
    scale,
    depth,
  };
}

function rotatePoint(node, rotX, rotY, centerX, centerY) {
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);

  const shiftedX = node.x - centerX;
  const shiftedY = node.y - centerY;
  const zBase = node.z ?? 0;

  let x = shiftedX * cosY - zBase * sinY;
  let z = shiftedX * sinY + zBase * cosY;

  let y = shiftedY * cosX - z * sinX;
  z = shiftedY * sinX + z * cosX;

  return { x: x + centerX, y: y + centerY, z };
}

function getViewParams(camera, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;

  return {
    rotX: camera?.rotX ?? defaultCamera.rotX,
    rotY: camera?.rotY ?? defaultCamera.rotY,
    cameraX: camera?.x ?? centerX,
    cameraY: camera?.y ?? centerY,
    cameraZ: camera?.z ?? defaultCamera.z,
    fov: camera?.fov ?? defaultCamera.fov,
    centerX,
    centerY,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
