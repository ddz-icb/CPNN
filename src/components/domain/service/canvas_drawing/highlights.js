import * as PIXI from "pixi.js";
import { getEndpointIdText, getLinkIdText, getUndirectedLinkKey } from "../graph_calculations/graphUtils.js";
import { getParallelLinkLayoutData } from "./lineGraphics.js";
import { radius } from "./nodes.js";

const activeHighlights = new Set();
const activeCommunityHighlights = new Set();
const activeLinkGlowGraphics = new Map();
const LINK_GLOW_STROKES = [
  { outset: 4.5, alpha: 0.6 },
  { outset: 2, alpha: 0.8 },
];
const LINK_GLOW_ENDPOINT_INSET = radius + 1;
const LINK_GLOW_Z_OFFSET = 0.08;

let activeLinkHighlightIds = new Set();
let activeLinkHighlightColor = 0xffff00;
let linkHighlightLayer = null;
let lastLinkHighlightContext = null;

function clearOverlay(circle, overlayKey, activeSet) {
  if (!circle) return;
  activeSet.delete(circle);
  const overlay = circle?.[overlayKey];
  if (!overlay) return;

  if (!overlay.destroyed) {
    if (overlay.parent) {
      overlay.parent.removeChild(overlay);
    }
    overlay.destroy();
  }
  circle[overlayKey] = null;
}

function updateOverlay(circle, overlayKey, activeSet) {
  const overlay = circle?.[overlayKey];
  if (!overlay || overlay.destroyed) return;
  if (circle.visible === false) {
    overlay.visible = false;
    return;
  }

  overlay.visible = true;
  overlay.x = circle.x;
  overlay.y = circle.y;
  const scaleX = circle.scale?.x ?? 1;
  const scaleY = circle.scale?.y ?? scaleX;
  overlay.scale?.set?.(scaleX, scaleY);
  overlay.zIndex = circle.zIndex ?? 0;
}

function drawOverlay(circle, highlightColor, overlayKey, activeSet) {
  if (!circle) return null;

  clearOverlay(circle, overlayKey, activeSet);

  const overlay = new PIXI.Graphics();
  overlay.eventMode = "none";
  overlay.alpha = 1;
  overlay.blendMode = "add";
  overlay.circle(0, 0, radius + 4).stroke({ color: highlightColor, width: 3, alpha: 1.0, alignment: 0.5 });
  overlay.circle(0, 0, radius + 8).stroke({ color: highlightColor, width: 2, alpha: 0.7, alignment: 0.5 });
  overlay.circle(0, 0, radius + 11).stroke({ color: highlightColor, width: 1, alpha: 0.4, alignment: 0.5 });

  const parent = circle.parent;
  if (parent?.addChild) {
    parent.addChild(overlay);
  } else {
    circle.addChild?.(overlay);
  }
  circle[overlayKey] = overlay;
  activeSet.add(circle);
  updateOverlay(circle, overlayKey, activeSet);

  return overlay;
}

export function clearNodeHighlight(circle) {
  clearOverlay(circle, "highlightOverlay", activeHighlights);
}

export function highlightNode(circle, highlightColor) {
  return drawOverlay(circle, highlightColor, "highlightOverlay", activeHighlights);
}

export function clearCommunityHighlight(circle) {
  clearOverlay(circle, "communityHighlightOverlay", activeCommunityHighlights);
}

export function highlightCommunityNode(circle, highlightColor) {
  return drawOverlay(circle, highlightColor, "communityHighlightOverlay", activeCommunityHighlights);
}

function clearLinkHighlightLayer() {
  if (!linkHighlightLayer || linkHighlightLayer.destroyed) return;
  linkHighlightLayer.clear();
  linkHighlightLayer.visible = false;
}

function destroyLinkGlowGraphic(graphic) {
  if (!graphic || graphic.destroyed) return;
  if (graphic.parent) {
    graphic.parent.removeChild(graphic);
  }
  graphic.destroy();
}

function clearLineGlowGraphics() {
  activeLinkGlowGraphics.forEach((graphic) => {
    destroyLinkGlowGraphic(graphic);
  });
  activeLinkGlowGraphics.clear();
}

function getBaseLinkWidth(width) {
  const numericWidth = Number(width);
  return Number.isFinite(numericWidth) && numericWidth > 0 ? numericWidth : 1;
}

function getDepthScale(scale) {
  const numericScale = Number(scale);
  return Number.isFinite(numericScale) && numericScale > 0 ? numericScale : 1;
}

function getGlowLinkWidth(style, bundleWidth, depthScale = 1) {
  const baseWidth = getBaseLinkWidth(bundleWidth);
  const outset = Number(style?.outset);
  return baseWidth + Math.max(0, Number.isFinite(outset) ? outset : 0) * getDepthScale(depthScale) * 2;
}

function getLinkAttribCount(link) {
  return link?.attrib === undefined || link?.attrib === null ? 0 : 1;
}

function getLinkBundleWidth(link, linkWidth) {
  return getBaseLinkWidth(linkWidth) * getLinkAttribCount(link);
}

function getHighlightBundleKey(link, index) {
  const sourceId = getEndpointIdText(link?.source);
  const targetId = getEndpointIdText(link?.target);
  return getUndirectedLinkKey(sourceId, targetId) ?? getLinkIdText(link, index);
}

function getTrimmedLineEndpoints(x1, y1, x2, y2, endpointInset = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const inset = Number(endpointInset);

  if (!Number.isFinite(length) || length <= 0 || !Number.isFinite(inset) || inset <= 0) {
    return { sourceX: x1, sourceY: y1, targetX: x2, targetY: y2 };
  }

  const safeInset = Math.min(inset, Math.max(0, length / 2 - 0.5));
  if (safeInset <= 0) {
    return { sourceX: x1, sourceY: y1, targetX: x2, targetY: y2 };
  }

  const unitX = dx / length;
  const unitY = dy / length;

  return {
    sourceX: x1 + unitX * safeInset,
    sourceY: y1 + unitY * safeInset,
    targetX: x2 - unitX * safeInset,
    targetY: y2 - unitY * safeInset,
  };
}

function ensureLinkHighlightLayer(lineGraphic) {
  const parent = lineGraphic?.parent;
  if (!parent) return null;

  if (!linkHighlightLayer || linkHighlightLayer.destroyed || linkHighlightLayer.parent !== parent) {
    if (linkHighlightLayer?.parent) {
      linkHighlightLayer.parent.removeChild(linkHighlightLayer);
    }
    linkHighlightLayer = new PIXI.Graphics();
    linkHighlightLayer.eventMode = "none";
    linkHighlightLayer.blendMode = "add";

    const lineIndex = parent.children?.indexOf?.(lineGraphic) ?? -1;
    if (lineIndex >= 0 && parent.addChildAt) {
      parent.addChildAt(linkHighlightLayer, lineIndex);
    } else {
      parent.addChild(linkHighlightLayer);
    }
  }

  linkHighlightLayer.zIndex = (lineGraphic?.zIndex ?? 0) - LINK_GLOW_Z_OFFSET;
  return linkHighlightLayer;
}

function drawLinkGlow(layer, link, linkWidth, layout = null) {
  const sourceX = link?.source?.x;
  const sourceY = link?.source?.y;
  const targetX = link?.target?.x;
  const targetY = link?.target?.y;

  if (![sourceX, sourceY, targetX, targetY].every(Number.isFinite)) return;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (!Number.isFinite(length) || length <= 0) return;

  const trimmed = getTrimmedLineEndpoints(sourceX, sourceY, targetX, targetY, LINK_GLOW_ENDPOINT_INSET);
  const laneCount = Math.max(1, layout?.laneCount ?? 1);
  const bundleWidth = getLinkBundleWidth(link, linkWidth) * laneCount;

  for (const style of LINK_GLOW_STROKES) {
    layer
      .moveTo(trimmed.sourceX, trimmed.sourceY)
      .lineTo(trimmed.targetX, trimmed.targetY)
      .stroke({
        color: activeLinkHighlightColor,
        width: getGlowLinkWidth(style, bundleWidth),
        alpha: style.alpha,
        cap: "round",
      });
  }
}

function updateLineHighlights2D({ links, lineGraphics, linkWidth }) {
  clearLineGlowGraphics();
  if (activeLinkHighlightIds.size === 0) {
    clearLinkHighlightLayer();
    return;
  }

  const layer = ensureLinkHighlightLayer(lineGraphics);
  if (!layer) return;

  layer.clear();
  layer.visible = lineGraphics?.visible !== false;
  if (!layer.visible) return;

  const layouts = getParallelLinkLayoutData(links);
  const highlightedBundles = new Set();
  (links ?? []).forEach((link, index) => {
    if (!activeLinkHighlightIds.has(getLinkIdText(link, index))) return;
    const bundleKey = getHighlightBundleKey(link, index);
    if (highlightedBundles.has(bundleKey)) return;
    highlightedBundles.add(bundleKey);
    drawLinkGlow(layer, link, linkWidth, layouts.get(index));
  });
}

function getVisibleEdgeSpriteGeometry(sprites, linkWidth, layout = null) {
  const visibleSprites = (sprites ?? []).filter((sprite) => sprite && sprite.visible !== false);
  if (visibleSprites.length === 0) return null;

  const sourceSprite = visibleSprites[0];
  const stripeHeight = visibleSprites.reduce((sum, sprite) => sum + getBaseLinkWidth(sprite.height), 0) / visibleSprites.length;
  const depthScale = stripeHeight / getBaseLinkWidth(linkWidth);
  const laneCount = Math.max(1, layout?.laneCount ?? visibleSprites.length);
  const laneOffset = layout?.laneOffset ?? 0;
  const position = visibleSprites.reduce(
    (sum, sprite) => {
      sum.x += sprite.x ?? 0;
      sum.y += sprite.y ?? 0;
      return sum;
    },
    { x: 0, y: 0 },
  );
  const x = position.x / visibleSprites.length;
  const y = position.y / visibleSprites.length;
  const perpendicularX = -Math.sin(sourceSprite.rotation);
  const perpendicularY = Math.cos(sourceSprite.rotation);

  return {
    parent: sourceSprite.parent,
    x: x - laneOffset * stripeHeight * perpendicularX,
    y: y - laneOffset * stripeHeight * perpendicularY,
    rotation: sourceSprite.rotation,
    width: sourceSprite.width,
    bundleWidth: stripeHeight * laneCount,
    depthScale,
    zIndex: sourceSprite.zIndex ?? 0,
  };
}

function ensureLineGlowGraphic(key, edgeGeometry) {
  const parent = edgeGeometry?.parent;
  if (!parent) return null;

  let glowGraphic = activeLinkGlowGraphics.get(key);
  if (!glowGraphic || glowGraphic.destroyed || glowGraphic.parent !== parent) {
    destroyLinkGlowGraphic(glowGraphic);
    glowGraphic = new PIXI.Graphics();
    glowGraphic.eventMode = "none";
    glowGraphic.blendMode = "add";
    parent.addChild(glowGraphic);
    activeLinkGlowGraphics.set(key, glowGraphic);
  }

  return glowGraphic;
}

function updateLineGlowGraphic(glowGraphic, edgeGeometry, style, styleIndex) {
  const sourceWidth = getBaseLinkWidth(edgeGeometry.width);
  const depthScale = getDepthScale(edgeGeometry.depthScale);
  const endpointInset = Math.min(LINK_GLOW_ENDPOINT_INSET * depthScale, Math.max(0, sourceWidth / 2 - 0.5));
  const halfLength = Math.max(0.5, (sourceWidth - endpointInset * 2) / 2);
  const offsetX = Math.cos(edgeGeometry.rotation) * halfLength;
  const offsetY = Math.sin(edgeGeometry.rotation) * halfLength;

  glowGraphic.clear();
  glowGraphic.visible = true;
  glowGraphic
    .moveTo(edgeGeometry.x - offsetX, edgeGeometry.y - offsetY)
    .lineTo(edgeGeometry.x + offsetX, edgeGeometry.y + offsetY)
    .stroke({
      color: activeLinkHighlightColor,
      width: getGlowLinkWidth(style, edgeGeometry.bundleWidth, depthScale),
      alpha: style.alpha,
      cap: "round",
    });
  glowGraphic.zIndex = edgeGeometry.zIndex - LINK_GLOW_Z_OFFSET - styleIndex * 0.01;
}

function pruneUnusedLineGlowGraphics(usedKeys) {
  activeLinkGlowGraphics.forEach((graphic, key) => {
    if (usedKeys.has(key)) return;
    destroyLinkGlowGraphic(graphic);
    activeLinkGlowGraphics.delete(key);
  });
}

function updateLineHighlights3D({ links, lineGraphics, linkWidth }) {
  clearLinkHighlightLayer();
  if (activeLinkHighlightIds.size === 0 || !Array.isArray(lineGraphics)) {
    clearLineGlowGraphics();
    return;
  }

  const usedGlowKeys = new Set();
  const highlightedBundles = new Set();
  const layouts = getParallelLinkLayoutData(links);

  (links ?? []).forEach((link, index) => {
    if (!activeLinkHighlightIds.has(getLinkIdText(link, index))) return;
    const bundleKey = getHighlightBundleKey(link, index);
    if (highlightedBundles.has(bundleKey)) return;
    highlightedBundles.add(bundleKey);

    const sprites = lineGraphics[index];
    if (!Array.isArray(sprites)) return;

    const edgeGeometry = getVisibleEdgeSpriteGeometry(sprites, linkWidth, layouts.get(index));
    if (!edgeGeometry) return;

    LINK_GLOW_STROKES.forEach((style, styleIndex) => {
      const key = `${bundleKey}:${styleIndex}`;
      const glowGraphic = ensureLineGlowGraphic(key, edgeGeometry);
      if (!glowGraphic) return;
      updateLineGlowGraphic(glowGraphic, edgeGeometry, style, styleIndex);
      usedGlowKeys.add(key);
    });
  });

  pruneUnusedLineGlowGraphics(usedGlowKeys);
}

function updateLinkHighlights(context) {
  if (context) {
    lastLinkHighlightContext = context;
  }

  const nextContext = context ?? lastLinkHighlightContext;
  if (!nextContext) return;

  if (Array.isArray(nextContext.lineGraphics)) {
    updateLineHighlights3D(nextContext);
  } else {
    updateLineHighlights2D(nextContext);
  }
}

export function setLinkHighlights(linkIds = [], highlightColor = activeLinkHighlightColor) {
  activeLinkHighlightIds = new Set((linkIds ?? []).filter((linkId) => linkId !== undefined && linkId !== null && linkId !== ""));
  activeLinkHighlightColor = highlightColor;
  updateLinkHighlights();
}

export function updateHighlights(linkContext) {
  for (const circle of activeHighlights) {
    if (!circle || circle.destroyed) {
      activeHighlights.delete(circle);
      continue;
    }
    updateOverlay(circle, "highlightOverlay", activeHighlights);
  }

  for (const circle of activeCommunityHighlights) {
    if (!circle || circle.destroyed) {
      activeCommunityHighlights.delete(circle);
      continue;
    }
    updateOverlay(circle, "communityHighlightOverlay", activeCommunityHighlights);
  }

  updateLinkHighlights(linkContext);
}
