import { useEffect } from "react";
import log from "../logging/logger.js";

import { changeCircleBorderColor, changeNodeColors, changeNodeLabelColor, redraw } from "../../domain/service/canvas_drawing/draw.js";
import { useAppearance } from "../state/appearanceState.js";
import { useGraphState } from "../state/graphState.js";

import { useColorschemeState } from "../state/colorschemeState.js";
import { useTheme } from "../state/themeState.js";
import { usePixiState } from "../state/pixiState.js";
import { useRenderState } from "../state/canvasState.js";
import { errorService } from "../../application/services/errorService.js";

export function AppearanceControl() {
  const { appearance } = useAppearance();
  const { theme } = useTheme();
  const { colorschemeState } = useColorschemeState();
  const { graphState } = useGraphState();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();

  // rebind redraw function and run one cycle
  useEffect(() => {
    if (
      !renderState.simulation ||
      !graphState.graph ||
      !pixiState.lines ||
      !appearance.linkWidth ||
      !colorschemeState.linkColorscheme ||
      !colorschemeState.linkAttribsToColorIndices ||
      !pixiState.nodeMap ||
      !renderState.app
    )
      return;
    log.info("Updating redraw function");

    try {
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
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  }, [appearance.showNodeLabels, colorschemeState.linkColorscheme, colorschemeState.linkAttribsToColorIndices, appearance.linkWidth]);

  // enable/disable node labels
  useEffect(() => {
    if (!pixiState.circles) return;
    log.info("Enabling/Disabling node labels");

    try {
      if (appearance.showNodeLabels === true) {
        graphState.graph.data.nodes.forEach((n) => {
          const { nodeLabel } = pixiState.nodeMap[n.id];
          nodeLabel.visible = true;
        });
      } else {
        pixiState.nodeLabels.children.forEach((label) => (label.visible = false));
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  }, [appearance.showNodeLabels]);

  // switch colors upon changing theme
  useEffect(() => {
    if (!pixiState.circles) return;
    log.info("Switching colors", theme);

    try {
      changeCircleBorderColor(pixiState.circles, theme.circleBorderColor);
      changeNodeLabelColor(pixiState.nodeLabels, theme.textColor);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  }, [theme]);

  // switch node color scheme
  useEffect(() => {
    if (!pixiState.circles) return;
    log.info("Changing node color scheme");

    try {
      changeNodeColors(
        pixiState.circles,
        pixiState.nodeMap,
        theme.circleBorderColor,
        colorschemeState.nodeColorscheme.data,
        colorschemeState.nodeAttribsToColorIndices
      );
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  }, [colorschemeState.nodeColorscheme, colorschemeState.nodeAttribsToColorIndices]);
}
