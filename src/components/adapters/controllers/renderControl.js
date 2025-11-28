import log from "../logging/logger.js";
import * as PIXI from "pixi.js";
import { useRef, useEffect } from "react";
import { handleResize, initDragAndZoom, initTooltips } from "../../domain/service/canvas_interaction/interactiveCanvas.js";
import { radius, drawCircle, getTextStyle, getBitMapStyle, getNodeLabelOffsetY } from "../../domain/service/canvas_drawing/draw.js";
import { linkLengthInit } from "../state/physicsState.js";
import { useAppearance } from "../state/appearanceState.js";
import { graphInit, useGraphState } from "../state/graphState.js";
import { useContainer } from "../state/containerState.js";
import { tooltipInit, useTooltipSettings } from "../state/tooltipState.js";
import { useError } from "../state/errorState.js";
import { useReset } from "../state/resetState.js";
import { useColorschemeState } from "../state/colorschemeState.js";
import { getSimulation, mountSimulation } from "../../domain/service/physics_calculations/simulation.js";
import { useTheme } from "../state/themeState.js";
import { circlesInit, linesInit, nodeMapInit, usePixiState } from "../state/pixiState.js";
import { filteredAfterStartInit, useGraphFlags } from "../state/graphFlagsState.js";
import { simulationInit, useRenderState } from "../state/canvasState.js";

export function RenderControl() {
  const { appearance } = useAppearance();
  const { theme } = useTheme();
  const { colorschemeState } = useColorschemeState();
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { pixiState, setPixiState } = usePixiState();
  const { container, setContainer } = useContainer();
  const { setTooltipSettings, setAllTooltipSettings } = useTooltipSettings();
  const { setError } = useError();
  const { reset, setReset } = useReset();
  const { renderState, setRenderState } = useRenderState();

  const containerRef = useRef(null);
  const cameraRef = useRef(appearance.camera); // for 3D

  // reset simulation //
  useEffect(() => {
    if (!reset) return;

    setGraphState("graph", graphInit);
    setGraphFlags("filteredAfterStart", filteredAfterStartInit);
    setPixiState("nodeMap", nodeMapInit);
    setPixiState("circles", circlesInit);
    setPixiState("lines", linesInit);

    setAllTooltipSettings(tooltipInit);

    if (renderState.simulation) {
      renderState.simulation.stop();
      setRenderState("simulation", simulationInit);
    }

    if (renderState.app) {
      renderState.app.stage.removeChildren();
      containerRef.current.appendChild(renderState.app.canvas);
    }

    setReset(null);
  }, [reset]);

  // init Pixi //
  useEffect(() => {
    if (!containerRef.current || renderState.app || !graphState.graph) return;
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
        setRenderState("app", app);
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
    if (
      pixiState.circles ||
      !renderState.app ||
      !graphState.graph ||
      !container.width ||
      !container.height ||
      !theme ||
      !colorschemeState.nodeColorscheme
    )
      return;
    log.info("Setting stage");

    try {
      const newLines = new PIXI.Graphics();
      const newCircles = new PIXI.Container();
      const newNodeLabels = new PIXI.Container();
      renderState.app.stage.addChild(newLines);
      renderState.app.stage.addChild(newCircles);
      renderState.app.stage.addChild(newNodeLabels);

      const offsetSpawnValue = graphState.graph.data.nodes.length * 10;
      const newNodeMap = {};
      for (const node of graphState.graph.data.nodes) {
        if (node.x == null) {
          node.x = container.width / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
        }
        if (node.y == null) {
          node.y = container.height / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
        }

        let circle = new PIXI.Graphics();
        circle = drawCircle(circle, node, theme.circleBorderColor, colorschemeState.nodeColorscheme.data, colorschemeState.nodeAttribsToColorIndices);
        circle.id = node.id;
        circle.interactive = true;
        circle.buttonMode = true;
        circle.x = node.x;
        circle.y = node.y;
        newCircles.addChild(circle);
        initTooltips(circle, node, setTooltipSettings);

        let nodeLabel = new PIXI.BitmapText(getBitMapStyle(node.id));
        nodeLabel.style = getTextStyle(theme.textColor);
        nodeLabel.x = node.x;
        nodeLabel.y = node.y;
        getNodeLabelOffsetY(node.id);
        nodeLabel.pivot.x = nodeLabel.width / 2;
        nodeLabel.visible = false;
        newNodeLabels.addChild(nodeLabel);

        newNodeMap[node.id] = { node, circle, nodeLabel };
      }

      setPixiState("nodeLabels", newNodeLabels);
      setPixiState("circles", newCircles);
      setPixiState("lines", newLines);
      setPixiState("nodeMap", newNodeMap);
    } catch (error) {
      setError(error.message);
      log.error(error.message);
    }
  }, [renderState.app, graphState.graph, colorschemeState.nodeColorscheme, container.width, container.height, theme]);

  // init simulation //
  useEffect(() => {
    if (!renderState.app || !graphState.graph || renderState.simulation || graphFlags.filteredAfterStart) {
      return;
    }
    log.info("Init simulation");

    try {
      const newSimulation = getSimulation(linkLengthInit, appearance.threeD);
      initDragAndZoom(renderState.app, newSimulation, radius, setTooltipSettings, container.width, container.height, appearance.threeD);
      setRenderState("simulation", newSimulation);
    } catch (error) {
      setError(error.message);
      log.error(error.message);
    }
  }, [renderState.app, graphState.graph]);

  // change 2D <-> 3D
  useEffect(() => {
    if (!renderState.app || !graphState.graph || !renderState.simulation) return;
    log.info(`Switch simulation to ${appearance.threeD ? "3D" : "2D"}`);

    renderState.simulation.stop();

    try {
      const newSimulation = getSimulation(linkLengthInit, appearance.threeD);
      initDragAndZoom(renderState.app, newSimulation, radius, setTooltipSettings, container.width, container.height, appearance.threeD, cameraRef);
      setRenderState("simulation", newSimulation);
    } catch (error) {
      setError(error.message);
      log.error(error.message);
    }
  }, [appearance.threeD]);

  // running simulation //
  useEffect(() => {
    if (!pixiState.circles || !graphState.graph || !renderState.simulation || !graphFlags.filteredAfterStart || !pixiState.lines) return;
    log.info("Running simulation with the following graph:", graphState.graph);

    try {
      const redraw = mountSimulation(
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
        cameraRef,
        appearance.threeD
      );
      redraw();

      setRenderState(renderState.simulation);
    } catch (error) {
      setError("Error loading graph. The graph data is most likely incorrect", error.message);
      log.error(error.message);

      if (renderState.simulation) {
        renderState.simulation.stop();
      }
    }

    return () => {
      if (renderState.simulation) {
        renderState.simulation.stop();
      }
    };
  }, [graphState.graph, pixiState.circles, pixiState.lines, renderState.simulation, graphFlags.filteredAfterStart]);

  // resize the canvas on window resize //
  useEffect(() => {
    if (renderState.app) {
      window.addEventListener("resize", () => handleResize(containerRef, renderState.app));
    }

    return () => {
      window.removeEventListener("resize", () => handleResize(containerRef, renderState.app));
    };
  }, [renderState.app]);

  return (
    <>
      <div ref={containerRef} className="canvas" />
    </>
  );
}
