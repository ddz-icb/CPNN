import { useEffect } from "react";
import log from "../logging/logger.js";

import { applyNode3DState, changeCircleBorderColor, changeNodeColors, changeNodeLabelColor } from "../../domain/service/canvas_drawing/draw.js";
import { useAppearance } from "../state/appearanceState.js";
import { useGraphState } from "../state/graphState.js";

import { useColorschemeState } from "../state/colorschemeState.js";
import { usePixiState } from "../state/pixiState.js";
import { useRenderState } from "../state/canvasState.js";
import { errorService } from "../../application/services/errorService.js";
import { mountRedraw } from "../../domain/service/physics_calculations/simulation.js";
import { useContainer } from "../state/containerState.js";
import { useTheme } from "../state/themeState.js";

export function AppearanceControl() {
  const { appearance } = useAppearance();
  const { theme } = useTheme();
  const { colorschemeState } = useColorschemeState();
  const { graphState } = useGraphState();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();
  const { container } = useContainer();

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
      const redraw = mountRedraw(
        renderState.simulation,
        graphState.graph.data,
        pixiState.lines,
        appearance.linkWidth,
        colorschemeState.linkColorscheme,
        colorschemeState.linkAttribsToColorIndices,
        appearance.showNodeLabels,
        pixiState.nodeMap,
        renderState.app,
        container,
        appearance.cameraRef,
        appearance.threeD
      );
      redraw();
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  }, [appearance.showNodeLabels, colorschemeState.linkColorscheme, colorschemeState.linkAttribsToColorIndices, appearance.linkWidth]);

  // enable/disable node labels
  useEffect(() => {
    if (!pixiState.nodeMap) return;
    log.info("Enabling/Disabling node labels");

    try {
      if (appearance.showNodeLabels === true) {
        graphState.graph?.data?.nodes.forEach((n) => {
          const { nodeLabel } = pixiState.nodeMap[n.id] || {};
          if (nodeLabel) {
            nodeLabel.visible = true;
          }
        });
      } else {
        Object.values(pixiState.nodeMap).forEach(({ nodeLabel }) => {
          if (nodeLabel) {
            nodeLabel.visible = false;
          }
        });
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  }, [appearance.showNodeLabels]);

  // switch colors upon changing theme
  useEffect(() => {
    if (!pixiState.nodeMap) return;
    log.info("Switching colors", theme);

    try {
      changeCircleBorderColor(pixiState.nodeMap, theme.circleBorderColor);
      changeNodeLabelColor(pixiState.nodeMap, theme.textColor);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  }, [theme]);

  // switch node color scheme
  useEffect(() => {
    if (!pixiState.nodeMap) return;
    log.info("Changing node color scheme");

    try {
      changeNodeColors(pixiState.nodeMap, theme.circleBorderColor, colorschemeState.nodeColorscheme.data, colorschemeState.nodeAttribsToColorIndices);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  }, [colorschemeState.nodeColorscheme, colorschemeState.nodeAttribsToColorIndices]);

  // toggle shading in 3D
  useEffect(() => {
    if (!appearance.threeD || !pixiState.nodeMap) return;
    log.info("Toggling shading in 3D", appearance.enable3DShading);

    applyNode3DState(pixiState.nodeMap, true, appearance.enable3DShading);
  }, [appearance.enable3DShading, appearance.threeD, pixiState.nodeMap]);
}
