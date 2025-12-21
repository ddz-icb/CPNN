import * as PIXI from "pixi.js";

function createLineSprites(link, nodeContainers) {
  if (!link?.attribs || !nodeContainers) return [];
  return link.attribs.map(() => {
    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.anchor.set(0.5);
    sprite.eventMode = "none";
    sprite.zIndex = 0;
    nodeContainers.addChild(sprite);
    return sprite;
  });
}

function prepareLineGraphics3D({ graph, nodeContainers, lines3D, lines2D, setPixiState }) {
  if (!graph?.data?.links || !nodeContainers || !setPixiState) return;

  const shouldRebuild =
    !Array.isArray(lines3D) ||
    lines3D.length !== graph.data.links.length ||
    (lines3D.length > 0 && !Array.isArray(lines3D[0]));
  if (shouldRebuild) {
    const newLines3D = graph.data.links.map((link) => createLineSprites(link, nodeContainers));
    setPixiState("lines3D", newLines3D);
    setPixiState("lines", newLines3D);
  } else {
    lines3D.forEach((sprites) => {
      if (!Array.isArray(sprites)) return;
      sprites.forEach((sprite) => {
        if (!sprite) return;
        sprite.visible = true;
        if (!sprite.parent) {
          nodeContainers.addChild(sprite);
        }
      });
    });
    setPixiState("lines", lines3D);
  }

  if (lines2D) {
    lines2D.visible = false;
    lines2D.clear();
  }
}

function prepareLineGraphics2D({ lines2D, lines3D, setPixiState }) {
  if (!setPixiState) return;

  if (Array.isArray(lines3D)) {
    lines3D.forEach((sprites) => {
      if (!Array.isArray(sprites)) return;
      sprites.forEach((sprite) => {
        if (!sprite) return;
        sprite.visible = false;
      });
    });
  } else if (lines3D) {
    lines3D.clear?.();
    lines3D.visible = false;
  }

  if (lines2D) {
    lines2D.visible = true;
  }

  setPixiState("lines", lines2D);
}

export function applyLineGraphicsState(threeD, params) {
  if (threeD) {
    prepareLineGraphics3D(params);
  } else {
    prepareLineGraphics2D(params);
  }
}
