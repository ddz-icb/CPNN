import { useEffect } from "react";
import log from "../../adapters/logging/logger.js";

import { changeCircleBorderColor, changeNodeColors, changeNodeLabelColor } from "../../domain_service/canvas_drawing/draw.js";
import { usePhysics } from "../../adapters/state/physicsState.js";
import { useAppearance } from "../../adapters/state/appearanceState.js";
import { useGraphState } from "../../adapters/state/graphState.js";

import { useColorschemeState } from "../../adapters/state/colorschemeState.js";
import { useTheme } from "../../adapters/state/themeState.js";
import { usePixiState } from "../../adapters/state/pixiState.js";

export function AppearanceStateControl({ app, simulation, redraw }) {
  const { physics, setPhysics } = usePhysics();
  const { appearance, setAppearance } = useAppearance();
  const { theme, setTheme } = useTheme();
  const { colorschemeState, setColorschemeState } = useColorschemeState();
  const { graphState, setGraphState } = useGraphState();
  const { pixiState, setPixiState } = usePixiState();
  // enable/disable node labels
  useEffect(() => {
    if (!pixiState.circles || !app) return;
    log.info("Enabling/Disabling node labels");

    if (appearance.showNodeLabels == true) {
      graphState.graph.data.nodes.forEach((n) => {
        const { nodeLabel } = pixiState.nodeMap[n.id];
        nodeLabel.visible = true;
      });
      simulation.on("tick.redraw", () => redraw(graphState.graph.data));
      redraw(graphState.graph.data);
    } else {
      pixiState.nodeLabels.children.forEach((label) => (label.visible = false));
      simulation.on("tick.redraw", () => redraw(graphState.graph.data));
      redraw(graphState.graph.data);
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
    if (!simulation || !pixiState.lines) return;
    log.info("Changing link color scheme");

    simulation.on("tick.redraw", () => redraw(graphState.graph.data));
    redraw(graphState.graph.data);
  }, [colorschemeState.linkColorscheme, colorschemeState.linkAttribsToColorIndices]);

  // change link width
  useEffect(() => {
    if (!simulation || !pixiState.lines) return;
    log.info("Changing link width", physics.communityForceStrength);

    simulation.on("tick.redraw", () => redraw(graphState.graph.data));
    redraw(graphState.graph.data);
  }, [appearance.linkWidth]);
}
