import { getNodeLabelOffsetY } from "./drawingUtils.js";
import { updateHighlights } from "./highlights.js";
import { updateLines } from "./lineGraphics.js";

export function redraw(graphData, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, showNodeLabels, nodeMap, app) {
  const { nodes, links } = graphData;

  updateLines(links, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices);
  updateNodes(nodes, nodeMap, showNodeLabels);
  updateHighlights();

  app.renderer.render(app.stage);
}

export function render(app) {
  app.renderer.render(app.stage);
}

function updateNodes(nodes, nodeMap, showNodeLabels) {
  if (!nodes || !nodeMap) return;

  for (const node of nodes) {
    const { circle, nodeLabel } = nodeMap[node.id];
    if (!circle || !nodeLabel) continue;

    circle.x = node.x;
    circle.y = node.y;

    if (nodeLabel) {
      if (showNodeLabels) {
        nodeLabel.visible = true;
        nodeLabel.x = node.x;
        nodeLabel.y = node.y + getNodeLabelOffsetY(node.id);
      } else {
        nodeLabel.visible = false;
      }
    }
  }
}
