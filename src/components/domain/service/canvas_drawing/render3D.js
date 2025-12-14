import * as PIXI from "pixi.js";
import { computeLightingTint, getColor, getNodeLabelOffsetY, updateHighlights, updateSphereShading } from "./draw.js";

export const defaultCamera = {
  x: null,
  y: null,
  z: -600,
  fov: 600,
  rotX: 0,
  rotY: 0,
};

export function redraw3D(graphData, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, showNodeLabels, nodeMap, app, container, camera) {
  const projectionParams = buildProjectionParams(camera, container.width, container.height);
  const projections = computeProjections(graphData.nodes, projectionParams);
  const gridGraphic = ensureGridGraphic(app);
  const projectedGrid = gridGraphic ? buildGridProjection(graphData.nodes, projectionParams) : [];

  if (camera) {
    camera.projections = projections;
    camera.gridLines2D = projectedGrid.map(({ start, end, depth, edge, width }) => ({
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      depth,
      edge,
      width,
    }));
  }

  if (gridGraphic) {
    drawGrid(graphData.nodes, gridGraphic, projectedGrid);
  }

  updateNodes3D(graphData.nodes, nodeMap, showNodeLabels, projections);
  updateLines3D(graphData.links, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, projections);
  updateHighlights(nodeMap);

  app.renderer.render(app.stage);
}

function buildProjectionParams(camera, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;

  return {
    rotX: camera?.rotX ?? defaultCamera.rotX,
    rotY: camera?.rotY ?? defaultCamera.rotY,
    cameraX: camera?.x ?? centerX,
    cameraY: camera?.y ?? centerY,
    cameraZ: camera?.z ?? defaultCamera.z,
    fov: camera?.fov ?? defaultCamera.fov,
    centerX,
    centerY,
  };
}

function computeProjections(nodes, params) {
  const result = {};

  for (const node of nodes) {
    const proj = projectNode(node, params);
    if (proj) {
      result[node.id] = proj;
    }
  }

  return result;
}

function projectNode(node, params) {
  return projectPoint(node, params);
}

function projectPoint(point, params) {
  const { rotX, rotY, cameraX, cameraY, cameraZ, fov, centerX, centerY } = params;

  const rotated = rotatePoint(point, rotX, rotY, centerX, centerY);

  const dx = rotated.x - cameraX;
  const dy = rotated.y - cameraY;
  let dz = rotated.z - cameraZ;

  if (dz <= 0.0001) {
    return null;
  }

  const depth = Math.abs(dz);
  const scale = fov / depth;

  return {
    x: centerX + dx * scale,
    y: centerY + dy * scale,
    scale,
    depth,
  };
}

function rotatePoint(point, rotX, rotY, centerX, centerY) {
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);

  const shiftedX = (point?.x ?? 0) - centerX;
  const shiftedY = (point?.y ?? 0) - centerY;
  const zBase = point?.z ?? 0;

  let x = shiftedX * cosY - zBase * sinY;
  let z = shiftedX * sinY + zBase * cosY;

  let y = shiftedY * cosX - z * sinX;
  z = shiftedY * sinX + z * cosX;

  return { x: x + centerX, y: y + centerY, z };
}

function updateNodes3D(nodes, nodeMap, showNodeLabels, projections) {
  if (!nodes || !nodeMap) return;

  for (const node of nodes) {
    const proj = projections[node.id];
    const entry = nodeMap[node.id] || {};
    const { circle, nodeLabel } = entry;
    if (!circle || !nodeLabel) continue;

    if (!proj) {
      circle.visible = false;
      nodeLabel.visible = false;
      continue;
    }

    circle.visible = true;
    circle.x = proj.x;
    circle.y = proj.y;
    circle.scale.set(proj.scale);
    circle.tint = computeLightingTint(proj.scale);
    updateSphereShading(circle, proj.scale);
    circle.zIndex = -(proj.depth ?? 0);

    if (showNodeLabels) {
      nodeLabel.visible = true;
      nodeLabel.x = proj.x;
      nodeLabel.y = proj.y + getNodeLabelOffsetY(node.id) * proj.scale;
      nodeLabel.scale.set(proj.scale);
      nodeLabel.zIndex = -(proj.depth ?? 0);
    } else {
      nodeLabel.visible = false;
    }
  }
}

function updateLines3D(links, lineGraphics, linkWidth, linkColorscheme, linkAttribsToColorIndices, projections) {
  if (!links || !lineGraphics || !Array.isArray(lineGraphics)) return;

  for (const graphic of lineGraphics) {
    graphic?.clear();
    if (graphic) graphic.visible = false;
  }

  const linksWithDepth = [];
  for (const link of links) {
    const srcId = typeof link.source === "object" ? link.source.id : link.source;
    const tgtId = typeof link.target === "object" ? link.target.id : link.target;

    const src = projections[srcId];
    const tgt = projections[tgtId];

    if (!src || !tgt) continue;

    const depth = Math.max(src.depth ?? 0, tgt.depth ?? 0);
    const lineIdx = link.__lineIdx ?? linksWithDepth.length;
    linksWithDepth.push({ link, src, tgt, depth, lineIdx });
  }

  // draw farthest first so nearer links overlay them
  linksWithDepth.sort((a, b) => b.depth - a.depth);

  for (const { link, src, tgt, depth, lineIdx } of linksWithDepth) {
    const graphic = lineGraphics[lineIdx];
    if (!graphic) continue;

    graphic.visible = true;
    const widthScaled = linkWidth * ((src.scale + tgt.scale) / 2);

    if (link.attribs.length === 1) {
      graphic
        .moveTo(src.x, src.y)
        .lineTo(tgt.x, tgt.y)
        .stroke({
          color: getColor(linkAttribsToColorIndices[link.attribs[0]], linkColorscheme.data),
          width: widthScaled,
        });
    } else {
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const length = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      const normedPerp = { x: -dy / length, y: dx / length };

      for (let i = 0; i < link.attribs.length; i++) {
        const shift = (i - (link.attribs.length - 1) / 2) * widthScaled;
        const offsetX = shift * normedPerp.x;
        const offsetY = shift * normedPerp.y;

        graphic
          .moveTo(src.x + offsetX, src.y + offsetY)
          .lineTo(tgt.x + offsetX, tgt.y + offsetY)
          .stroke({
            color: getColor(linkAttribsToColorIndices[link.attribs[i]], linkColorscheme.data),
            width: widthScaled,
          });
      }
    }

    graphic.zIndex = -(depth ?? 0);
  }
}

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

function buildGridProjection(nodes, params) {
  const bounds = computeGridBounds(nodes, params.centerX, params.centerY);
  const segments = buildGridSegments(bounds);

  const projected = [];
  for (const seg of segments) {
    const start = projectPoint(seg.start, params);
    const end = projectPoint(seg.end, params);
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

function ensureGridGraphic(app) {
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

function drawGrid(nodes, graphic, projectedSegments) {
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
