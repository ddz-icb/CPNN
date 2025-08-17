import "../../../index.css";
import log from "../../logger.js";
import * as PIXI from "pixi.js";
import { useRef, useEffect, useState } from "react";
import { getNodeLabelOffsetY, handleResize, initDragAndZoom } from "../services/interactiveCanvas.js";
import { initTooltips, Tooltips } from "../../gui/tooltipCanvas.js";
import { radius, drawCircle, drawLine, getTextStyle, getBitMapStyle } from "../../domain_service/canvas_drawing/draw.js";
import { PhysicsStateControl } from "./physicsControl.js";
import { gravityStrengthInit, linkLengthInit, nodeRepulsionStrengthInit } from "../../adapters/state/physicsState.js";
import { useAppearance } from "../../adapters/state/appearanceState.js";
import { useGraphState } from "../../adapters/state/graphState.js";
import { useContainer } from "../../adapters/state/containerState.js";
import { tooltipInit, useTooltipSettings } from "../../adapters/state/tooltipState.js";
import { useError } from "../../adapters/state/errorState.js";
import { useReset } from "../../adapters/state/resetState.js";
import { useColorschemeState } from "../../adapters/state/colorschemeState.js";
import { getNodeIdName } from "../../domain_service/parsing/nodeIdParsing.js";
import { getSimulation } from "../../domain_service/physics_calculations/getSimulation.js";
import { DownloadStateControl } from "./downloadControl.js";
import { AppearanceStateControl } from "./appearanceControl.js";
import { FilterStateControl } from "./filterControl.js";
import { useTheme } from "../../adapters/state/themeState.js";

export function RenderGraph() {
  const { appearance, setAppearance } = useAppearance();
  const { theme, setTheme } = useTheme();
  const { colorschemeState, setColorschemeState } = useColorschemeState();
  const { graphState, setGraphState, setAllGraphState } = useGraphState();
  const { container, setContainer } = useContainer();
  const { tooltipSettings, setTooltipSettings, setAllTooltipSettings } = useTooltipSettings();
  const { error, setError } = useError();
  const { reset, setReset } = useReset();

  const containerRef = useRef(null);

  const [app, setApp] = useState(null);
  const [simulation, setSimulation] = useState(null);

  // reset simulation //
  useEffect(() => {
    if (!reset) return;

    setGraphState("", (prev) => ({
      ...prev,
      graph: null,
      nodeMap: null,
      circles: null,
      lines: null,
      filteredAfterStart: false,
    }));

    setAllTooltipSettings(tooltipInit);

    if (simulation) {
      simulation.stop();
      setSimulation(null);
    }

    if (app) {
      app.stage.removeChildren();
      containerRef.current.appendChild(app.canvas);
    }

    setReset(null);
  }, [reset]);

  // init Pixi //
  useEffect(() => {
    if (!containerRef.current || app || !graphState.graph) return;
    log.info("Init PIXI app");

    const containerRect = containerRef.current.getBoundingClientRect();
    const height = containerRect.height;
    const width = containerRect.width;

    setContainer("height", height);
    setContainer("width", width);

    const initPIXI = async () => {
      try {
        const app = new PIXI.Application();
        await app.init({
          width,
          height,
          antialias: !0,
          resolution: window.devicePixelRatio || 2,
          backgroundAlpha: 0,
          autoDensity: true,
        });
        containerRef.current.appendChild(app.canvas);
        setApp(app);
        log.info("PIXI Initialized successfully");
      } catch (error) {
        setError(error.message);
        log.error(error.message);
      }
    };

    initPIXI();
  }, [containerRef, graphState.graph]);

  // set stage //
  useEffect(() => {
    if (graphState.circles || !app || !graphState.graph || !container.width || !container.height || !theme || !colorschemeState.nodeColorscheme)
      return;
    log.info("Setting stage");

    try {
      const newLines = new PIXI.Graphics();
      const newCircles = new PIXI.Container();
      const newNodeLabels = new PIXI.Container();
      app.stage.addChild(newLines);
      app.stage.addChild(newCircles);
      app.stage.addChild(newNodeLabels);

      const offsetSpawnValue = graphState.graph.data.nodes.length * 10;
      const nodeMap = {};
      for (const node of graphState.graph.data.nodes) {
        let circle = new PIXI.Graphics();
        circle = drawCircle(circle, node, theme.circleBorderColor, colorschemeState.nodeColorscheme.data, colorschemeState.nodeAttribsToColorIndices);
        circle.id = node.id;
        circle.interactive = true;
        circle.buttonMode = true;
        circle.x = node.x || container.width / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
        circle.y = node.y || container.height / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
        newCircles.addChild(circle);
        initTooltips(circle, node, setTooltipSettings);

        let nodeLabel = new PIXI.BitmapText(getBitMapStyle(node.id));
        nodeLabel.style = getTextStyle(theme.textColor);
        nodeLabel.x = circle.x;
        nodeLabel.y = circle.y + getNodeLabelOffsetY(node.id);
        nodeLabel.pivot.x = nodeLabel.width / 2;
        nodeLabel.visible = false;
        newNodeLabels.addChild(nodeLabel);

        nodeMap[node.id] = { node, circle, nodeLabel };
      }

      setGraphState("", (prev) => ({
        ...prev,
        lines: newLines,
        circles: newCircles,
        nodeMap: nodeMap,
        nodeLabels: newNodeLabels,
      }));
    } catch (error) {
      setError(error.message);
      log.error(error.message);
    }
  }, [app, graphState.graph, colorschemeState.nodeColorscheme, container.width, container.height, theme]);

  // init simulation //
  useEffect(() => {
    if (!app || !graphState.graph || simulation || graphState.filteredAfterStart) {
      return;
    }
    log.info("Init simulation");

    try {
      const newSimulation = getSimulation(container.width, container.height, linkLengthInit, gravityStrengthInit, nodeRepulsionStrengthInit);
      initDragAndZoom(app, newSimulation, radius, setTooltipSettings, container.width, container.height);
      setSimulation(newSimulation);
    } catch (error) {
      setError(error.message);
      log.error(error.message);
    }
  }, [app, graphState.graph]);

  // running simulation //
  useEffect(() => {
    if (!graphState.circles || !graphState.graph || !simulation || !graphState.filteredAfterStart || !graphState.lines) return;
    log.info("Running simulation with the following graph:", graphState.graph);

    try {
      let activeCircles = graphState.circles.children.filter((circle) => circle.visible);

      simulation
        .on("tick.redraw", () => redraw(graphState.graph.data))
        .on("end", render)
        .nodes(activeCircles)
        .force("link")
        .links(graphState.graph.data.links);

      // restart the simulation and reheat if necessary to make sure everything is being rerendered correctly
      simulation.restart();
      if (simulation.alpha() < 0.5) {
        simulation.alpha(0.5);
      }

      setSimulation(simulation);
    } catch (error) {
      setError("Error loading graph. The graph data is most likely incorrect", error.message);
      log.error(error.message);

      if (simulation) {
        simulation.stop();
      }
    }

    return () => {
      if (simulation) {
        simulation.stop();
      }
    };
  }, [graphState.graph, graphState.circles, graphState.lines, simulation, graphState.filteredAfterStart]);

  // resize the canvas on window resize //
  useEffect(() => {
    if (app) {
      window.addEventListener("resize", () => handleResize(containerRef, app));
    }

    return () => {
      window.removeEventListener("resize", () => handleResize(containerRef, app));
    };
  }, [app]);

  // redraw runs while the simulation is active //
  function redraw(graphData) {
    graphState.lines.clear();

    for (const link of graphData.links) {
      drawLine(graphState.lines, link, appearance.linkWidth, colorschemeState.linkColorscheme.data, colorschemeState.linkAttribsToColorIndices);
    }

    if (appearance.showNodeLabels) {
      graphData.nodes.forEach((n) => {
        const { node, circle, nodeLabel } = graphState.nodeMap[n.id];
        nodeLabel.x = circle.x;
        nodeLabel.y = circle.y + getNodeLabelOffsetY(node.id);
      });
    }

    app.renderer.render(app.stage);
  }

  // render runs when the simulation is inactive //
  function render() {
    app.renderer.render(app.stage);
  }

  return (
    <>
      <Tooltips />
      <PhysicsStateControl simulation={simulation} />
      <DownloadStateControl app={app} />
      <AppearanceStateControl app={app} simulation={simulation} redraw={redraw} />
      <FilterStateControl />
      <div ref={containerRef} className="container" />
    </>
  );
}
