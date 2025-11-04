import log from "../../../adapters/logging/logger.js";
import * as PIXI from "pixi.js";

const DEFAULT_LINE_COLOR = 0x3b82f6;
const DEFAULT_LINE_ALPHA = 0.85;
const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_DASH_LENGTH = 12;
const DEFAULT_GAP_LENGTH = 8;
const MIN_POINT_DISTANCE = 6;

function defaultOnSelect(selection) {
  const nodes = Array.isArray(selection?.nodes) ? selection.nodes.length : 0;
  log.info(`Lasso selection captured ${nodes} node(s).`, selection);
}

function normalizeColor(color, fallback) {
  if (typeof color === "number" && Number.isFinite(color)) {
    return color;
  }

  if (typeof color === "string") {
    const normalized = color.startsWith("#") ? color.slice(1) : color;
    const trimmed = normalized.length > 6 ? normalized.slice(0, 6) : normalized;
    const parsed = Number.parseInt(trimmed, 16);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toWorldPoint(app, clientX, clientY) {
  const globalPoint = new PIXI.Point();
  app.renderer.events.mapPositionToPoint(globalPoint, clientX, clientY);

  const worldPoint = new PIXI.Point();
  app.stage.toLocal(globalPoint, undefined, worldPoint);

  return worldPoint;
}

function pointerToWorld(app, pointerEvent) {
  return toWorldPoint(app, pointerEvent.clientX, pointerEvent.clientY);
}

function tracePolygonPath(graphics, polygonPoints, closePath = true) {
  graphics.moveTo(polygonPoints[0].x, polygonPoints[0].y);
  for (let i = 1; i < polygonPoints.length; i += 1) {
    graphics.lineTo(polygonPoints[i].x, polygonPoints[i].y);
  }
  if (closePath) {
    graphics.closePath();
  }
}

function drawDashedOutline(graphics, points, dashLength, gapLength, closePath = false) {
  if (!points || points.length < 2) {
    return;
  }

  const segmentCount = closePath ? points.length : points.length - 1;

  for (let i = 0; i < segmentCount; i += 1) {
    const startPoint = points[i];
    const endPoint = i === points.length - 1 ? points[0] : points[i + 1];

    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const segmentLength = Math.hypot(dx, dy);

    if (segmentLength === 0) {
      continue;
    }

    const directionX = dx / segmentLength;
    const directionY = dy / segmentLength;

    let draw = true;
    let distanceCovered = 0;
    let currentX = startPoint.x;
    let currentY = startPoint.y;

    graphics.moveTo(currentX, currentY);

    while (distanceCovered < segmentLength) {
      const remaining = segmentLength - distanceCovered;
      const step = Math.min(draw ? dashLength : gapLength, remaining);

      currentX += directionX * step;
      currentY += directionY * step;

      if (draw) {
        graphics.lineTo(currentX, currentY);
      } else {
        graphics.moveTo(currentX, currentY);
      }

      distanceCovered += step;
      draw = !draw;
    }
  }
}

function isPointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function collectNodesWithinPolygon(nodeMap, polygon) {
  if (!nodeMap || !polygon || polygon.length < 3) {
    return [];
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  polygon.forEach((point) => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });

  const nodes = [];

  Object.values(nodeMap).forEach((entry) => {
    if (!entry || !entry.node || !entry.circle || entry.circle.visible === false) {
      return;
    }

    const { x, y } = entry.circle;

    if (x < minX || x > maxX || y < minY || y > maxY) {
      return;
    }

    if (isPointInPolygon({ x, y }, polygon)) {
      nodes.push(entry.node.id);
    }
  });

  return nodes;
}

export function enableLasso({
  app,
  nodeMap,
  onSelect = defaultOnSelect,
  lineColor = DEFAULT_LINE_COLOR,
} = {}) {
  if (!app?.renderer?.canvas) {
    return () => {};
  }

  const normalizedLineColor = normalizeColor(lineColor, DEFAULT_LINE_COLOR);

  const state = {
    isDrawing: false,
    points: [],
  };

  const previewOutline = new PIXI.Graphics();
  previewOutline.zIndex = 1000;
  previewOutline.eventMode = "none";

  app.stage.sortableChildren = true;
  app.stage.addChild(previewOutline);

  const canvas = app.renderer.canvas;
  const previousCursor = canvas.style.cursor;
  canvas.style.cursor = "crosshair";

  const drawOutline = (polygonPoints, { closePath = false, dashed = true } = {}) => {
    previewOutline.clear();

    if (!polygonPoints || polygonPoints.length < 2) {
      return;
    }

    const scale = app.stage.scale?.x || 1;
    const strokeWidth = DEFAULT_LINE_WIDTH / scale;
    const dashLength = DEFAULT_DASH_LENGTH / scale;
    const gapLength = DEFAULT_GAP_LENGTH / scale;

    previewOutline.setStrokeStyle({
      width: strokeWidth,
      color: normalizedLineColor,
      alpha: DEFAULT_LINE_ALPHA,
      alignment: 0.5,
    });
    previewOutline.beginPath();

    if (dashed) {
      drawDashedOutline(previewOutline, polygonPoints, dashLength, gapLength, closePath);
    } else {
      tracePolygonPath(previewOutline, polygonPoints, closePath);
    }

    previewOutline.stroke();
  };

  const finishDrawing = () => {
    state.isDrawing = false;
    state.points = [];
    previewOutline.clear();
  };

  const handlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }

    state.isDrawing = true;
    state.points = [pointerToWorld(app, event)];
    drawOutline(state.points, { dashed: true, closePath: false });
  };

  const handlePointerMove = (event) => {
    if (!state.isDrawing || state.points.length === 0) {
      return;
    }

    event.preventDefault();

    const current = pointerToWorld(app, event);
    const last = state.points[state.points.length - 1];
    const scale = app.stage.scale?.x || 1;
    const minDistance = MIN_POINT_DISTANCE / scale;

    if (Math.hypot(current.x - last.x, current.y - last.y) >= minDistance) {
      state.points = [...state.points, current];
      drawOutline(state.points, { dashed: true, closePath: state.points.length >= 3 });
    }
  };

  const handlePointerUp = (event) => {
    if (!state.isDrawing || state.points.length === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }

    const endPoint = pointerToWorld(app, event);
    const last = state.points[state.points.length - 1];
    const scale = app.stage.scale?.x || 1;
    const minDistance = MIN_POINT_DISTANCE / scale;

    if (Math.hypot(endPoint.x - last.x, endPoint.y - last.y) >= minDistance) {
      state.points = [...state.points, endPoint];
    }

    if (state.points.length < 3) {
      finishDrawing();
      return;
    }

    const polygon = state.points.map((point) => ({ x: point.x, y: point.y }));

    const selectedNodes = collectNodesWithinPolygon(nodeMap, polygon);
    onSelect({
      polygon,
      nodes: selectedNodes,
    });

    finishDrawing();
  };

  const handlePointerCancel = () => {
    if (!state.isDrawing) {
      return;
    }

    finishDrawing();
  };

  canvas.addEventListener("pointerdown", handlePointerDown, true);
  canvas.addEventListener("pointermove", handlePointerMove, true);
  window.addEventListener("pointerup", handlePointerUp, true);
  window.addEventListener("pointercancel", handlePointerCancel, true);
  window.addEventListener("pointerleave", handlePointerCancel, true);

  const cleanup = () => {
    state.isDrawing = false;
    state.points = [];
    canvas.style.cursor = previousCursor;

    canvas.removeEventListener("pointerdown", handlePointerDown, true);
    canvas.removeEventListener("pointermove", handlePointerMove, true);
    window.removeEventListener("pointerup", handlePointerUp, true);
    window.removeEventListener("pointercancel", handlePointerCancel, true);
    window.removeEventListener("pointerleave", handlePointerCancel, true);

    previewOutline.destroy({ children: true });
  };

  cleanup.clearSelection = () => {
    previewOutline.clear();
  };

  return cleanup;
}
