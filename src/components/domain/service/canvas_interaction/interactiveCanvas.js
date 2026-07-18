import lodash from "lodash";
import * as PIXI from "pixi.js";
import { initDragAndZoom2D } from "./interactiveCanvas2D.js";
import { initDragAndZoom3D } from "./interactiveCanvas3D.js";
export { collectNodesWithinPolygon, isPointInPolygon } from "./lassoSelection.js";

const { throttle } = lodash;

export function initDragAndZoom(app, simulation, radius, setTooltipSettings, width, height, threeD, cameraRef, controlsRef) {
  app.__interactionCleanup?.();
  if (threeD) {
    app.__interactionCleanup = initDragAndZoom3D(app, simulation, setTooltipSettings, cameraRef, controlsRef);
  } else {
    app.__interactionCleanup = initDragAndZoom2D(app, simulation, radius, setTooltipSettings, width, height);
  }
}

export function initTooltips(circle, node, setTooltipSettings) {
  circle.on("mouseover", (mouseData) => {
    const tooltipNode = circle.__tooltipNode ?? node;
    setTooltipSettings("hoverTooltipData", {
      node: tooltipNode.id,
      nodeAttribs: tooltipNode.attribs,
      x: mouseData.originalEvent.pageX,
      y: mouseData.originalEvent.pageY,
    });
    setTooltipSettings("isHoverTooltipActive", true);
  });
  circle.on("mouseout", () => {
    setTooltipSettings("isHoverTooltipActive", false);
  });
  circle.on("click", (mouseData) => {
    const tooltipNode = circle.__tooltipNode ?? node;
    setTooltipSettings("clickTooltipData", {
      node: tooltipNode.id,
      nodeAttribs: tooltipNode.attribs ?? [],
      x: mouseData.originalEvent.clientX,
      y: mouseData.originalEvent.clientY,
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

export const handleResize = throttle((containerRef, app) => {
  if (app?.renderer && containerRef && containerRef.current) {
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    app.renderer.resize(width, height);
  }
}, 250);
