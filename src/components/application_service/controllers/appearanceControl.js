import { useEffect } from "react";
import log from "../../logger.js";

import { changeCircleBorderColor, changeNodeColors, changeNodeLabelColor } from "../../domain_service/canvas_drawing/draw.js";
import { usePhysics } from "../../adapters/state/physicsState.js";
import { useAppearance } from "../../adapters/state/appearanceState.js";
import { useGraphState } from "../../adapters/state/graphState.js";

import { useColorschemeState } from "../../adapters/state/colorschemeState.js";
import { useTheme } from "../../adapters/state/themeState.js";

export function AppearanceStateControl({ app, simulation, redraw }) {
  const { physics, setPhysics } = usePhysics();
  const { appearance, setAppearance } = useAppearance();
  const { theme, setTheme } = useTheme();
  const { colorschemeState, setColorschemeState } = useColorschemeState();
  const { graphState, setGraphState } = useGraphState();
  // enable/disable node labels
  useEffect(() => {
    if (!graphState.circles || !app) return;
    log.info("Enabling/Disabling node labels");

    if (appearance.showNodeLabels == true) {
      graphState.graph.data.nodes.forEach((n) => {
        const { nodeLabel } = graphState.nodeMap[n.id];
        nodeLabel.visible = true;
      });
      simulation.on("tick.redraw", () => redraw(graphState.graph.data));
      redraw(graphState.graph.data);
    } else {
      graphState.nodeLabels.children.forEach((label) => (label.visible = false));
      simulation.on("tick.redraw", () => redraw(graphState.graph.data));
      redraw(graphState.graph.data);
    }
  }, [appearance.showNodeLabels]);

  // switch colors upon changing theme //
  useEffect(() => {
    if (!graphState.circles) return;
    log.info("Switching colors", theme);

    changeCircleBorderColor(graphState.circles, theme.circleBorderColor);
    changeNodeLabelColor(graphState.nodeLabels, theme.textColor);
  }, [theme]);

  // switch node color scheme
  useEffect(() => {
    if (!graphState.circles) return;
    log.info("Changing node color scheme");

    changeNodeColors(
      graphState.circles,
      graphState.nodeMap,
      theme.circleBorderColor,
      colorschemeState.nodeColorscheme.data,
      colorschemeState.nodeAttribsToColorIndices
    );
  }, [colorschemeState.nodeColorscheme, colorschemeState.nodeAttribsToColorIndices]);

  // switch link color scheme
  useEffect(() => {
    if (!simulation || !graphState.lines) return;
    log.info("Changing link color scheme");

    simulation.on("tick.redraw", () => redraw(graphState.graph.data));
    redraw(graphState.graph.data);
  }, [colorschemeState.linkColorscheme, colorschemeState.linkAttribsToColorIndices]);

  // change link width
  useEffect(() => {
    if (!simulation || !graphState.lines) return;
    log.info("Changing link width", physics.communityForceStrength);

    simulation.on("tick.redraw", () => redraw(graphState.graph.data));
    redraw(graphState.graph.data);
  }, [appearance.linkWidth]);
}
