import * as d3 from "d3";
import { defaultCamera } from "../canvas_drawing/render3D.js";

const CENTER_EPSILON = 1e-6;
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

function getNodeVector(node, centerX, centerY) {
  if (!node || !Number.isFinite(node.x) || !Number.isFinite(node.y)) {
    return null;
  }

  const dz = Number.isFinite(node.z) ? node.z : 0;
  return {
    dx: node.x - centerX,
    dy: node.y - centerY,
    dz,
  };
}

function getRotationToCenter(dx, dy, dz, sideSign = 1) {
  const baseRotY = Math.atan2(dx, dz);
  const zDistance = Math.hypot(dx, dz);
  const baseRotX = Math.atan2(dy, zDistance);

  const rotY = sideSign < 0 ? baseRotY + Math.PI : baseRotY;
  const rotX = sideSign < 0 ? -baseRotX : baseRotX;

  return { rotX, rotY };
}

function getPreferredSideSign(cameraZ) {
  if (!Number.isFinite(cameraZ) || cameraZ === 0) {
    return -1;
  }
  return cameraZ > 0 ? 1 : -1;
}

function rotateCameraToNode(node, camera, container) {
  if (!camera || !container?.width || !container?.height) return false;

  const centerX = container.width / 2;
  const centerY = container.height / 2;
  const vector = getNodeVector(node, centerX, centerY);

  if (!vector) return false;

  const { dx, dy, dz } = vector;
  const distSquared = dx * dx + dy * dy + dz * dz;

  const cameraZ = Number.isFinite(camera?.z) ? camera.z : defaultCamera.z;
  const sideSign = getPreferredSideSign(cameraZ);
  const targetDepth = getTargetNodeDepth();

  camera.x = centerX;
  camera.y = centerY;

  if (distSquared <= CENTER_EPSILON) {
    camera.z = -targetDepth;
    return true;
  }

  const { rotX, rotY } = getRotationToCenter(dx, dy, dz, sideSign);
  camera.rotX = rotX;
  camera.rotY = rotY;
  camera.z = sideSign * Math.sqrt(distSquared) - targetDepth;

  return true;
}

export function centerOnNode(node, { appearance, renderState, container }) {
  if (!node || !container?.width || !container?.height) return;
  if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

  if (appearance?.threeD) {
    const camera = appearance?.cameraRef?.current;
    if (!camera) return;

    rotateCameraToNode(node, camera, container);
    camera.redraw?.();
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
