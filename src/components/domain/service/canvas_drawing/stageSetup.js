import * as PIXI from "pixi.js";
import { initTooltips } from "../canvas_interaction/interactiveCanvas.js";
import { drawCircle, getBitMapStyle, getNodeLabelOffsetY, getTextStyle, toColorNumber } from "./draw.js";

function seedNodePositions(nodes, container) {
  const offsetSpawnValue = nodes.length * 10;

  for (const node of nodes) {
    if (node.x == null) {
      node.x = container.width / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
    }
    if (node.y == null) {
      node.y = container.height / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
    }
    if (node.z == null) {
      node.z = (Math.random() - 0.5) * offsetSpawnValue;
    }
  }
}

function buildNodeGraphics(nodes, theme, colorschemeState, setTooltipSettings) {
  const nodeContainers = new PIXI.Container();
  nodeContainers.sortableChildren = true;

  const nodeMap = {};

  for (const node of nodes) {
    let circle = new PIXI.Graphics();
    circle = drawCircle(circle, node, theme.circleBorderColor, colorschemeState.nodeColorscheme.data, colorschemeState.nodeAttribsToColorIndices);
    circle.id = node.id;
    circle.interactive = true;
    circle.buttonMode = true;
    circle.x = node.x;
    circle.y = node.y;
    nodeContainers.addChild(circle);
    initTooltips(circle, node, setTooltipSettings);

    let nodeLabel = new PIXI.BitmapText(getBitMapStyle(node.id));
    nodeLabel.style = getTextStyle(theme.textColor);
    nodeLabel.x = node.x;
    nodeLabel.y = node.y;
    getNodeLabelOffsetY(node.id);
    nodeLabel.pivot.x = nodeLabel.width / 2;
    nodeLabel.visible = false;
    nodeContainers.addChild(nodeLabel);

    nodeMap[node.id] = { node, circle, nodeLabel };
  }

  return { nodeContainers, nodeMap };
}

function buildLineLayers(graph, nodeContainers, isThreeD) {
  const lines2D = new PIXI.Graphics();

  let lines3D = null;
  let activeLines = lines2D;

  if (isThreeD && graph?.data?.links) {
    lines3D = graph.data.links.map((link, idx) => {
      const lineGraphic = new PIXI.Graphics();
      lineGraphic.zIndex = 0;
      link.__lineIdx = idx;
      nodeContainers.addChild(lineGraphic);
      return lineGraphic;
    });
    lines2D.visible = false;
    activeLines = lines3D;
  }

  return { lines2D, lines3D, activeLines };
}

function buildGridGraphics(container, theme, show) {
  const grid = new PIXI.Graphics();
  grid.sortableChildren = false;
  grid.eventMode = "none";
  grid.visible = !!show;

  grid.__gridColor = toColorNumber(theme?.textColor);

  return grid;
}

export function setupStage({ app, graph, container, theme, colorschemeState, setTooltipSettings, threeD, show3DGrid }) {
  if (!app || !graph?.data?.nodes?.length) return null;

  seedNodePositions(graph.data.nodes, container);

  const grid3D = buildGridGraphics(container, theme, threeD && show3DGrid);
  const { nodeContainers, nodeMap } = buildNodeGraphics(graph.data.nodes, theme, colorschemeState, setTooltipSettings);
  const { lines2D, lines3D, activeLines } = buildLineLayers(graph, nodeContainers, threeD);
  app.stage.addChild(grid3D);
  app.stage.addChild(lines2D);
  app.stage.addChild(nodeContainers);

  return {
    nodeContainers,
    nodeMap,
    lines2D,
    lines3D,
    lines: activeLines,
    grid3D,
  };
}
