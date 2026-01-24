import * as PIXI from "pixi.js";
import { radius } from "./nodes.js";

const activeHighlights = new Set();

export function clearNodeHighlight(circle) {
  if (!circle) return;
  activeHighlights.delete(circle);
  if (!circle?.highlightOverlay) return;

  const overlay = circle.highlightOverlay;
  if (overlay && !overlay.destroyed) {
    if (overlay.parent) {
      overlay.parent.removeChild(overlay);
    }
    overlay.destroy();
  }
  circle.highlightOverlay = null;
}

export function highlightNode(circle, highlightColor) {
  if (!circle) return null;

  if (circle.visible === false) {
    clearNodeHighlight(circle);
    return null;
  }

  clearNodeHighlight(circle);

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
  circle.highlightOverlay = overlay;
  activeHighlights.add(circle);
  updateHighlightOverlay(circle);

  return overlay;
}

function updateHighlightOverlay(circle) {
  if (!circle?.highlightOverlay || circle.highlightOverlay.destroyed) return;
  if (circle.visible === false) {
    clearNodeHighlight(circle);
    return;
  }

  const overlay = circle.highlightOverlay;
  overlay.x = circle.x;
  overlay.y = circle.y;
  const scaleX = circle.scale?.x ?? 1;
  const scaleY = circle.scale?.y ?? scaleX;
  overlay.scale?.set?.(scaleX, scaleY);
  overlay.zIndex = circle.zIndex ?? 0;
}

export function updateHighlights() {
  for (const circle of activeHighlights) {
    if (!circle || circle.destroyed) {
      activeHighlights.delete(circle);
      continue;
    }
    updateHighlightOverlay(circle);
  }
}
