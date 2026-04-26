import canvasToSvg from "canvas-to-svg";
import { drawCircleCanvas, radius } from "../canvas_drawing/nodes.js";
import { drawLineCanvas } from "../canvas_drawing/lines.js";
import { computeLightingTint, rimRadiusFactor, rimWidthFactor } from "../canvas_drawing/shading.js";
import { defaultCamera } from "../canvas_drawing/render3D.js";
import { getNodeLabelOffsetY } from "../canvas_drawing/drawingUtils.js";
import { getNodeIdName } from "../parsing/nodeIdParsing.js";

function computeNodeBounds(node, mapEntry, tempCtx) {
  const labelVisible = node.labelVisible ?? mapEntry?.nodeLabel?.visible ?? false;
  const labelText = node.labelText ?? mapEntry?.nodeLabel?.text ?? getNodeIdName(node.id);
  const labelX = node.labelX ?? mapEntry?.nodeLabel?.x ?? node.x;
  const scale = node.scale ?? mapEntry?.circle?.scale?.x ?? 1;
  const labelY = node.labelY ?? mapEntry?.nodeLabel?.y ?? node.y + getNodeLabelOffsetY(node.id) * scale;
  const fontSize = node.labelFontSize ?? mapEntry?.nodeLabel?._fontSize ?? 12;
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
  const labelText = node.labelText ?? mapEntry?.nodeLabel?.text ?? getNodeIdName(node.id);
  const baseFontSize = node.labelFontSize ?? mapEntry?.nodeLabel?._fontSize ?? DEFAULT_FONT_SIZE;
  const scale = node.scale ?? mapEntry?.circle?.scale?.x ?? 1;
  const labelX = node.labelX ?? mapEntry?.nodeLabel?.x ?? node.x;
  const labelTopY = node.labelY ?? mapEntry?.nodeLabel?.y ?? node.y + getNodeLabelOffsetY(node.id) * scale;
  const labelY = labelTopY + 10 * scale;
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
    highlightNodeIds,
    communityHighlightNodeIds,
    highlightColor,
    communityHighlightColor,
  } = drawParams;
  const highlightNodeIdSet = toNodeIdSet(highlightNodeIds);
  const communityHighlightNodeIdSet = toNodeIdSet(communityHighlightNodeIds);

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
      drawNodeHighlightIfActive(ctx, node, highlightNodeIdSet, highlightColor, scale);
      drawNodeHighlightIfActive(ctx, node, communityHighlightNodeIdSet, communityHighlightColor, scale);
    } else if (item.type === "label") {
      drawLabel(ctx, item.node, item.mapEntry, textColor);
    }
  }
}

export function render2DGraph(ctx, graphData, nodeMap, params) {
  const {
    linkWidth,
    linkColorscheme,
    linkAttribsToColorIndices,
    circleBorderColor,
    nodeColorscheme,
    nodeAttribsToColorIndices,
    textColor,
    highlightNodeIds,
    communityHighlightNodeIds,
    highlightColor,
    communityHighlightColor,
  } = params;
  const highlightNodeIdSet = toNodeIdSet(highlightNodeIds);
  const communityHighlightNodeIdSet = toNodeIdSet(communityHighlightNodeIds);

  for (const link of graphData.links) {
    drawLineCanvas(ctx, link, linkWidth, linkColorscheme, linkAttribsToColorIndices);
  }

  for (const node of graphData.nodes) {
    const mapEntry = nodeMap?.[node.id];
    drawCircleCanvas(ctx, node, mapEntry?.circle, circleBorderColor, nodeColorscheme, nodeAttribsToColorIndices);
    drawNodeHighlightIfActive(ctx, node, highlightNodeIdSet, highlightColor);
    drawNodeHighlightIfActive(ctx, node, communityHighlightNodeIdSet, communityHighlightColor);
    const labelVisible = node.labelVisible ?? mapEntry?.nodeLabel?.visible ?? false;
    if (labelVisible) {
      drawLabel(ctx, node, mapEntry, textColor);
    }
  }
}

export function build2DFrameGraphData(graphData, nodeMap, { showNodeLabels = false } = {}) {
  if (!graphData?.nodes || !graphData?.links) return null;

  const nodes = graphData.nodes.map((node) => buildFrameNode(node, nodeMap?.[node.id], { showNodeLabels }));
  const nodeLookup = new Map(nodes.map((node) => [node.id, node]));
  const links = buildFrameLinks(graphData.links, nodeLookup);

  return { nodes, links };
}

export function build3DFrameGraphData(
  graphData,
  nodeMap,
  { camera, sourceContainer, targetContainer, showNodeLabels = false, gridLines = [] } = {}
) {
  if (!graphData?.nodes || !graphData?.links || !targetContainer?.width || !targetContainer?.height) {
    return { graph: null, gridSegments: [] };
  }

  const worldNodes = graphData.nodes.map((node) => translateNodeForContainer(node, sourceContainer, targetContainer));
  const frameCamera = translateCameraForContainer(camera, sourceContainer, targetContainer);
  const view = getViewParams(frameCamera, targetContainer.width, targetContainer.height);
  const projections = computeProjections(worldNodes, view);

  const nodes = [];
  const nodeLookup = new Map();

  worldNodes.forEach((node) => {
    const projection = projections[node.id];
    if (!projection || projection.visible === false) return;

    const frameNode = {
      ...buildFrameNode(node, nodeMap?.[node.id], { showNodeLabels }),
      x: projection.x,
      y: projection.y,
      scale: projection.scale,
      depth: projection.depth,
      labelX: projection.x,
      labelY: projection.y + getNodeLabelOffsetY(node.id) * projection.scale,
    };

    nodes.push(frameNode);
    nodeLookup.set(node.id, frameNode);
  });

  const links = buildFrameLinks(graphData.links, nodeLookup);
  const shiftedGridLines = translateGridLinesForContainer(gridLines, sourceContainer, targetContainer);
  const gridSegments = projectGridLines(shiftedGridLines, frameCamera, targetContainer);

  return {
    graph: { nodes, links },
    gridSegments,
  };
}

export function renderGraphFrameToCanvas(
  ctx,
  graphData,
  drawParams,
  { threeD = false, enableShading = true, showGrid = false, gridSegments = [], transform = null } = {}
) {
  if (!ctx || !graphData) return;

  ctx.save();

  if (transform) {
    ctx.translate(transform.x ?? 0, transform.y ?? 0);
    ctx.scale(transform.k ?? 1, transform.k ?? 1);
  }

  if (threeD) {
    const queue = build3DRenderQueue(graphData, null);
    render3DQueue(ctx, queue, { ...drawParams, enableShading }, { showGrid, segments: gridSegments });
  } else {
    render2DGraph(ctx, graphData, null, drawParams);
  }

  ctx.restore();
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

function drawNodeHighlightIfActive(ctx, node, nodeIdSet, color, scale = 1) {
  if (!node || !nodeIdSet?.has?.(String(node.id)) || !color) return;

  const centerX = node.x ?? 0;
  const centerY = node.y ?? 0;
  const safeScale = Number.isFinite(scale) ? scale : 1;
  const rings = [
    { radius: radius + 4, width: 3, alpha: 1 },
    { radius: radius + 8, width: 2, alpha: 0.7 },
    { radius: radius + 11, width: 1, alpha: 0.4 },
  ];

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = color;
  for (const ring of rings) {
    ctx.beginPath();
    ctx.globalAlpha = ring.alpha;
    ctx.lineWidth = ring.width * safeScale;
    ctx.arc(centerX, centerY, ring.radius * safeScale, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

function toNodeIdSet(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return null;
  return new Set(ids.map((id) => String(id)));
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

function computeProjections(nodes, view, result = {}) {
  for (const node of nodes) {
    const existing = result[node.id];
    const projection = projectNode(node, view, existing && typeof existing === "object" ? existing : undefined);
    result[node.id] = projection;
  }

  return result;
}

function projectNode(node, params, out) {
  const { cameraX, cameraY, cameraZ, fov, centerX, centerY, cosX, sinX, cosY, sinY } = params;

  const shiftedX = node.x - centerX;
  const shiftedY = node.y - centerY;
  const zBase = node.z ?? 0;

  let x = shiftedX * cosY - zBase * sinY;
  let z = shiftedX * sinY + zBase * cosY;

  let y = shiftedY * cosX - z * sinX;
  z = shiftedY * sinX + z * cosX;

  const dx = x + centerX - cameraX;
  const dy = y + centerY - cameraY;
  const dz = z - cameraZ;

  const target = out || {};

  if (dz <= 0.000001) {
    if (!out) return null;
    target.visible = false;
    return target;
  }

  const depth = Math.abs(dz);
  const scale = fov / depth;

  target.x = centerX + dx * scale;
  target.y = centerY + dy * scale;
  target.scale = scale;
  target.depth = depth;
  target.visible = true;

  return target;
}

function projectPoint(node, params) {
  return projectNode(node, params);
}

function getViewParams(camera, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const rotX = camera?.rotX ?? defaultCamera.rotX;
  const rotY = camera?.rotY ?? defaultCamera.rotY;
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);

  return {
    rotX,
    rotY,
    cosX,
    sinX,
    cosY,
    sinY,
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

function buildFrameNode(node, mapEntry, { showNodeLabels = false } = {}) {
  const nodeLabel = mapEntry?.nodeLabel;
  const labelText = nodeLabel?.text ?? getNodeIdName(node.id);
  const scale = node.scale ?? 1;

  return {
    ...node,
    scale,
    depth: node.depth ?? 0,
    labelVisible: showNodeLabels,
    labelX: node.labelX ?? node.x,
    labelY: node.labelY ?? node.y + getNodeLabelOffsetY(node.id) * scale,
    labelText,
    labelFontSize: nodeLabel?._fontSize ?? DEFAULT_FONT_SIZE,
  };
}

function buildFrameLinks(links, nodeLookup) {
  return (links ?? [])
    .map((link) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source;
      const targetId = typeof link.target === "object" ? link.target.id : link.target;

      const source = nodeLookup.get(sourceId);
      const target = nodeLookup.get(targetId);
      if (!source || !target) return null;

      return {
        ...link,
        depth: Math.max(source.depth ?? 0, target.depth ?? 0),
        source: { x: source.x, y: source.y, scale: source.scale, depth: source.depth },
        target: { x: target.x, y: target.y, scale: target.scale, depth: target.depth },
      };
    })
    .filter(Boolean);
}

function translateNodeForContainer(node, sourceContainer, targetContainer) {
  const sourceCenterX = (sourceContainer?.width ?? targetContainer?.width ?? 0) / 2;
  const sourceCenterY = (sourceContainer?.height ?? targetContainer?.height ?? 0) / 2;
  const targetCenterX = (targetContainer?.width ?? 0) / 2;
  const targetCenterY = (targetContainer?.height ?? 0) / 2;

  return {
    ...node,
    x: (node?.x ?? sourceCenterX) - sourceCenterX + targetCenterX,
    y: (node?.y ?? sourceCenterY) - sourceCenterY + targetCenterY,
  };
}

function translateCameraForContainer(camera, sourceContainer, targetContainer) {
  const sourceCenterX = (sourceContainer?.width ?? targetContainer?.width ?? 0) / 2;
  const sourceCenterY = (sourceContainer?.height ?? targetContainer?.height ?? 0) / 2;
  const targetCenterX = (targetContainer?.width ?? 0) / 2;
  const targetCenterY = (targetContainer?.height ?? 0) / 2;

  return {
    ...camera,
    x: (camera?.x ?? sourceCenterX) - sourceCenterX + targetCenterX,
    y: (camera?.y ?? sourceCenterY) - sourceCenterY + targetCenterY,
  };
}

function translateGridLinesForContainer(gridLines, sourceContainer, targetContainer) {
  const sourceCenterX = (sourceContainer?.width ?? targetContainer?.width ?? 0) / 2;
  const sourceCenterY = (sourceContainer?.height ?? targetContainer?.height ?? 0) / 2;
  const targetCenterX = (targetContainer?.width ?? 0) / 2;
  const targetCenterY = (targetContainer?.height ?? 0) / 2;
  const deltaX = targetCenterX - sourceCenterX;
  const deltaY = targetCenterY - sourceCenterY;

  return (gridLines ?? []).map((line) => ({
    ...line,
    start: {
      ...line.start,
      x: (line.start?.x ?? sourceCenterX) + deltaX,
      y: (line.start?.y ?? sourceCenterY) + deltaY,
    },
    end: {
      ...line.end,
      x: (line.end?.x ?? sourceCenterX) + deltaX,
      y: (line.end?.y ?? sourceCenterY) + deltaY,
    },
  }));
}
