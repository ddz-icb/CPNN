import { getColor, getNodeLabelOffsetY, updateHighlights } from "./draw.js";

export const defaultCamera = {
  x: 0,
  y: 0,
  z: -600,
  fov: 600,
  rotX: 0,
  rotY: 0,
};

function rotateNode(node, camera) {
  const { rotX, rotY } = camera;
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);

  let x = node.x * cosY - node.z * sinY;
  let z = node.x * sinY + node.z * cosY;

  let y = node.y * cosX - z * sinX;
  z = node.y * sinX + z * cosX;

  return { x, y, z };
}

function project3D(node, camera, width, height) {
  const r = rotateNode(node, camera);
  let dx = r.x - camera.x;
  let dy = r.y - camera.y;
  let dz = r.z - camera.z;

  const scale = camera.fov / dz;

  return {
    x: width / 2 + dx * scale,
    y: height / 2 + dy * scale,
    scale,
  };
}

export function redraw3D(graphData, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, showNodeLabels, nodeMap, app, container, camera) {
  const { nodes, links } = graphData;
  const { width, height } = container;

  const projectedById = {};
  for (const node of nodes) {
    projectedById[node.id] = project3D(node, camera, width, height);
  }

  // Lines im Screen-Space zeichnen
  lines.clear();
  for (const link of links) {
    const srcId = typeof link.source === "object" ? link.source.id : link.source;
    const tgtId = typeof link.target === "object" ? link.target.id : link.target;
    const src = projectedById[srcId];
    const tgt = projectedById[tgtId];
    if (!src || !tgt) continue;

    if (link.attribs.length === 1) {
      lines
        .moveTo(src.x, src.y)
        .lineTo(tgt.x, tgt.y)
        .stroke({
          color: getColor(linkAttribsToColorIndices[link.attribs[0]], linkColorscheme.data),
          width: linkWidth,
        });
    } else {
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const length = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      const normedPerp = { x: -dy / length, y: dx / length };

      for (let i = 0; i < link.attribs.length; i++) {
        const shift = (i - (link.attribs.length - 1) / 2) * linkWidth;
        const offsetX = shift * normedPerp.x;
        const offsetY = shift * normedPerp.y;

        lines
          .moveTo(src.x + offsetX, src.y + offsetY)
          .lineTo(tgt.x + offsetX, tgt.y + offsetY)
          .stroke({
            color: getColor(linkAttribsToColorIndices[link.attribs[i]], linkColorscheme.data),
            width: linkWidth,
          });
      }
    }
  }

  // Circles + Labels nachziehen
  for (const node of nodes) {
    const proj = projectedById[node.id];
    if (!proj) continue;

    const { circle, nodeLabel } = nodeMap[node.id];

    circle.x = proj.x;
    circle.y = proj.y;
    circle.scale.set(proj.scale);

    if (showNodeLabels) {
      nodeLabel.visible = true;
      nodeLabel.x = proj.x;
      nodeLabel.y = proj.y + getNodeLabelOffsetY(node.id) * proj.scale;
      nodeLabel.scale.set(proj.scale);
    } else {
      nodeLabel.visible = false;
    }
  }

  updateHighlights(nodeMap);
  app.renderer.render(app.stage);
}
