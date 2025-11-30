import { drawLine, getNodeLabelOffsetY, updateHighlights } from "./draw.js";

export function redraw(graphData, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, showNodeLabels, nodeMap, app) {
  const { nodes, links } = graphData;

  updateLines(links, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices);
  updateNodes(nodes, nodeMap, showNodeLabels);
  updateHighlights(nodeMap);

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

function updateLines(links, lineGraphics, linkWidth, linkColorscheme, linkAttribsToColorIndices) {
  if (!lineGraphics || !links) return;

  if (Array.isArray(lineGraphics)) {
    for (let i = 0; i < lineGraphics.length; i++) {
      const link = links[i];
      const graphic = lineGraphics[i];
      if (!graphic) continue;
      graphic.clear();
      if (!link) {
        graphic.visible = false;
        continue;
      }
      drawLine(graphic, link, linkWidth, linkColorscheme.data, linkAttribsToColorIndices);
      graphic.visible = true;
      graphic.zIndex = 0;
    }
    return;
  }

  lineGraphics.clear();
  lineGraphics.visible = true;
  for (const link of links) {
    drawLine(lineGraphics, link, linkWidth, linkColorscheme.data, linkAttribsToColorIndices);
  }
}
