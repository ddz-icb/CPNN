import * as PIXI from "pixi.js";
import { radius } from "./nodes.js";

export function clearNodeHighlight(circle) {
  if (!circle) return;
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
  overlay.alpha = 0.7;
  overlay.blendMode = "add";
  overlay.x = circle.x;
  overlay.y = circle.y;
  overlay.circle(0, 0, radius + 4).stroke({ color: highlightColor, width: 3, alpha: 0.7, alignment: 0.5 });
  overlay.circle(0, 0, radius + 8).stroke({ color: highlightColor, width: 2, alpha: 0.5, alignment: 0.5 });
  overlay.circle(0, 0, radius + 12).stroke({ color: highlightColor, width: 1, alpha: 0.35, alignment: 0.5 });

  const parent = circle.parent;
  if (parent?.addChild) {
    parent.addChild(overlay);
  } else {
    circle.addChild?.(overlay);
  }
  circle.highlightOverlay = overlay;

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
}

export function updateHighlights(nodeMap) {
  if (!nodeMap) return;
  Object.values(nodeMap).forEach(({ circle }) => updateHighlightOverlay(circle));
}

