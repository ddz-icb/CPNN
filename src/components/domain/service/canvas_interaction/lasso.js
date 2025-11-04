import log from "../../../adapters/logging/logger.js";
import * as PIXI from "pixi.js";

const DEFAULT_LINE_COLOR = 0x3b82f6;
const DEFAULT_SELECTED_FILL_COLOR = 0x3b82f6;
const DEFAULT_SELECTED_FILL_ALPHA = 0.2;
const DEFAULT_LINE_ALPHA = 0.85;
const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_DASH_LENGTH = 12;
const DEFAULT_GAP_LENGTH = 8;
const MIN_POINT_DISTANCE = 6;

function defaultOnSelect(selection) {
  log.info("Lasso selection", selection);
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

function mapClientToWorld(app, clientX, clientY) {
  const globalPoint = new PIXI.Point();
  app.renderer.events.mapPositionToPoint(globalPoint, clientX, clientY);

  const worldPoint = new PIXI.Point();
  app.stage.toLocal(globalPoint, undefined, worldPoint);

  return worldPoint;
}

function mapPointerToWorld(app, pointerEvent) {
  return mapClientToWorld(app, pointerEvent.clientX, pointerEvent.clientY);
}

function isPointInPolygon(point, polygon) {
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
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

    const nodePoint = { x: entry.circle.x, y: entry.circle.y };

    if (nodePoint.x < minX || nodePoint.x > maxX || nodePoint.y < minY || nodePoint.y > maxY) {
      return;
    }

    if (isPointInPolygon(nodePoint, polygon)) {
      nodes.push(entry.node.id);
    }
  });

  return nodes;
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

export function enableLasso({
  app,
  nodeMap,
  onSelect = defaultOnSelect,
  lineColor = DEFAULT_LINE_COLOR,
  selectedFillColor = DEFAULT_SELECTED_FILL_COLOR,
  selectedFillAlpha = DEFAULT_SELECTED_FILL_ALPHA,
} = {}) {
  if (!app || !app.renderer || !app.renderer.canvas) {
    return () => {};
  }

  const normalizedLineColor = normalizeColor(lineColor, DEFAULT_LINE_COLOR);
  const normalizedSelectedFillColor = normalizeColor(selectedFillColor, DEFAULT_SELECTED_FILL_COLOR);

  let isDrawing = false;
  let points = [];
  let hasSelection = false;

  const selectionFill = new PIXI.Graphics();
  selectionFill.zIndex = 999;
  selectionFill.alpha = selectedFillAlpha;
  selectionFill.visible = false;
  selectionFill.eventMode = "none";

  const previewOutline = new PIXI.Graphics();
  previewOutline.zIndex = 1000;
  previewOutline.eventMode = "none";

  app.stage.sortableChildren = true;
  app.stage.addChild(selectionFill);
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
    const lineWidth = DEFAULT_LINE_WIDTH / scale;
    const dashLength = DEFAULT_DASH_LENGTH / scale;
    const gapLength = DEFAULT_GAP_LENGTH / scale;

    previewOutline.setStrokeStyle({
      width: lineWidth,
      color: normalizedLineColor,
      alpha: DEFAULT_LINE_ALPHA,
      alignment: 0.5,
    });
    previewOutline.beginPath();

    if (dashed) {
      drawDashedOutline(previewOutline, polygonPoints, dashLength, gapLength, closePath);
    } else {
      previewOutline.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      for (let i = 1; i < polygonPoints.length; i += 1) {
        previewOutline.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      if (closePath) {
        previewOutline.closePath();
      }
    }

    previewOutline.stroke();
  };

  const updateSelectionFill = (polygonPoints) => {
    if (!polygonPoints || polygonPoints.length < 3) {
      if (!hasSelection) {
        selectionFill.clear();
        selectionFill.visible = false;
      }
      return;
    }

    selectionFill.clear();
    selectionFill.visible = true;
    selectionFill.beginPath();
    selectionFill.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonPoints.length; i += 1) {
      selectionFill.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    selectionFill.closePath();
    selectionFill.fill({ color: normalizedSelectedFillColor, alpha: 1 });

    hasSelection = true;
  };

  const finishDrawing = ({ preserveOutline = false } = {}) => {
    isDrawing = false;
    points = [];
    if (!preserveOutline) {
      previewOutline.clear();
    }
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

    isDrawing = true;
    const startPoint = mapPointerToWorld(app, event);
    points = [startPoint];
    drawOutline(points);
  };

  const handlePointerMove = (event) => {
    if (!isDrawing || points.length === 0) {
      return;
    }

    event.preventDefault();

    const currentPoint = mapPointerToWorld(app, event);
    const lastPoint = points[points.length - 1];
    const scale = app.stage.scale?.x || 1;
    const minDistance = MIN_POINT_DISTANCE / scale;
    const distance = Math.hypot(currentPoint.x - lastPoint.x, currentPoint.y - lastPoint.y);

    if (distance >= minDistance) {
      points = [...points, currentPoint];
      drawOutline(points, { closePath: points.length >= 3, dashed: true });
    }
  };

  const handlePointerUp = (event) => {
    if (!isDrawing || points.length === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }

    const endPoint = mapPointerToWorld(app, event);
    const lastPoint = points[points.length - 1];
    const scale = app.stage.scale?.x || 1;
    const minDistance = MIN_POINT_DISTANCE / scale;
    const distance = Math.hypot(endPoint.x - lastPoint.x, endPoint.y - lastPoint.y);

    if (distance >= minDistance) {
      points = [...points, endPoint];
    }

    if (points.length < 3) {
      finishDrawing();
      return;
    }

    const finalPolygon = points.map((point) => ({ x: point.x, y: point.y }));

    updateSelectionFill(finalPolygon);
    drawOutline(finalPolygon, { closePath: true, dashed: false });

    const selectedNodes = collectNodesWithinPolygon(nodeMap, finalPolygon);
    onSelect({
      polygon: finalPolygon,
      nodes: selectedNodes,
    });

    finishDrawing({ preserveOutline: true });
  };

  const handlePointerCancel = () => {
    if (!isDrawing) {
      return;
    }

    finishDrawing();
  };

  canvas.addEventListener("pointerdown", handlePointerDown, true);
  canvas.addEventListener("pointermove", handlePointerMove, true);
  window.addEventListener("pointerup", handlePointerUp, true);
  window.addEventListener("pointercancel", handlePointerCancel, true);
  window.addEventListener("pointerleave", handlePointerCancel, true);

  return () => {
    isDrawing = false;
    points = [];
    hasSelection = false;

    canvas.style.cursor = previousCursor;

    canvas.removeEventListener("pointerdown", handlePointerDown, true);
    canvas.removeEventListener("pointermove", handlePointerMove, true);
    window.removeEventListener("pointerup", handlePointerUp, true);
    window.removeEventListener("pointercancel", handlePointerCancel, true);
    window.removeEventListener("pointerleave", handlePointerCancel, true);

    selectionFill.visible = false;
    selectionFill.destroy({ children: true });
    previewOutline.destroy({ children: true });
  };
}
