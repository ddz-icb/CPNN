import { useEffect } from "react";
import log from "../../adapters/logging/logger.js";

import { changeCircleBorderColor, changeNodeColors, changeNodeLabelColor, redraw } from "../../domain_service/canvas_drawing/draw.js";
import { usePhysics } from "../../adapters/state/physicsState.js";
import { useAppearance } from "../../adapters/state/appearanceState.js";
import { useGraphState } from "../../adapters/state/graphState.js";

import { useColorschemeState } from "../../adapters/state/colorschemeState.js";
import { useTheme } from "../../adapters/state/themeState.js";
import { usePixiState } from "../../adapters/state/pixiState.js";
import { useRenderState } from "../../adapters/state/canvasState.js";

export function AppearanceControl() {
  const { physics, setPhysics } = usePhysics();
  const { appearance, setAppearance } = useAppearance();
  const { theme, setTheme } = useTheme();
  const { colorschemeState, setColorschemeState } = useColorschemeState();
  const { graphState, setGraphState } = useGraphState();
  const { pixiState, setPixiState } = usePixiState();
  const { renderState, setRenderState } = useRenderState();

  // enable/disable node labels
  useEffect(() => {
    if (!pixiState.circles) return;
    log.info("Enabling/Disabling node labels");

    if (appearance.showNodeLabels == true) {
      graphState.graph.data.nodes.forEach((n) => {
        const { nodeLabel } = pixiState.nodeMap[n.id];
        nodeLabel.visible = true;
      });
      renderState.simulation.on("tick.redraw", () =>
        redraw(
          graphState.graph.data,
          pixiState.lines,
          appearance.linkWidth,
          colorschemeState.linkColorscheme,
          colorschemeState.linkAttribsToColorIndices,
          appearance.showNodeLabels,
          pixiState.nodeMap,
          renderState.app
        )
      );
      redraw(
        graphState.graph.data,
        pixiState.lines,
        appearance.linkWidth,
        colorschemeState.linkColorscheme,
        colorschemeState.linkAttribsToColorIndices,
        appearance.showNodeLabels,
        pixiState.nodeMap,
        renderState.app
      );
    } else {
      pixiState.nodeLabels.children.forEach((label) => (label.visible = false));
      renderState.simulation.on("tick.redraw", () =>
        redraw(
          graphState.graph.data,
          pixiState.lines,
          appearance.linkWidth,
          colorschemeState.linkColorscheme,
          colorschemeState.linkAttribsToColorIndices,
          appearance.showNodeLabels,
          pixiState.nodeMap,
          renderState.app
        )
      );
      redraw(
        graphState.graph.data,
        pixiState.lines,
        appearance.linkWidth,
        colorschemeState.linkColorscheme,
        colorschemeState.linkAttribsToColorIndices,
        appearance.showNodeLabels,
        pixiState.nodeMap,
        renderState.app
      );
    }
  }, [appearance.showNodeLabels]);

  // switch colors upon changing theme //
  useEffect(() => {
    if (!pixiState.circles) return;
    log.info("Switching colors", theme);

    changeCircleBorderColor(pixiState.circles, theme.circleBorderColor);
    changeNodeLabelColor(pixiState.nodeLabels, theme.textColor);
  }, [theme]);

  // switch node color scheme
  useEffect(() => {
    if (!pixiState.circles) return;
    log.info("Changing node color scheme");

    changeNodeColors(
      pixiState.circles,
      pixiState.nodeMap,
      theme.circleBorderColor,
      colorschemeState.nodeColorscheme.data,
      colorschemeState.nodeAttribsToColorIndices
    );
  }, [colorschemeState.nodeColorscheme, colorschemeState.nodeAttribsToColorIndices]);

  // switch link color scheme
  useEffect(() => {
    if (!renderState.simulation || !pixiState.lines) return;
    log.info("Changing link color scheme");

    renderState.simulation.on("tick.redraw", () =>
      redraw(
        graphState.graph.data,
        pixiState.lines,
        appearance.linkWidth,
        colorschemeState.linkColorscheme,
        colorschemeState.linkAttribsToColorIndices,
        appearance.showNodeLabels,
        pixiState.nodeMap,
        renderState.app
      )
    );
    redraw(
      graphState.graph.data,
      pixiState.lines,
      appearance.linkWidth,
      colorschemeState.linkColorscheme,
      colorschemeState.linkAttribsToColorIndices,
      appearance.showNodeLabels,
      pixiState.nodeMap,
      renderState.app
    );
  }, [colorschemeState.linkColorscheme, colorschemeState.linkAttribsToColorIndices]);

  // change link width
  useEffect(() => {
    if (!renderState.simulation || !pixiState.lines) return;
    log.info("Changing link width", physics.communityForceStrength);

    renderState.simulation.on("tick.redraw", () =>
      redraw(
        graphState.graph.data,
        pixiState.lines,
        appearance.linkWidth,
        colorschemeState.linkColorscheme,
        colorschemeState.linkAttribsToColorIndices,
        appearance.showNodeLabels,
        pixiState.nodeMap,
        renderState.app
      )
    );
    redraw(
      graphState.graph.data,
      pixiState.lines,
      appearance.linkWidth,
      colorschemeState.linkColorscheme,
      colorschemeState.linkAttribsToColorIndices,
      appearance.showNodeLabels,
      pixiState.nodeMap,
      renderState.app
    );
  }, [appearance.linkWidth]);
}
