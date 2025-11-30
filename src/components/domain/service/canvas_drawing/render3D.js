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
  const projections = computeProjections(graphData.nodes, camera, container.width, container.height);

  if (camera) {
    camera.projections = projections;
  }

  updateNodes3D(graphData.nodes, nodeMap, showNodeLabels, projections);
  updateLines3D(graphData.links, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, projections);
  updateHighlights(nodeMap);

  app.renderer.render(app.stage);
}

function computeProjections(nodes, camera, width, height) {
  const result = {};
  const centerX = width / 2;
  const centerY = height / 2;

  const rotX = camera?.rotX ?? defaultCamera.rotX;
  const rotY = camera?.rotY ?? defaultCamera.rotY;
  const cameraX = camera?.x ?? centerX;
  const cameraY = camera?.y ?? centerY;
  const cameraZ = camera?.z ?? defaultCamera.z;
  const fov = camera?.fov ?? defaultCamera.fov;

  for (const node of nodes) {
    const proj = projectNode(node, {
      rotX,
      rotY,
      cameraX,
      cameraY,
      cameraZ,
      fov,
      centerX,
      centerY,
    });
    if (proj) {
      result[node.id] = proj;
    }
  }

  return result;
}

function projectNode(node, params) {
  const { rotX, rotY, cameraX, cameraY, cameraZ, fov, centerX, centerY } = params;

  const rotated = rotateNode(node, rotX, rotY, centerX, centerY);

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

function rotateNode(node, rotX, rotY, centerX, centerY) {
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);

  const shiftedX = node.x - centerX;
  const shiftedY = node.y - centerY;
  const zBase = node.z ?? 0;

  // Rotation um Y (horizontales Drehen)
  let x = shiftedX * cosY - zBase * sinY;
  let z = shiftedX * sinY + zBase * cosY;

  // Rotation um X (vertikales Drehen)
  let y = shiftedY * cosX - z * sinX;
  z = shiftedY * sinX + z * cosX;

  return { x: x + centerX, y: y + centerY, z };
}

function updateNodes3D(nodes, nodeMap, showNodeLabels, projections) {
  if (!nodes || !nodeMap) return;

  for (const node of nodes) {
    const proj = projections[node.id];
    if (!proj) continue;

    const { circle, nodeLabel } = nodeMap[node.id] || {};
    if (!circle || !nodeLabel) continue;

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

function updateLines3D(links, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, projections) {
  if (!links) return;

  lines.clear();

  const linksWithDepth = [];
  for (const link of links) {
    const srcId = typeof link.source === "object" ? link.source.id : link.source;
    const tgtId = typeof link.target === "object" ? link.target.id : link.target;

    const src = projections[srcId];
    const tgt = projections[tgtId];

    if (!src || !tgt) continue;

    const depth = Math.max(src.depth ?? 0, tgt.depth ?? 0);
    linksWithDepth.push({ link, src, tgt, depth });
  }

  // draw farthest first so nearer links overlay them
  linksWithDepth.sort((a, b) => b.depth - a.depth);

  for (const { link, src, tgt } of linksWithDepth) {
    const widthScaled = linkWidth * ((src.scale + tgt.scale) / 2);

    if (link.attribs.length === 1) {
      lines
        .moveTo(src.x, src.y)
        .lineTo(tgt.x, tgt.y)
        .stroke({
          color: getColor(linkAttribsToColorIndices[link.attribs[0]], linkColorscheme.data),
          width: widthScaled,
        });
      continue;
    }

    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const length = Math.sqrt(dx * dx + dy * dy) || 1e-6;
    const normedPerp = { x: -dy / length, y: dx / length };

    for (let i = 0; i < link.attribs.length; i++) {
      const shift = (i - (link.attribs.length - 1) / 2) * widthScaled;
      const offsetX = shift * normedPerp.x;
      const offsetY = shift * normedPerp.y;

      lines
        .moveTo(src.x + offsetX, src.y + offsetY)
        .lineTo(tgt.x + offsetX, tgt.y + offsetY)
        .stroke({
          color: getColor(linkAttribsToColorIndices[link.attribs[i]], linkColorscheme.data),
          width: widthScaled,
        });
    }
  }
}
