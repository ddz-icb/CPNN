import log from "../../../adapters/logging/logger.js";
import * as PIXI from "pixi.js";
import { collectNodesWithinPolygon, drawDashedOutline, normalizeColor, pointerToWorld, tracePolygonPath } from "./interactiveCanvas.js";

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
