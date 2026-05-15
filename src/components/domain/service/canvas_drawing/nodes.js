import { applyTintToColor, getColor, getTextStyle } from "./drawingUtils.js";
import { getNodeIdName } from "../parsing/nodeIdParsing.js";
import { drawCanvasSphereShading } from "./shading.js";

export const radius = 8;
const nodeMapMergeAliases = new WeakMap();

export function drawCircle(circle, node, circleBorderColor, colorscheme, nodeAttribsToColorIndices) {
  circle
    .circle(0, 0, radius)
    .fill({ color: getColor(nodeAttribsToColorIndices[node.attribs[0]], colorscheme) })
    .stroke({ color: circleBorderColor, width: 2 });
  for (let i = 1; i < node.attribs.length; i++) {
    const startAngle = (i * 2 * Math.PI) / node.attribs.length;
    const endAngle = ((i + 1) * 2 * Math.PI) / node.attribs.length;

    circle
      .arc(0, 0, radius - 1, startAngle, endAngle)
      .lineTo(0, 0)
      .fill({
        color: getColor(nodeAttribsToColorIndices[node.attribs[i]], colorscheme),
      });
  }
  return circle;
}

export function changeCircleBorderColor(nodeMap, newColor) {
  if (!nodeMap) return;
  Object.values(nodeMap).forEach(({ circle }) => {
    if (!circle) return;
    circle.circle(0, 0, radius).stroke({ color: newColor, width: 2 });
  });
}

export function changeNodeLabelColor(nodeMap, textColor) {
  if (!nodeMap) return;
  Object.values(nodeMap).forEach(({ nodeLabel }) => {
    if (!nodeLabel) return;
    nodeLabel.style = getTextStyle(textColor);
  });
}

export function changeNodeColors(nodeMap, circleBorderColor, colorscheme, nodeAttribsToColorIndices) {
  if (!nodeMap) return;
  Object.values(nodeMap).forEach(({ node, circle }) => {
    if (!node || !circle) return;
    circle.clear();
    drawCircle(circle, node, circleBorderColor, colorscheme, nodeAttribsToColorIndices);
  });
}

export function syncNodeMapWithGraphData(graphData, nodeMap, theme, colorschemeState) {
  if (!graphData?.nodes || !nodeMap) return;

  const previousAliases = nodeMapMergeAliases.get(nodeMap) ?? [];
  previousAliases.forEach((alias) => {
    delete nodeMap[alias];
  });

  const aliases = [];
  graphData.nodes.forEach((node) => {
    const representativeId = node.__mergeRepresentativeId ?? node.id;
    const entry = nodeMap[representativeId] ?? nodeMap[node.id];
    if (!entry) return;

    entry.node = node;

    if (entry.circle) {
      entry.circle.id = node.id;
      entry.circle.__tooltipNode = node;

      if (theme?.circleBorderColor && colorschemeState?.nodeColorscheme?.data && colorschemeState?.nodeAttribsToColorIndices) {
        entry.circle.clear();
        drawCircle(
          entry.circle,
          node,
          theme.circleBorderColor,
          colorschemeState.nodeColorscheme.data,
          colorschemeState.nodeAttribsToColorIndices,
        );
      }
    }

    if (entry.nodeLabel) {
      entry.nodeLabel.text = getNodeIdName(node.id);
      entry.nodeLabel.pivot.x = entry.nodeLabel.width / 2;
    }

    if (node.id !== representativeId) {
      nodeMap[node.id] = entry;
      aliases.push(node.id);
    }
  });

  nodeMapMergeAliases.set(nodeMap, aliases);
}

export function filterActiveNodesForPixi(showNodeLabels, graphData, nodeMap) {
  if (!nodeMap || !graphData?.nodes) return;

  Object.values(nodeMap).forEach(({ circle, nodeLabel }) => {
    if (circle) {
      circle.visible = false;
      circle.__hiddenByFilter = true;
    }
    if (nodeLabel) {
      nodeLabel.visible = false;
      nodeLabel.__hiddenByFilter = true;
    }
  });

  graphData.nodes.forEach((node) => {
    const entry = nodeMap[node.id];
    if (!entry) return;
    const { circle, nodeLabel } = entry;
    if (circle) {
      circle.visible = true;
      circle.__hiddenByFilter = false;
    }
    if (nodeLabel) {
      nodeLabel.__hiddenByFilter = false;
    }
    if (showNodeLabels && nodeLabel) {
      nodeLabel.visible = true;
    }
  });
}

export function drawCircleCanvas(ctx, node, circle, circleBorderColor, colorscheme, nodeAttribsToColorIndices, options = {}) {
  const { scale = 1, tint = null, enableShading = false, alpha = ctx.globalAlpha ?? 1 } = options;
  const centerX = circle?.x ?? node.x ?? 0;
  const centerY = circle?.y ?? node.y ?? 0;
  const effectiveRadius = radius * scale;
  const strokeWidth = 2 * scale;
  ctx.beginPath();
  ctx.arc(centerX, centerY, effectiveRadius, 0, 2 * Math.PI);
  const baseColor = getColor(nodeAttribsToColorIndices[node.attribs[0]], colorscheme);
  const tintedBase = tint ? applyTintToColor(baseColor, tint) : baseColor;
  ctx.fillStyle = tintedBase;
  ctx.fill();
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = tint ? applyTintToColor(circleBorderColor, tint) : circleBorderColor;
  ctx.stroke();

  for (let i = 1; i < node.attribs.length; i++) {
    const startAngle = (i * 2 * Math.PI) / node.attribs.length;
    const endAngle = ((i + 1) * 2 * Math.PI) / node.attribs.length;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, effectiveRadius - 1 * scale, startAngle, endAngle);
    ctx.closePath();
    const segmentColor = getColor(nodeAttribsToColorIndices[node.attribs[i]], colorscheme);
    const tintedSegment = tint ? applyTintToColor(segmentColor, tint) : segmentColor;
    ctx.fillStyle = tintedSegment;
    ctx.fill();
  }

  if (enableShading) {
    drawCanvasSphereShading(ctx, centerX, centerY, effectiveRadius, scale, alpha);
  }
}
