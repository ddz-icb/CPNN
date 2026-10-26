import * as d3 from "d3";
import { defaultCamera } from "../canvas_drawing/render3D.js";
import { clearCameraOrbitCenter, focusCameraOnPoint, setCameraOrbitCenter } from "../canvas_drawing/camera3D.js";
import { getCentroid, getEndpointId } from "../graph_calculations/graphUtils.js";

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

export function clearViewOrbitCenter({ appearance, owner } = {}) {
  clearCameraOrbitCenter(appearance?.cameraRef?.current, owner);
}

export function captureViewState({ appearance, renderState }) {
  if (appearance?.threeD) {
    const camera = appearance.cameraRef?.current;
    if (!camera) return null;
    const { x, y, z, rotX, rotY, rotZ, orientation } = camera;
    return { camera, x, y, z, rotX, rotY, rotZ, orientation: orientation && { ...orientation } };
  }

  const app = renderState?.app;
  if (!app?.stage) return null;
  return { app, x: app.stage.x, y: app.stage.y, k: app.stage.scale?.x ?? 1 };
}

export function restoreViewState(view) {
  if (!view) return;
  if (view.camera) {
    const { camera, x, y, z, rotX, rotY, rotZ, orientation } = view;
    Object.assign(camera, { x, y, z, rotX, rotY, rotZ });
    if (orientation) camera.orientation = { ...orientation };
    else delete camera.orientation;
    camera.redraw?.();
    return;
  }

  if (view.app?.stage && view.app?.renderer) {
    apply2DTransform(view.app, d3.zoomIdentity.translate(view.x, view.y).scale(view.k));
  }
}

function apply2DTransform(app, transform) {
  const zoom = app.__zoomBehavior;
  const selection = app.__zoomSelection;
  if (zoom && selection) {
    selection.call(zoom.transform, transform);
    return;
  }

  app.stage.x = transform.x;
  app.stage.y = transform.y;
  app.stage.scale?.set?.(transform.k, transform.k);
  app.renderer.render(app.stage);
}

export function centerOnNode(node, { appearance, renderState, container, setOrbitCenter = true, orbitOwner }) {
  if (!node || !container?.width || !container?.height) return;
  if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

  if (appearance?.threeD) {
    const camera = appearance?.cameraRef?.current;
    if (!camera) return;

    focusCameraOnPoint(camera, node, container, getTargetNodeDepth());
    if (setOrbitCenter) {
      setCameraOrbitCenter(camera, node, orbitOwner);
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

  apply2DTransform(app, d3.zoomIdentity.translate(tx, ty).scale(safeScale));
}

export function centerOnNodes(nodes, viewState) {
  const positionedNodes = (nodes ?? []).filter((node) => Number.isFinite(node?.x) && Number.isFinite(node?.y));
  if (positionedNodes.length === 0) return;

  centerOnNode(positionedNodes.length === 1 ? positionedNodes[0] : getCentroid(positionedNodes), viewState);
}

export function centerOnLink(link, viewState = {}) {
  const source = getLinkEndpointPosition(link?.source, viewState.nodeById);
  const target = getLinkEndpointPosition(link?.target, viewState.nodeById);
  centerOnNodes([source, target], viewState);
}

function getLinkEndpointPosition(endpoint, nodeById) {
  if (Number.isFinite(endpoint?.x) && Number.isFinite(endpoint?.y)) return endpoint;

  const endpointId = getEndpointId(endpoint);
  if (endpointId == null || !nodeById?.get) return null;
  return nodeById.get(endpointId) ?? nodeById.get(String(endpointId)) ?? null;
}
