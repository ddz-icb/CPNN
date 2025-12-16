import * as PIXI from "pixi.js";
import { radius } from "./nodes.js";

export const rimRadiusFactor = 1.06;
export const rimWidthFactor = 0.18;
const pixiRimRadiusFactor = 1.05;
const pixiRimWidthFactor = 0.15;
const pixiRimHighlightAngles = { start: -Math.PI * 0.9, end: -Math.PI * 0.1 };
const pixiRimShadowAngles = { start: Math.PI * 0.1, end: Math.PI * 0.9 };

export function setNode3DState(nodeMap, threeD, enableShading = true) {
  if (!nodeMap || !threeD) return;

  Object.values(nodeMap).forEach(({ circle }) => setSphereShadingVisibility(circle, !!enableShading));
}

export function resetNode3DState(nodeMap, threeD) {
  if (!nodeMap || threeD) return;

  Object.values(nodeMap).forEach(({ circle, nodeLabel }) => {
    circle?.scale?.set?.(1);
    nodeLabel?.scale?.set?.(1);
    circle.tint = 0xffffff;
    setSphereShadingVisibility(circle, false);
  });
}

export function applyNode3DState(nodeMap, threeD, enableShading = true) {
  if (threeD) {
    setNode3DState(nodeMap, true, enableShading);
  } else {
    resetNode3DState(nodeMap, false);
  }
}

function ensureSphereShading(circle) {
  if (!circle) return null;
  if (circle.sphereShading) return circle.sphereShading;

  const highlight = new PIXI.Graphics();
  highlight.eventMode = "none";
  highlight.visible = false;
  highlight.blendMode = "add";

  highlight.arc(0, 0, radius * pixiRimRadiusFactor, pixiRimHighlightAngles.start, pixiRimHighlightAngles.end).stroke({
    color: 0xffffff,
    width: radius * pixiRimWidthFactor,
    alpha: 0.55,
  });

  highlight.circle(radius * 0.22, -radius * 0.26, radius * 0.4).fill({
    color: 0xffffff,
    alpha: 0.3,
  });

  const shadow = new PIXI.Graphics();
  shadow.eventMode = "none";
  shadow.visible = false;
  shadow.blendMode = "multiply";

  shadow.arc(0, 0, radius * pixiRimRadiusFactor, pixiRimShadowAngles.start, pixiRimShadowAngles.end).stroke({
    color: 0x000000,
    width: radius * pixiRimWidthFactor,
    alpha: 0.45,
  });

  shadow.circle(-radius * 0.24, radius * 0.28, radius * 0.55).fill({
    color: 0x000000,
    alpha: 0.24,
  });

  circle.addChild(shadow);
  circle.addChild(highlight);

  circle.sphereShading = { highlight, shadow };
  return circle.sphereShading;
}

function setSphereShadingVisibility(circle, visible) {
  const shading = ensureSphereShading(circle);
  if (!shading) return;

  shading.highlight.visible = visible;
  shading.shadow.visible = visible;
}

export function updateSphereShading(circle, scale = 1) {
  const shading = ensureSphereShading(circle);
  if (!shading) return;

  const { highlight, shadow } = shading;

  if (!highlight.visible || !shadow.visible) return;

  const { highlightAlpha, shadowAlpha } = computeSphereShadingAlpha(scale);
  highlight.alpha = highlightAlpha;
  shadow.alpha = shadowAlpha;
}

export function computeLightingTint(scale) {
  const normalized = Math.max(0, Math.min(1, (scale - 0.4) / 0.8));
  const eased = Math.pow(normalized, 1.2);
  const factor = 0.7 + 0.3 * eased;
  const channel = Math.round(255 * factor);
  return (channel << 16) | (channel << 8) | channel;
}

function computeSphereShadingAlpha(scale) {
  const normalized = Math.max(0, Math.min(1, (scale - 0.4) / 0.9));
  const intensity = 0.3 + 0.5 * Math.pow(normalized, 0.8);

  return {
    highlightAlpha: 0.35 + intensity * 0.25,
    shadowAlpha: 0.25 + intensity * 0.2,
  };
}

export function drawCanvasSphereShading(ctx, x, y, baseRadius, scale) {
  const { highlightAlpha, shadowAlpha } = computeSphereShadingAlpha(scale);
  const rimRadius = baseRadius * pixiRimRadiusFactor;
  const rimWidth = baseRadius * pixiRimWidthFactor;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = shadowAlpha;
  ctx.lineCap = "round";
  ctx.lineWidth = rimWidth;
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.arc(0, 0, rimRadius, pixiRimShadowAngles.start, pixiRimShadowAngles.end);
  ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.beginPath();
  ctx.arc(-baseRadius * 0.24, baseRadius * 0.28, baseRadius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = highlightAlpha;
  ctx.lineCap = "round";
  ctx.lineWidth = rimWidth;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(0, 0, rimRadius, pixiRimHighlightAngles.start, pixiRimHighlightAngles.end);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.arc(baseRadius * 0.22, -baseRadius * 0.26, baseRadius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

