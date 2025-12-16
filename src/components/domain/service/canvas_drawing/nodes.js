import * as PIXI from "pixi.js";
import { getColor } from "./colors.js";
import { getTextStyle } from "./labels.js";

export const radius = 8;

export function drawCircle(circle, node, circleBorderColor, colorscheme, nodeAttribsToColorIndices) {
  circle
    .circle(0, 0, radius)
    .fill({ color: getColor(nodeAttribsToColorIndices[node.groups[0]], colorscheme) })
    .stroke({ color: circleBorderColor, width: 2 });
  for (let i = 1; i < node.groups.length; i++) {
    const startAngle = (i * 2 * Math.PI) / node.groups.length;
    const endAngle = ((i + 1) * 2 * Math.PI) / node.groups.length;

    circle
      .arc(0, 0, radius - 1, startAngle, endAngle)
      .lineTo(0, 0)
      .fill({
        color: getColor(nodeAttribsToColorIndices[node.groups[i]], colorscheme),
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

