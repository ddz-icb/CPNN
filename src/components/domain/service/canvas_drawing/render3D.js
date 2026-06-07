import { getNodeLabelOffsetY } from "./drawingUtils.js";
import { updateHighlights } from "./highlights.js";
import { computeLightingTint, updateSphereShading } from "./shading.js";
import { drawGrid3D } from "./grid3D.js";
import { updateLines3D } from "./lineGraphics.js";
import { defaultCamera, getCameraViewParams, projectPoint3D } from "./camera3D.js";

export { defaultCamera } from "./camera3D.js";

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
  const view = getCameraViewParams(camera, container.width, container.height);
  const projections = computeProjections(graphData.nodes, view, camera?.projections);

  if (camera) {
    camera.projections = projections;
  }

  drawGrid3D(grid3D, view, graphData.nodes, container, (point) => projectPoint3D(point, view));
  updateNodes3D(graphData.nodes, nodeMap, showNodeLabels, projections);
  updateLines3D(graphData.links, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, projections);
  updateHighlights({ links: graphData.links, lineGraphics: lines, linkWidth });

  app.renderer.render(app.stage);
}

function computeProjections(nodes, view, result = {}) {
  for (const node of nodes) {
    const existing = result[node.id];
    const proj = projectPoint3D(node, view, existing && typeof existing === "object" ? existing : undefined);
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
