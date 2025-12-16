import { computeLightingTint, getColor, getNodeLabelOffsetY, toColorNumber, updateHighlights, updateSphereShading } from "./draw.js";

export const defaultCamera = {
  x: null,
  y: null,
  z: -600,
  fov: 600,
  rotX: 0,
  rotY: 0,
};

export function redraw3D(
  graphData,
  lines,
  linkWidth,
  linkColorscheme,
  linkAttribsToColorIndices,
  showNodeLabels,
  nodeMap,
  grid3D,
  app,
  container,
  camera
) {
  const view = getViewParams(camera, container.width, container.height);
  const projections = computeProjections(graphData.nodes, view);

  if (camera) {
    camera.projections = projections;
  }

  updateGrid3D(grid3D, view, graphData.nodes, container);
  updateNodes3D(graphData.nodes, nodeMap, showNodeLabels, projections);
  updateLines3D(graphData.links, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, projections);
  updateHighlights(nodeMap);

  app.renderer.render(app.stage);
}

function projectNode(node, params) {
  const { rotX, rotY, cameraX, cameraY, cameraZ, fov, centerX, centerY } = params;

  const rotated = rotateNode(node, rotX, rotY, centerX, centerY);

  const dx = rotated.x - cameraX;
  const dy = rotated.y - cameraY;
  let dz = rotated.z - cameraZ;

  if (dz <= 0.000001) {
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

function rotateNode(node, rotX, rotY, centerX, centerY) {
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);

  const shiftedX = node.x - centerX;
  const shiftedY = node.y - centerY;
  const zBase = node.z ?? 0;

  let x = shiftedX * cosY - zBase * sinY;
  let z = shiftedX * sinY + zBase * cosY;

  let y = shiftedY * cosX - z * sinX;
  z = shiftedY * sinX + z * cosX;

  return { x: x + centerX, y: y + centerY, z };
}

function getViewParams(camera, width, height) {
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

function computeProjections(nodes, view) {
  const result = {};

  for (const node of nodes) {
    const proj = projectNode(node, view);
    if (proj) {
      result[node.id] = proj;
    }
  }

  return result;
}

function updateGrid3D(gridGraphic, view, nodes, container) {
  if (!gridGraphic?.visible) return;

  const layout = computeGridLayout(nodes, container);
  if (!layout) return;

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
    const p1 = projectNode({ x, y: centerY, z: startZ }, view);
    const p2 = projectNode({ x, y: centerY, z: endZ }, view);
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
    const p1 = projectNode({ x: startX, y: centerY, z }, view);
    const p2 = projectNode({ x: endX, y: centerY, z }, view);
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
  const v1 = projectNode({ x: centerX, y: centerY - verticalHalf, z: 0 }, view);
  const v2 = projectNode({ x: centerX, y: centerY + verticalHalf, z: 0 }, view);
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
