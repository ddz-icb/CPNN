import log from "../logging/logger.js";
import * as PIXI from "pixi.js";
import { useRef, useEffect } from "react";
import { handleResize, initDragAndZoom } from "../../domain/service/canvas_interaction/interactiveCanvas.js";
import { radius, applyNode3DState } from "../../domain/service/canvas_drawing/draw.js";
import { applyLineGraphicsState } from "../../domain/service/canvas_drawing/lineGraphics.js";
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
import { nodeContainersInit, linesInit, lines2DInit, lines3DInit, nodeMapInit, grid3DInit, usePixiState } from "../state/pixiState.js";
import { filteredAfterStartInit, useGraphFlags } from "../state/graphFlagsState.js";
import { simulationInit, useRenderState } from "../state/canvasState.js";
import { setupStage } from "../../domain/service/canvas_drawing/stageSetup.js";

export function RenderControl() {
  const { appearance, setAppearance } = useAppearance();
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
  const cameraRef = useRef({ ...appearance.cameraRef }); // for 3D

  useEffect(() => {
    // share the live camera reference with subscribers (e.g., redraw bindings)
    setAppearance("cameraRef", cameraRef);
  }, [setAppearance, cameraRef]);

  useEffect(() => {
    if (!container.width || !container.height) return;

    cameraRef.current.x = container.width / 2;
    cameraRef.current.y = container.height / 2;
  }, [container.width, container.height]);

  // reset simulation //
  useEffect(() => {
    if (!reset) return;

    setGraphState("graph", graphInit);
    setGraphFlags("filteredAfterStart", filteredAfterStartInit);
    setPixiState("nodeMap", nodeMapInit);
    setPixiState("nodeContainers", nodeContainersInit);
    setPixiState("lines", linesInit);
    setPixiState("lines2D", lines2DInit);
    setPixiState("lines3D", lines3DInit);
    setPixiState("grid3D", grid3DInit);

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
      pixiState.nodeContainers ||
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
      const stage = setupStage({
        app: renderState.app,
        graph: graphState.graph,
        container,
        theme,
        colorschemeState,
        setTooltipSettings,
        threeD: appearance.threeD,
        show3DGrid: appearance.show3DGrid,
      });

      if (!stage) return;

      setPixiState("nodeContainers", stage.nodeContainers);
      setPixiState("lines2D", stage.lines2D);
      setPixiState("lines3D", stage.lines3D);
      setPixiState("lines", stage.lines);
      setPixiState("grid3D", stage.grid3D);
      setPixiState("nodeMap", stage.nodeMap);
    } catch (error) {
      setError(error.message);
      log.error(error.message);
    }
  }, [renderState.app, graphState.graph, colorschemeState.nodeColorscheme, container.width, container.height, theme, appearance.threeD]);

  // init simulation //
  useEffect(() => {
    if (!renderState.app || !graphState.graph || renderState.simulation || graphFlags.filteredAfterStart) {
      return;
    }
    log.info("Init simulation");

    try {
      const newSimulation = getSimulation(linkLengthInit, appearance.threeD);
      initDragAndZoom(renderState.app, newSimulation, radius, setTooltipSettings, container.width, container.height, appearance.threeD, cameraRef);
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
      applyLineGraphicsState(appearance.threeD, {
        graph: graphState.graph,
        nodeContainers: pixiState.nodeContainers,
        lines2D: pixiState.lines2D,
        lines3D: pixiState.lines3D,
        setPixiState,
      });
      if (pixiState.grid3D) {
        pixiState.grid3D.visible = appearance.threeD && appearance.show3DGrid;
        pixiState.grid3D.clear();
      }
      const newSimulation = getSimulation(linkLengthInit, appearance.threeD);
      initDragAndZoom(renderState.app, newSimulation, radius, setTooltipSettings, container.width, container.height, appearance.threeD, cameraRef);
      applyNode3DState(pixiState.nodeMap, appearance.threeD, appearance.enable3DShading);
      setRenderState("simulation", newSimulation);
    } catch (error) {
      setError(error.message);
      log.error(error.message);
    }
  }, [appearance.threeD]);

  // running simulation //
  useEffect(() => {
    if (!pixiState.nodeContainers || !graphState.graph || !renderState.simulation || !graphFlags.filteredAfterStart || !pixiState.lines || !pixiState.grid3D) return;
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
        pixiState.grid3D,
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
  }, [graphState.graph, pixiState.nodeContainers, pixiState.lines, pixiState.grid3D, renderState.simulation, graphFlags.filteredAfterStart]);

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
