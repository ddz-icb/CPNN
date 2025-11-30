import * as PIXI from "pixi.js";

function prepareLineGraphics3D({ graph, nodeContainers, lines3D, lines2D, setPixiState }) {
  if (!graph?.data?.links || !nodeContainers || !setPixiState) return;

  if (!lines3D) {
    const newLines3D = graph.data.links.map((link, idx) => {
      const lineGraphic = new PIXI.Graphics();
      lineGraphic.zIndex = 0;
      link.__lineIdx = idx;
      nodeContainers.addChild(lineGraphic);
      return lineGraphic;
    });
    setPixiState("lines3D", newLines3D);
    setPixiState("lines", newLines3D);
  } else {
    setPixiState("lines", lines3D);
  }

  if (lines2D) {
    lines2D.visible = false;
    lines2D.clear();
  }
}

function prepareLineGraphics2D({ lines2D, lines3D, setPixiState }) {
  if (!setPixiState) return;

  if (lines3D) {
    lines3D.forEach((g) => {
      g.clear();
      g.visible = false;
    });
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
