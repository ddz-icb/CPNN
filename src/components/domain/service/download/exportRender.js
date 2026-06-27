import canvasToSvg from "canvas-to-svg";
import { drawCircleCanvas, radius } from "../canvas_drawing/nodes.js";
import { drawLineCanvas, MIN_3D_LINK_SCREEN_LENGTH } from "../canvas_drawing/lineGraphics.js";
import { computeLightingTint, rimRadiusFactor, rimWidthFactor } from "../canvas_drawing/shading.js";
import { getNodeLabelOffsetY } from "../canvas_drawing/drawingUtils.js";
import { getCameraViewParams } from "../canvas_drawing/camera3D.js";
import { getLinkIdText } from "../graph_calculations/graphUtils.js";
import { getNodeIdName } from "../parsing/nodeIdParsing.js";
import {
  computeProjections,
  projectGridLines,
  translateCameraForContainer,
  translateGridLinesForContainer,
  translateNodeForContainer,
} from "./exportProjection.js";

const NODE_HIGHLIGHT_OUTER_RADIUS = radius + 11.5;
const LINK_HIGHLIGHT_STROKES = [
  { outset: 4.5, alpha: 0.5 },
  { outset: 2, alpha: 0.7 },
];
const LINK_HIGHLIGHT_ENDPOINT_INSET = radius + 1;

function computeNodeBounds(node, mapEntry, tempCtx) {
  const labelVisible = node.labelVisible ?? mapEntry?.nodeLabel?.visible ?? false;
  const labelText = node.labelText ?? mapEntry?.nodeLabel?.text ?? getNodeIdName(node.id);
  const labelX = node.labelX ?? mapEntry?.nodeLabel?.x ?? node.x;
  const scale = node.scale ?? mapEntry?.circle?.scale?.x ?? 1;
  const labelY = node.labelY ?? mapEntry?.nodeLabel?.y ?? node.y + getNodeLabelOffsetY(node.id) * scale;
  const fontSize = node.labelFontSize ?? mapEntry?.nodeLabel?._fontSize ?? 12;
  const nodeRadius = radius * scale;
  const rimOuterRadius = nodeRadius * (rimRadiusFactor + rimWidthFactor);
  const highlightRadius = NODE_HIGHLIGHT_OUTER_RADIUS * scale;
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
  graphData.links.forEach((link, index) => {
    items.push({ type: "link", depth: link.depth ?? 0, link, index });
  });
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
    highlightLinkIds,
    communityHighlightNodeIds,
    highlightColor,
    communityHighlightColor,
  } = drawParams;
  const highlightNodeIdSet = toNodeIdSet(highlightNodeIds);
  const highlightLinkIdSet = toNodeIdSet(highlightLinkIds);
  const communityHighlightNodeIdSet = toNodeIdSet(communityHighlightNodeIds);

  if (gridOptions?.showGrid && Array.isArray(gridOptions.segments)) {
    drawGridExport(ctx, gridOptions.segments, textColor);
  }

  for (const item of items) {
    if (item.type === "link") {
      const link = item.link;
      const alpha = getRenderAlpha(link);
      if (alpha <= 0) continue;
      const sourceScale = link.source?.scale ?? 1;
      const targetScale = link.target?.scale ?? 1;
      const widthScale = (sourceScale + targetScale) / 2;
      if (alpha < 1) {
        ctx.save();
        ctx.globalAlpha *= alpha;
      }
      drawLinkHighlightIfActive(ctx, link, item.index, highlightLinkIdSet, highlightColor, linkWidth, widthScale);
      drawLineCanvas(ctx, link, linkWidth, linkColorscheme, linkAttribsToColorIndices, {
        widthScale,
        minLength: MIN_3D_LINK_SCREEN_LENGTH,
      });
      if (alpha < 1) ctx.restore();
    } else if (item.type === "node") {
      const { node, mapEntry } = item;
      const scale = node.scale ?? mapEntry?.circle?.scale?.x ?? 1;
      const tint = computeLightingTint(scale);
      const alpha = getRenderAlpha(node);
      if (alpha <= 0) continue;
      if (alpha < 1) {
        ctx.save();
        ctx.globalAlpha *= alpha;
      }
      drawCircleCanvas(ctx, node, mapEntry?.circle, circleBorderColor, nodeColorscheme, nodeAttribsToColorIndices, {
        scale,
        tint,
        enableShading,
        alpha,
      });
      drawNodeHighlightIfActive(ctx, node, highlightNodeIdSet, highlightColor, scale, alpha);
      drawNodeHighlightIfActive(ctx, node, communityHighlightNodeIdSet, communityHighlightColor, scale, alpha);
      if (alpha < 1) ctx.restore();
    } else if (item.type === "label") {
      const alpha = getRenderAlpha(item.node);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= alpha;
      drawLabel(ctx, item.node, item.mapEntry, textColor);
      ctx.restore();
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
    highlightLinkIds,
    communityHighlightNodeIds,
    highlightColor,
    communityHighlightColor,
  } = params;
  const highlightNodeIdSet = toNodeIdSet(highlightNodeIds);
  const highlightLinkIdSet = toNodeIdSet(highlightLinkIds);
  const communityHighlightNodeIdSet = toNodeIdSet(communityHighlightNodeIds);

  for (let index = 0; index < graphData.links.length; index += 1) {
    const link = graphData.links[index];
    const alpha = getRenderAlpha(link);
    if (alpha <= 0) continue;
    if (alpha < 1) {
      ctx.save();
      ctx.globalAlpha *= alpha;
    }
    drawLinkHighlightIfActive(ctx, link, index, highlightLinkIdSet, highlightColor, linkWidth);
    drawLineCanvas(ctx, link, linkWidth, linkColorscheme, linkAttribsToColorIndices);
    if (alpha < 1) ctx.restore();
  }

  for (const node of graphData.nodes) {
    const mapEntry = nodeMap?.[node.id];
    const alpha = getRenderAlpha(node);
    if (alpha <= 0) continue;
    if (alpha < 1) {
      ctx.save();
      ctx.globalAlpha *= alpha;
    }
    drawCircleCanvas(ctx, node, mapEntry?.circle, circleBorderColor, nodeColorscheme, nodeAttribsToColorIndices, { alpha });
    drawNodeHighlightIfActive(ctx, node, highlightNodeIdSet, highlightColor, 1, alpha);
    drawNodeHighlightIfActive(ctx, node, communityHighlightNodeIdSet, communityHighlightColor, 1, alpha);
    const labelVisible = node.labelVisible ?? mapEntry?.nodeLabel?.visible ?? false;
    if (labelVisible) {
      drawLabel(ctx, node, mapEntry, textColor);
    }
    if (alpha < 1) ctx.restore();
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

  const sameContainerSize =
    sourceContainer?.width === targetContainer.width &&
    sourceContainer?.height === targetContainer.height;
  const worldNodes = sameContainerSize
    ? graphData.nodes
    : graphData.nodes.map((node) => translateNodeForContainer(node, sourceContainer, targetContainer));
  const frameCamera = sameContainerSize
    ? camera
    : translateCameraForContainer(camera, sourceContainer, targetContainer);
  const view = getCameraViewParams(frameCamera, targetContainer.width, targetContainer.height);
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
  const shiftedGridLines = sameContainerSize
    ? gridLines
    : translateGridLinesForContainer(gridLines, sourceContainer, targetContainer);
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

function drawNodeHighlightIfActive(ctx, node, nodeIdSet, color, scale = 1, alpha = 1) {
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
    ctx.globalAlpha = ring.alpha * alpha;
    ctx.lineWidth = ring.width * safeScale;
    ctx.arc(centerX, centerY, ring.radius * safeScale, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLinkHighlightIfActive(ctx, link, index, linkIdSet, color, linkWidth, widthScale = 1) {
  const linkIndex = Number.isInteger(link?.__linkIndex) ? link.__linkIndex : index;
  const linkId = getLinkIdText(link, linkIndex, link?.__sourceId, link?.__targetId);
  if (!link || !linkIdSet?.has?.(linkId) || !color) return;

  const sourceX = link.source?.x;
  const sourceY = link.source?.y;
  const targetX = link.target?.x;
  const targetY = link.target?.y;
  if (![sourceX, sourceY, targetX, targetY].every(Number.isFinite)) return;

  const trimmed = getTrimmedLineEndpoints(sourceX, sourceY, targetX, targetY, LINK_HIGHLIGHT_ENDPOINT_INSET * getDepthScale(widthScale));
  const bundleWidth = getBaseLinkWidth(linkWidth) * getDepthScale(widthScale) * getLinkAttribCount(link);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.setLineDash([]);
  const baseAlpha = ctx.globalAlpha;

  for (const stroke of LINK_HIGHLIGHT_STROKES) {
    ctx.beginPath();
    ctx.globalAlpha = baseAlpha * stroke.alpha;
    ctx.lineWidth = bundleWidth + stroke.outset * getDepthScale(widthScale) * 2;
    ctx.moveTo(trimmed.sourceX, trimmed.sourceY);
    ctx.lineTo(trimmed.targetX, trimmed.targetY);
    ctx.stroke();
  }

  ctx.restore();
}

function getBaseLinkWidth(width) {
  const numericWidth = Number(width);
  return Number.isFinite(numericWidth) && numericWidth > 0 ? numericWidth : 1;
}

function getDepthScale(scale) {
  const numericScale = Number(scale);
  return Number.isFinite(numericScale) && numericScale > 0 ? numericScale : 1;
}

function getLinkAttribCount(link) {
  return Math.max(1, Array.isArray(link?.attribs) ? link.attribs.length : 1);
}

function getTrimmedLineEndpoints(x1, y1, x2, y2, endpointInset = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const inset = Number(endpointInset);

  if (!Number.isFinite(length) || length <= 0 || !Number.isFinite(inset) || inset <= 0) {
    return { sourceX: x1, sourceY: y1, targetX: x2, targetY: y2 };
  }

  const safeInset = Math.min(inset, Math.max(0, length / 2 - 0.5));
  if (safeInset <= 0) {
    return { sourceX: x1, sourceY: y1, targetX: x2, targetY: y2 };
  }

  const unitX = dx / length;
  const unitY = dy / length;

  return {
    sourceX: x1 + unitX * safeInset,
    sourceY: y1 + unitY * safeInset,
    targetX: x2 - unitX * safeInset,
    targetY: y2 - unitY * safeInset,
  };
}

function getRenderAlpha(item) {
  const alpha = Number.parseFloat(item?.__alpha);
  if (!Number.isFinite(alpha)) return 1;
  return clamp(alpha, 0, 1);
}

function toNodeIdSet(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return null;
  return new Set(ids.map((id) => String(id)));
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
    .map((link, index) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source;
      const targetId = typeof link.target === "object" ? link.target.id : link.target;

      const source = nodeLookup.get(sourceId);
      const target = nodeLookup.get(targetId);
      if (!source || !target) return null;

      return {
        ...link,
        __linkIndex: index,
        __sourceId: sourceId,
        __targetId: targetId,
        depth: Math.max(source.depth ?? 0, target.depth ?? 0),
        source: { x: source.x, y: source.y, scale: source.scale, depth: source.depth },
        target: { x: target.x, y: target.y, scale: target.scale, depth: target.depth },
      };
    })
    .filter(Boolean);
}
