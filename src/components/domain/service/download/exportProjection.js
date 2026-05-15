import { defaultCamera } from "../canvas_drawing/render3D.js";

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

export function computeProjections(nodes, view, result = {}) {
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

export function getViewParams(camera, width, height) {
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

export function translateNodeForContainer(node, sourceContainer, targetContainer) {
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

export function translateCameraForContainer(camera, sourceContainer, targetContainer) {
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

export function translateGridLinesForContainer(gridLines, sourceContainer, targetContainer) {
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
