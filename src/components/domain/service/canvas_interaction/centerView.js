import * as d3 from "d3";
import { defaultCamera } from "../canvas_drawing/render3D.js";
import { clearCameraOrbitCenter, focusCameraOnPoint, setCameraOrbitCenter } from "../canvas_drawing/camera3D.js";
import { getCentroid } from "../graph_calculations/graphUtils.js";

const MIN_TARGET_DEPTH = 1e-3;
export const TARGET_NODE_DEPTH = 300;

function getTargetNodeDepth() {
  return Math.max(TARGET_NODE_DEPTH, MIN_TARGET_DEPTH);
}

function getTargetNodeScale() {
  const safeFov = Number.isFinite(defaultCamera?.fov) ? Math.abs(defaultCamera.fov) : 0;
  if (!safeFov) return 1;
  return safeFov / getTargetNodeDepth();
}

export function clearViewOrbitCenter({ appearance } = {}) {
  if (!appearance?.threeD) return;
  clearCameraOrbitCenter(appearance?.cameraRef?.current);
}

export function centerOnNode(node, { appearance, renderState, container, setOrbitCenter = true }) {
  if (!node || !container?.width || !container?.height) return;
  if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

  if (appearance?.threeD) {
    const camera = appearance?.cameraRef?.current;
    if (!camera) return;

    focusCameraOnPoint(camera, node, container, getTargetNodeDepth());
    if (setOrbitCenter) {
      setCameraOrbitCenter(camera, node);
    }
    return;
  }

  const app = renderState?.app;
  if (!app?.stage || !app?.renderer) return;

  const targetScale = getTargetNodeScale();
  const currentScale = app.stage.scale?.x ?? 1;
  const safeScale = Number.isFinite(targetScale) && targetScale > 0 ? targetScale : currentScale || 1;
  const centerX = container.width / 2;
  const centerY = container.height / 2;
  const tx = centerX - node.x * safeScale;
  const ty = centerY - node.y * safeScale;

  const zoom = app.__zoomBehavior;
  const selection = app.__zoomSelection;
  if (zoom && selection) {
    const transform = d3.zoomIdentity.translate(tx, ty).scale(safeScale);
    selection.call(zoom.transform, transform);
    return;
  }

  app.stage.x = tx;
  app.stage.y = ty;
  app.stage.scale?.set?.(safeScale, safeScale);
  app.renderer.render(app.stage);
}

export function centerOnNodes(nodes, viewState) {
  const positionedNodes = (nodes ?? []).filter((node) => Number.isFinite(node?.x) && Number.isFinite(node?.y));
  if (positionedNodes.length === 0) return;

  centerOnNode(positionedNodes.length === 1 ? positionedNodes[0] : getCentroid(positionedNodes), viewState);
}
