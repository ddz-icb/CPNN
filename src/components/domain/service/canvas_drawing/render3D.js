import { getColor, getNodeLabelOffsetY } from "./drawingUtils.js";
import { updateHighlights } from "./highlights.js";
import { computeLightingTint, updateSphereShading } from "./shading.js";
import { drawGrid3D } from "./grid3D.js";

export const defaultCamera = {
  x: null,
  y: null,
  z: -600,
  fov: 600,
  rotX: 0.5,
  rotY: -0.2,
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
  camera,
) {
  const view = getViewParams(camera, container.width, container.height);
  const projections = computeProjections(graphData.nodes, view, camera?.projections);

  if (camera) {
    camera.projections = projections;
  }

  drawGrid3D(grid3D, view, graphData.nodes, container, (point) => projectNode(point, view));
  updateNodes3D(graphData.nodes, nodeMap, showNodeLabels, projections);
  updateLines3D(graphData.links, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, projections);
  updateHighlights();

  app.renderer.render(app.stage);
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

function getViewParams(camera, width, height) {
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

function computeProjections(nodes, view, result = {}) {
  for (const node of nodes) {
    const existing = result[node.id];
    const proj = projectNode(node, view, existing && typeof existing === "object" ? existing : undefined);
    result[node.id] = proj;
  }

  return result;
}

function updateNodes3D(nodes, nodeMap, showNodeLabels, projections) {
  if (!nodes || !nodeMap) return;

  for (const node of nodes) {
    const proj = projections[node.id];
    const entry = nodeMap[node.id] || {};
    const { circle, nodeLabel } = entry;
    if (!circle || !nodeLabel) continue;

    if (!proj || proj.visible === false) {
      circle.visible = false;
      nodeLabel.visible = false;
      circle.__hiddenByProjection = true;
      nodeLabel.__hiddenByProjection = true;
      continue;
    }

    circle.visible = true;
    circle.__hiddenByProjection = false;
    circle.x = proj.x;
    circle.y = proj.y;
    circle.scale.set(proj.scale);
    circle.tint = computeLightingTint(proj.scale);
    updateSphereShading(circle, proj.scale);
    circle.zIndex = -(proj.depth ?? 0);

    if (showNodeLabels) {
      nodeLabel.visible = true;
      nodeLabel.__hiddenByProjection = false;
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
  if (!Array.isArray(lineGraphics)) return;

  const lineSprites = lineGraphics;
  const linkCount = Array.isArray(links) ? links.length : 0;

  for (let linkIdx = 0; linkIdx < lineSprites.length; linkIdx++) {
    const link = linkIdx < linkCount ? links[linkIdx] : null;
    const sprites = lineSprites[linkIdx];
    if (!Array.isArray(sprites)) continue;

    if (!link) {
      for (const sprite of sprites) {
        if (sprite) sprite.visible = false;
      }
      continue;
    }

    const srcId = typeof link.source === "object" ? link.source.id : link.source;
    const tgtId = typeof link.target === "object" ? link.target.id : link.target;

    const src = projections[srcId];
    const tgt = projections[tgtId];

    if (!src || !tgt || src.visible === false || tgt.visible === false) {
      for (const sprite of sprites) {
        if (sprite) sprite.visible = false;
      }
      continue;
    }

    const depth = Math.max(src.depth ?? 0, tgt.depth ?? 0);
    const widthScaled = linkWidth * ((src.scale + tgt.scale) / 2);

    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const length = Math.sqrt(dx * dx + dy * dy) || 1e-6;
    const angle = Math.atan2(dy, dx);
    const midX = (src.x + tgt.x) / 2;
    const midY = (src.y + tgt.y) / 2;
    const normedPerp = { x: -dy / length, y: dx / length };

    const attribs = Array.isArray(link.attribs) ? link.attribs : [];
    const attribCount = attribs.length;

    for (let i = 0; i < sprites.length; i++) {
      const sprite = sprites[i];
      if (!sprite) continue;
      if (i >= attribCount) {
        sprite.visible = false;
        continue;
      }

      const shift = (i - (attribCount - 1) / 2) * widthScaled;
      const offsetX = shift * normedPerp.x;
      const offsetY = shift * normedPerp.y;

      sprite.visible = true;
      sprite.position.set(midX + offsetX, midY + offsetY);
      sprite.rotation = angle;
      sprite.width = length;
      sprite.height = widthScaled;
      sprite.tint = getColor(linkAttribsToColorIndices[attribs[i]], linkColorscheme.data);
      sprite.zIndex = -(depth ?? 0);
    }
  }
}
