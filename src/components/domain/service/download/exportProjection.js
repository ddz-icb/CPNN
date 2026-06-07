import { getCameraViewParams, projectPoint3D } from "../canvas_drawing/camera3D.js";

export function projectGridLines(gridLines, camera, container) {
  if (!Array.isArray(gridLines) || !container) return [];
  const view = getCameraViewParams(camera, container.width, container.height);
  const segments = [];

  for (const line of gridLines) {
    const p1 = projectPoint3D(line.start, view);
    const p2 = projectPoint3D(line.end, view);
    if (p1 && p2) {
      segments.push({ p1, p2, axis: line.axis });
    }
  }
  return segments;
}

export function computeProjections(nodes, view, result = {}) {
  for (const node of nodes) {
    const existing = result[node.id];
    const projection = projectPoint3D(node, view, existing && typeof existing === "object" ? existing : undefined);
    result[node.id] = projection;
  }

  return result;
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
    orientation: camera?.orientation ? { ...camera.orientation } : camera?.orientation,
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
