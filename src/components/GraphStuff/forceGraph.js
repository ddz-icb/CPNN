import "../../index.css";
import log from "../../logger.js";
import * as PIXI from "pixi.js";
import { useRef, useEffect, useState } from "react";
import { cloneDeep } from "lodash";

import { handleResize, initDragAndZoom } from "../Other/interactiveCanvas.js";
import { initTooltips, Tooltips } from "../Other/toolTipCanvas.js";
import { radius, drawCircle, drawLine } from "../Other/draw.js";
import { getSimulation } from "./graphPhysics.js";
import { useGraphData, useSettings, useTooltipSettings } from "../../states.js";
import { SettingControl } from "./settingControl.js";

export function ForceGraph({ reset, setReset, setError }) {
  const { settings, setSettings } = useSettings();
  const { graphData, setGraphData } = useGraphData();
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();

  const containerRef = useRef(null);

  const [app, setApp] = useState(null);
  const [simulation, setSimulation] = useState(null);

  // reset simulation //
  useEffect(() => {
    if (!reset) return;
    log.info("Resetting simulation");

    setGraphData("", (prev) => ({
      ...prev,
      graph: null,
      circleNodeMap: null,
      circles: null,
      lines: null,
      filteredAfterStart: false,
    }));

    setTooltipSettings("", { isClickTooltipActive: false, clickTooltipData: null, isHoverTooltipActive: false, hoverTooltipData: null });

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
    if (!containerRef.current || app || !graphData.graph) return;
    log.info("Init PIXI app");

    const containerRect = containerRef.current.getBoundingClientRect();
    const height = containerRect.height;
    const width = containerRect.width;

    setSettings("container.height", height);
    setSettings("container.width", width);

    const initPIXI = async () => {
      const app = new PIXI.Application();
      await app.init({
        width,
        height,
        antialias: !0,
        resolution: window.devicePixelRatio || 1,
        backgroundAlpha: 0, // makes the canvas fully transparent
      });

      app.canvas.style.position = "absolute";
      app.canvas.style.display = "block";
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";

      containerRef.current.appendChild(app.canvas);

      setApp(app);
      log.info("PIXI Initialized successfully");
    };

    initPIXI();
  }, [containerRef, graphData.graph]);

  // set stage //
  useEffect(() => {
    if (
      graphData.circles ||
      !app ||
      !graphData.graph ||
      !settings.container.width ||
      !settings.container.height ||
      !settings.appearance.theme ||
      !settings.appearance.nodeColorScheme
    )
      return;
    log.info("Setting stage");

    const newLines = new PIXI.Graphics();
    const newCircles = new PIXI.Container();
    app.stage.addChild(newLines);
    app.stage.addChild(newCircles);

    const offsetSpawnValue = graphData.graph.nodes.length * 10;
    const circleNodeMap = {};
    for (const node of graphData.graph.nodes) {
      let circle = new PIXI.Graphics();
      circle = drawCircle(
        circle,
        node,
        settings.appearance.theme.circleBorderColor,
        settings.appearance.nodeColorScheme.colorScheme,
        settings.appearance.nodeAttribsToColorIndices
      );
      circle.id = node.id;
      circle.interactive = true;
      circle.buttonMode = true;
      circle.x = settings.container.width / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
      circle.y = settings.container.height / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
      initTooltips(circle, node, setTooltipSettings);
      newCircles.addChild(circle);
      circleNodeMap[node.id] = { node, circle };
    }

    setGraphData("", (prev) => ({
      ...prev,
      lines: newLines,
      circles: newCircles,
      circleNodeMap: circleNodeMap,
    }));
  }, [app, graphData.graph]);

  // init simulation //
  useEffect(() => {
    if (!app || !graphData.graph || simulation || graphData.filteredAfterStart) {
      return;
    }
    log.info("Init simulation");

    const newSimulation = getSimulation(
      settings.container.width,
      settings.container.height,
      settings.physics.linkLength,
      settings.physics.xStrength,
      settings.physics.yStrength,
      settings.physics.nodeRepulsionStrength
    );
    initDragAndZoom(app, newSimulation, radius, setTooltipSettings, settings.container.width, settings.container.height);

    setSimulation(newSimulation);
  }, [app, graphData.graph]);

  // running simulation //
  useEffect(() => {
    if (!graphData.circles || !graphData.graph || !simulation || !graphData.filteredAfterStart || !graphData.lines) return;
    log.info("Running simulation with the following graph:", graphData.graph);

    try {
      let activeCircles = graphData.circles.children.filter((circle) => circle.visible);

      simulation
        .on("tick.redraw", () => redraw(graphData.graph))
        .on("end", render)
        .nodes(activeCircles)
        .force("link")
        .links(graphData.graph.links);

      // restart the simulation and reheat if necessary to make sure everything is being rerendered correctly
      simulation.restart();
      if (simulation.alpha() < 0.5) {
        simulation.alpha(0.5);
      }

      setSimulation(simulation);
    } catch (error) {
      setError("Error loading graph. The graph data is most likely incorrect", error.message);
      log.error("error: ", error);

      if (simulation) {
        simulation.stop();
      }
    }

    return () => {
      if (simulation) {
        simulation.stop();
      }
    };
  }, [graphData.graph, graphData.circles, simulation]);

  // resize the canvas on window resize //
  useEffect(() => {
    if (app) {
      window.addEventListener("resize", () => handleResize(window, app));
    }

    return () => {
      window.removeEventListener("resize", () => handleResize(window, app));
    };
  }, [app]);

  // redraw runs while the simulation is active //
  function redraw(graph) {
    graphData.lines.clear();

    for (const link of graph.links) {
      drawLine(graphData.lines, link, settings.appearance.linkColorScheme.colorScheme, settings.appearance.linkAttribsToColorIndices);
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
      <SettingControl simulation={simulation} app={app} redraw={redraw} />
      <div ref={containerRef} className="container" />
    </>
  );
}
