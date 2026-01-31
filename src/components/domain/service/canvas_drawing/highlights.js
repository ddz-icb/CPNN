import * as PIXI from "pixi.js";
import { radius } from "./nodes.js";

const activeHighlights = new Set();
const activeCommunityHighlights = new Set();

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
    clearOverlay(circle, overlayKey, activeSet);
    return;
  }

  overlay.x = circle.x;
  overlay.y = circle.y;
  const scaleX = circle.scale?.x ?? 1;
  const scaleY = circle.scale?.y ?? scaleX;
  overlay.scale?.set?.(scaleX, scaleY);
  overlay.zIndex = circle.zIndex ?? 0;
}

function drawOverlay(circle, highlightColor, overlayKey, activeSet) {
  if (!circle) return null;

  if (circle.visible === false) {
    clearOverlay(circle, overlayKey, activeSet);
    return null;
  }

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

export function updateHighlights() {
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
}
