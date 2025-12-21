import { computeLightingTint, getColor, getNodeLabelOffsetY, updateHighlights, updateSphereShading } from "./draw.js";
import { drawGrid3D } from "./grid3D.js";

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

  drawGrid3D(grid3D, view, graphData.nodes, container, (point) => projectNode(point, view));
  updateNodes3D(graphData.nodes, nodeMap, showNodeLabels, projections);
  updateLines3D(graphData.links, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, projections);
  updateHighlights();

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
  if (!links || !lineGraphics || !Array.isArray(lineGraphics)) return;

  for (const graphic of lineGraphics) {
    graphic?.clear();
    if (graphic) graphic.visible = false;
  }

  let fallbackLineIdx = 0;
  for (const link of links) {
    const srcId = typeof link.source === "object" ? link.source.id : link.source;
    const tgtId = typeof link.target === "object" ? link.target.id : link.target;

    const src = projections[srcId];
    const tgt = projections[tgtId];

    if (!src || !tgt) continue;

    const depth = Math.max(src.depth ?? 0, tgt.depth ?? 0);
    const lineIdx = link.__lineIdx ?? fallbackLineIdx++;
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
