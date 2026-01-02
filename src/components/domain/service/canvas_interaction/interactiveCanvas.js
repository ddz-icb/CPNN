import { throttle } from "lodash";
import * as PIXI from "pixi.js";
import { initDragAndZoom2D } from "./interactiveCanvas2D";
import { initDragAndZoom3D } from "./interactiveCanvas3D";

export function initDragAndZoom(app, simulation, radius, setTooltipSettings, width, height, threeD, cameraRef) {
  if (threeD) {
    initDragAndZoom3D(app, simulation, setTooltipSettings, width, height, cameraRef);
  } else {
    initDragAndZoom2D(app, simulation, radius, setTooltipSettings, width, height);
  }
}

export function initTooltips(circle, node, setTooltipSettings) {
  circle.on("mouseover", (mouseData) => {
    setTooltipSettings("hoverTooltipData", {
      node: node.id,
      nodeGroups: node.groups,
      x: mouseData.originalEvent.pageX,
      y: mouseData.originalEvent.pageY,
    });
    setTooltipSettings("isHoverTooltipActive", true);
  });
  circle.on("mouseout", () => {
    setTooltipSettings("isHoverTooltipActive", false);
  });
  circle.on("click", (mouseData) => {
    setTooltipSettings("clickTooltipData", {
      node: node.id,
      nodeGroups: node.groups,
      x: mouseData.originalEvent.pageX,
      y: mouseData.originalEvent.pageY,
    });
    setTooltipSettings("isClickTooltipActive", true);
  });
}

export function normalizeColor(color, fallback) {
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

export function toWorldPoint(app, clientX, clientY) {
  const globalPoint = new PIXI.Point();
  app.renderer.events.mapPositionToPoint(globalPoint, clientX, clientY);

  const worldPoint = new PIXI.Point();
  app.stage.toLocal(globalPoint, undefined, worldPoint);

  return worldPoint;
}

export function pointerToWorld(app, pointerEvent) {
  return toWorldPoint(app, pointerEvent.clientX, pointerEvent.clientY);
}

export function tracePolygonPath(graphics, polygonPoints, closePath = true) {
  graphics.moveTo(polygonPoints[0].x, polygonPoints[0].y);
  for (let i = 1; i < polygonPoints.length; i += 1) {
    graphics.lineTo(polygonPoints[i].x, polygonPoints[i].y);
  }
  if (closePath) {
    graphics.closePath();
  }
}

export function drawDashedOutline(graphics, points, dashLength, gapLength, closePath = false) {
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

export function isPointInPolygon(point, polygon) {
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

export function collectNodesWithinPolygon(nodeMap, polygon) {
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

export const handleResize = throttle((containerRef, app) => {
  if (app?.renderer && containerRef && containerRef.current) {
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    app.renderer.resize(width, height);
  }
}, 250);
