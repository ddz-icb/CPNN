import { toColorNumber } from "./draw.js";

export function drawGrid3D(gridGraphic, view, nodes, container, project) {
  if (!gridGraphic?.visible || typeof project !== "function") return;

  const cache = gridGraphic.__gridCache || (gridGraphic.__gridCache = {});
  const viewChanged =
    cache.viewRotX !== view.rotX ||
    cache.viewRotY !== view.rotY ||
    cache.viewCameraX !== view.cameraX ||
    cache.viewCameraY !== view.cameraY ||
    cache.viewCameraZ !== view.cameraZ ||
    cache.viewFov !== view.fov ||
    cache.viewCenterX !== view.centerX ||
    cache.viewCenterY !== view.centerY;

  if (viewChanged) {
    cache.viewRotX = view.rotX;
    cache.viewRotY = view.rotY;
    cache.viewCameraX = view.cameraX;
    cache.viewCameraY = view.cameraY;
    cache.viewCameraZ = view.cameraZ;
    cache.viewFov = view.fov;
    cache.viewCenterX = view.centerX;
    cache.viewCenterY = view.centerY;
  }

  const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  const layoutInterval = 30; // ms inbetween grid updates
  const sizeChanged = cache.containerWidth !== container.width || cache.containerHeight !== container.height;
  const shouldUpdateLayout = !cache.layout || sizeChanged || now - (cache.layoutAt || 0) > layoutInterval;

  let layout = cache.layout;
  let layoutChanged = false;

  if (shouldUpdateLayout) {
    const nextLayout = computeGridLayout(nodes, container);
    cache.layoutAt = now;
    cache.containerWidth = container.width;
    cache.containerHeight = container.height;

    if (!nextLayout) {
      cache.layout = null;
      cache.layoutKey = null;
      return;
    }

    const nextLayoutKey = `${nextLayout.centerX}|${nextLayout.centerY}|${nextLayout.extent}|${nextLayout.step}|${nextLayout.cells}`;
    layoutChanged = nextLayoutKey !== cache.layoutKey;
    if (layoutChanged) {
      cache.layoutKey = nextLayoutKey;
      cache.layout = nextLayout;
    }
    layout = cache.layout;
  }

  if (!layout) return;
  if (!viewChanged && !layoutChanged) return;

  const { centerX, centerY, extent, step, cells } = layout;

  gridGraphic.clear();
  const color = toColorNumber(gridGraphic.__gridColor ?? 0x6b7280);
  const axisWidth = 3;
  const gridWidth = 1.5;
  const startX = centerX - extent;
  const endX = centerX + extent;
  const startZ = -extent;
  const endZ = extent;
  const axisThreshold = Math.max(step * 0.25, 1);

  for (let i = 0; i <= cells; i++) {
    const x = startX + i * step;
    const isAxis = Math.abs(x - centerX) <= axisThreshold;
    const p1 = project({ x, y: centerY, z: startZ });
    const p2 = project({ x, y: centerY, z: endZ });
    if (!p1 || !p2) continue;
    gridGraphic
      .moveTo(p1.x, p1.y)
      .lineTo(p2.x, p2.y)
      .stroke({
        color,
        width: isAxis ? axisWidth : gridWidth,
        alpha: isAxis ? 0.45 : 0.25,
      });
  }

  for (let i = 0; i <= cells; i++) {
    const z = startZ + i * step;
    const isAxis = Math.abs(z) <= axisThreshold;
    const p1 = project({ x: startX, y: centerY, z });
    const p2 = project({ x: endX, y: centerY, z });
    if (!p1 || !p2) continue;
    gridGraphic
      .moveTo(p1.x, p1.y)
      .lineTo(p2.x, p2.y)
      .stroke({
        color,
        width: isAxis ? axisWidth : gridWidth,
        alpha: isAxis ? 0.45 : 0.25,
      });
  }

  const verticalHalf = extent * 0.4;
  const v1 = project({ x: centerX, y: centerY - verticalHalf, z: 0 });
  const v2 = project({ x: centerX, y: centerY + verticalHalf, z: 0 });
  if (v1 && v2) {
    gridGraphic.moveTo(v1.x, v1.y).lineTo(v2.x, v2.y).stroke({
      color,
      width: axisWidth,
      alpha: 0.45,
    });
  }
}

function computeGridLayout(nodes, container) {
  if (!nodes || !container?.width || !container?.height) return null;

  const centerX = container.width / 2;
  const centerY = container.height / 2;
  const centerZ = 0;

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const node of nodes) {
    const x = node?.x;
    const z = node?.z ?? 0;
    if (Number.isFinite(x)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    if (Number.isFinite(z)) {
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
  }

  if (!Number.isFinite(minX)) {
    minX = centerX - container.width / 2;
    maxX = centerX + container.width / 2;
  }
  if (!Number.isFinite(minZ)) {
    minZ = -container.width / 2;
    maxZ = container.width / 2;
  }

  const halfX = Math.max(Math.abs(maxX - centerX), Math.abs(minX - centerX));
  const halfZ = Math.max(Math.abs(maxZ - centerZ), Math.abs(minZ - centerZ));
  const largestHalf = Math.max(halfX, halfZ, container.width * 0.15);
  const pad = Math.max(largestHalf * 0.1, 10);

  const extent = largestHalf + pad;
  const size = extent * 2;
  const targetStep = clamp(size / 16, 12, 220);
  const cells = Math.max(6, Math.round(size / targetStep));
  const step = size / cells;

  return { centerX, centerY, extent, step, cells };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
