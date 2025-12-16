import { applyTintToColor, getColor } from "./colors.js";
import { radius } from "./nodes.js";
import { drawCanvasSphereShading } from "./shading.js";

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

