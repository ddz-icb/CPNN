import * as PIXI from "pixi.js";

function computeGridBounds(nodes, centerX, centerY) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const node of nodes) {
    const x = node?.x ?? centerX;
    const y = node?.y ?? centerY;
    const z = node?.z ?? 0;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(minZ)) {
    minX = centerX - 100;
    maxX = centerX + 100;
    minY = centerY - 100;
    maxY = centerY + 100;
    minZ = -100;
    maxZ = 100;
  }

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const spanZ = maxZ - minZ;
  const largestSpan = Math.max(spanX, spanY, spanZ, 1);
  const padding = Math.max(largestSpan * 0.15, 40);

  const center = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: (minZ + maxZ) / 2,
  };

  const half = largestSpan / 2 + padding;

  return {
    minX: center.x - half,
    maxX: center.x + half,
    minY: center.y - half,
    maxY: center.y + half,
    minZ: center.z - half,
    maxZ: center.z + half,
  };
}

function linspace(min, max, steps) {
  if (steps <= 0) return [min, max];
  const step = (max - min) / steps;
  const arr = [];
  for (let i = 0; i <= steps; i++) {
    arr.push(min + i * step);
  }
  return arr;
}

function buildGridSegments(bounds, divisions = 5) {
  const xs = linspace(bounds.minX, bounds.maxX, divisions);
  const ys = linspace(bounds.minY, bounds.maxY, divisions);
  const zs = linspace(bounds.minZ, bounds.maxZ, divisions);

  const planes = {
    minZ: () => [
      ...ys.map((y) => ({
        start: { x: bounds.minX, y, z: bounds.minZ },
        end: { x: bounds.maxX, y, z: bounds.minZ },
        edge: y === bounds.minY || y === bounds.maxY,
      })),
      ...xs.map((x) => ({
        start: { x, y: bounds.minY, z: bounds.minZ },
        end: { x, y: bounds.maxY, z: bounds.minZ },
        edge: x === bounds.minX || x === bounds.maxX,
      })),
    ],
    maxZ: () => [
      ...ys.map((y) => ({
        start: { x: bounds.minX, y, z: bounds.maxZ },
        end: { x: bounds.maxX, y, z: bounds.maxZ },
        edge: y === bounds.minY || y === bounds.maxY,
      })),
      ...xs.map((x) => ({
        start: { x, y: bounds.minY, z: bounds.maxZ },
        end: { x, y: bounds.maxY, z: bounds.maxZ },
        edge: x === bounds.minX || x === bounds.maxX,
      })),
    ],
    minY: () => [
      ...zs.map((z) => ({
        start: { x: bounds.minX, y: bounds.minY, z },
        end: { x: bounds.maxX, y: bounds.minY, z },
        edge: z === bounds.minZ || z === bounds.maxZ,
      })),
      ...xs.map((x) => ({
        start: { x, y: bounds.minY, z: bounds.minZ },
        end: { x, y: bounds.minY, z: bounds.maxZ },
        edge: x === bounds.minX || x === bounds.maxX,
      })),
    ],
    maxY: () => [
      ...zs.map((z) => ({
        start: { x: bounds.minX, y: bounds.maxY, z },
        end: { x: bounds.maxX, y: bounds.maxY, z },
        edge: z === bounds.minZ || z === bounds.maxZ,
      })),
      ...xs.map((x) => ({
        start: { x, y: bounds.maxY, z: bounds.minZ },
        end: { x, y: bounds.maxY, z: bounds.maxZ },
        edge: x === bounds.minX || x === bounds.maxX,
      })),
    ],
    minX: () => [
      ...zs.map((z) => ({
        start: { x: bounds.minX, y: bounds.minY, z },
        end: { x: bounds.minX, y: bounds.maxY, z },
        edge: z === bounds.minZ || z === bounds.maxZ,
      })),
      ...ys.map((y) => ({
        start: { x: bounds.minX, y, z: bounds.minZ },
        end: { x: bounds.minX, y, z: bounds.maxZ },
        edge: y === bounds.minY || y === bounds.maxY,
      })),
    ],
    maxX: () => [
      ...zs.map((z) => ({
        start: { x: bounds.maxX, y: bounds.minY, z },
        end: { x: bounds.maxX, y: bounds.maxY, z },
        edge: z === bounds.minZ || z === bounds.maxZ,
      })),
      ...ys.map((y) => ({
        start: { x: bounds.maxX, y, z: bounds.minZ },
        end: { x: bounds.maxX, y, z: bounds.maxZ },
        edge: y === bounds.minY || y === bounds.maxY,
      })),
    ],
  };

  const segments = Object.values(planes).flatMap((fn) => fn());
  const seen = new Set();
  const deduped = [];
  const keyFor = (start, end) => {
    const a = `${start.x},${start.y},${start.z}`;
    const b = `${end.x},${end.y},${end.z}`;
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  };

  for (const seg of segments) {
    const key = keyFor(seg.start, seg.end);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(seg);
  }

  return deduped;
}

export function buildGridProjection(nodes, params, projectPointFn) {
  const bounds = computeGridBounds(nodes, params.centerX, params.centerY);
  const segments = buildGridSegments(bounds);

  const projected = [];
  for (const seg of segments) {
    const start = projectPointFn(seg.start, params);
    const end = projectPointFn(seg.end, params);
    if (!start || !end) continue;
    const avgScale = (start.scale + end.scale) / 2;
    projected.push({
      start,
      end,
      depth: Math.max(start.depth ?? 0, end.depth ?? 0) + 1000,
      edge: seg.edge,
      width: Math.min(Math.max(avgScale * 0.9, 0.6), 3),
    });
  }

  projected.sort((a, b) => b.depth - a.depth);

  return projected;
}

export function ensureGridGraphic(app) {
  if (!app?.stage) return null;
  if (app.stage.gridGraphics) return app.stage.gridGraphics;

  const graphic = new PIXI.Graphics();
  graphic.eventMode = "none";
  graphic.zIndex = -1000;
  graphic.visible = false;
  app.stage.addChildAt(graphic, 0);
  app.stage.gridGraphics = graphic;
  return graphic;
}

export function drawGrid(nodes, graphic, projectedSegments) {
  if (!graphic) return;
  graphic.clear();
  if (!nodes?.length || !projectedSegments.length) {
    graphic.visible = false;
    return;
  }

  projectedSegments.forEach(({ start, end, edge, width }) => {
    graphic
      .moveTo(start.x, start.y)
      .lineTo(end.x, end.y)
      .stroke({
        color: edge ? 0xa7b4c9 : 0xd7dde8,
        width,
        alpha: edge ? 0.65 : 0.35,
      });
  });

  graphic.visible = true;
}
