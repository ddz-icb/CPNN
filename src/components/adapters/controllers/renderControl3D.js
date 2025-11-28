import log from "../logging/logger.js";
import * as PIXI from "pixi.js";
import { useRef, useEffect } from "react";
import { handleResize, initDragAndZoom, initTooltips } from "../../domain/service/canvas_interaction/interactiveCanvas.js";
import { enableLasso } from "../../domain/service/canvas_interaction/lasso.js";
import { Tooltips } from "../gui/tooltip/tooltips.js";
import { radius, drawCircle, getTextStyle, getBitMapStyle, redraw, render, getNodeLabelOffsetY } from "../../domain/service/canvas_drawing/draw.js";
import { linkLengthInit } from "../state/physicsState.js";
import { useAppearance } from "../state/appearanceState.js";
import { graphInit, useGraphState } from "../state/graphState.js";
import { useContainer } from "../state/containerState.js";
import { tooltipInit, useTooltipSettings } from "../state/tooltipState.js";
import { useError } from "../state/errorState.js";
import { useReset } from "../state/resetState.js";
import { useColorschemeState } from "../state/colorschemeState.js";
import { useTheme } from "../state/themeState.js";
import { circlesInit, linesInit, nodeMapInit, usePixiState } from "../state/pixiState.js";
import { filteredAfterStartInit, useGraphFlags } from "../state/graphFlagsState.js";
import { simulationInit, useRenderState } from "../state/canvasState.js";
import { useFilter } from "../state/filterState.js";
import { getSimulation3D } from "../../domain/service/physics_calculations/getSimulation3D.js";

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
  const { filter, setFilter } = useFilter();

  const containerRef = useRef(null);
  const lassoApiRef = useRef(null);

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
      const newSimulation = getSimulation3D(linkLengthInit);
      initDragAndZoom(renderState.app, newSimulation, radius, setTooltipSettings, container.width, container.height);
      setRenderState("simulation", newSimulation);
    } catch (error) {
      setError(error.message);
      log.error(error.message);
    }
  }, [renderState.app, graphState.graph]);

  // running simulation //
  useEffect(() => {
    if (!pixiState.circles || !graphState.graph || !renderState.simulation || !graphFlags.filteredAfterStart || !pixiState.lines) return;
    log.info("Running simulation with the following graph:", graphState.graph);

    try {
      let activeCircles = pixiState.circles.children.filter((circle) => circle.visible);

      renderState.simulation
        .on("tick.redraw", () =>
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
        )
        .on("end", () => render(renderState.app))
        .nodes(activeCircles)
        .force("link")
        .links(graphState.graph.data.links);

      // restart the simulation and reheat if necessary to make sure everything is being rerendered correctly
      renderState.simulation.restart();
      if (renderState.simulation.alpha() < 0.5) {
        renderState.simulation.alpha(0.5);
      }

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

  // lasso function
  useEffect(() => {
    if (!filter.lasso || !renderState.app || !pixiState.nodeMap) {
      return;
    }

    setFilter("lassoSelection", []);

    const disableLasso = enableLasso({
      app: renderState.app,
      nodeMap: pixiState.nodeMap,
      lineColor: theme.circleBorderColor,
      onSelect: ({ nodes }) => {
        setFilter("lassoSelection", Array.isArray(nodes) ? nodes : []);
      },
    });
    lassoApiRef.current = disableLasso;

    return () => {
      if (lassoApiRef.current === disableLasso) {
        lassoApiRef.current = null;
      }
      if (typeof disableLasso === "function") {
        disableLasso();
      }
    };
  }, [filter.lasso, renderState.app, pixiState.nodeMap, theme, setFilter]);

  useEffect(() => {
    if (!filter.lasso) {
      lassoApiRef.current?.clearSelection?.();
      lassoApiRef.current = null;
      if (Array.isArray(filter.lassoSelection) && filter.lassoSelection.length === 0) {
        return;
      }
      setFilter("lassoSelection", []);
      return;
    }

    if (!Array.isArray(filter.lassoSelection) || filter.lassoSelection.length > 0) {
      return;
    }

    lassoApiRef.current?.clearSelection?.();
  }, [filter.lasso, filter.lassoSelection, setFilter]);

  return (
    <>
      <Tooltips />
      <div ref={containerRef} className="canvas" />
    </>
  );
}
