import { applyTintToColor, getColor, getTextStyle } from "./drawingUtils.js";
import { drawCanvasSphereShading } from "./shading.js";

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

export function drawCircleCanvas(ctx, node, circle, circleBorderColor, colorscheme, nodeAttribsToColorIndices, options = {}) {
  const { scale = 1, tint = null, enableShading = false } = options;
  const centerX = circle?.x ?? node.x ?? 0;
  const centerY = circle?.y ?? node.y ?? 0;
  const effectiveRadius = radius * scale;
  const strokeWidth = 2 * scale;
  ctx.beginPath();
  ctx.arc(centerX, centerY, effectiveRadius, 0, 2 * Math.PI);
  const baseColor = getColor(nodeAttribsToColorIndices[node.groups[0]], colorscheme);
  const tintedBase = tint ? applyTintToColor(baseColor, tint) : baseColor;
  ctx.fillStyle = tintedBase;
  ctx.fill();
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = tint ? applyTintToColor(circleBorderColor, tint) : circleBorderColor;
  ctx.stroke();

  for (let i = 1; i < node.groups.length; i++) {
    const startAngle = (i * 2 * Math.PI) / node.groups.length;
    const endAngle = ((i + 1) * 2 * Math.PI) / node.groups.length;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, effectiveRadius - 1 * scale, startAngle, endAngle);
    ctx.closePath();
    const segmentColor = getColor(nodeAttribsToColorIndices[node.groups[i]], colorscheme);
    const tintedSegment = tint ? applyTintToColor(segmentColor, tint) : segmentColor;
    ctx.fillStyle = tintedSegment;
    ctx.fill();
  }

  if (enableShading) {
    drawCanvasSphereShading(ctx, centerX, centerY, effectiveRadius, scale);
  }
}
