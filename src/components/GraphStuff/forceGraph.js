import "../../index.css";
import log from "../../logger.js";
import * as PIXI from "pixi.js";
import { useRef, useEffect, useState } from "react";
import { handleResize, initDragAndZoom } from "../Other/interactiveCanvas.js";
import { initTooltips, Tooltips } from "../Other/toolTipCanvas.js";
import { radius, drawCircle, drawLine, getTextStyle } from "../Other/draw.js";
import { getSimulation } from "./graphPhysics.js";
import { useAppearance, useGraphData, usePhysics, useSettings, useTooltipSettings } from "../../states.js";
import { SettingControl } from "./settingControl.js";
import { getNodeIdName, getNodeLabelOffsetY } from "./graphCalculations.js";
import { linkLengthInit, nodeRepulsionStrengthInit, xStrengthInit, yStrengthInit } from "./graphInitValues.js";

export function ForceGraph({ reset, setReset, setError }) {
  const { settings, setSettings } = useSettings();
  const { appearance, setAppearance } = useAppearance();
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
      nodeMap: null,
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
        resolution: window.devicePixelRatio || 2,
        backgroundAlpha: 0,
        autoDensity: true,
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
      !appearance.theme ||
      !appearance.nodeColorScheme
    )
      return;
    log.info("Setting stage");

    const newLines = new PIXI.Graphics();
    const newCircles = new PIXI.Container();
    const newNodeLabels = new PIXI.Container();
    app.stage.addChild(newLines);
    app.stage.addChild(newCircles);
    app.stage.addChild(newNodeLabels);

    const offsetSpawnValue = graphData.graph.nodes.length * 10;
    const nodeMap = {};
    for (const node of graphData.graph.nodes) {
      let circle = new PIXI.Graphics();
      circle = drawCircle(
        circle,
        node,
        appearance.theme.circleBorderColor,
        appearance.nodeColorScheme.colorScheme,
        appearance.nodeAttribsToColorIndices
      );
      circle.id = node.id;
      circle.interactive = true;
      circle.buttonMode = true;
      circle.x = node.x || settings.container.width / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
      circle.y = node.y || settings.container.height / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
      initTooltips(circle, node, setTooltipSettings);
      newCircles.addChild(circle);

      let nodeLabel = new PIXI.BitmapText({
        text: getNodeIdName(node.id),
        style: {
          chars: [["A", "Z"], ["a", "z"], ["0", "9"], " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"],
          padding: 4,
          resolution: 4,
          distanceField: { type: "sdf", range: 8 },
          fontSize: 12,
        },
      });

      nodeLabel.style = getTextStyle(appearance.theme.textColor);
      nodeLabel.x = circle.x;
      nodeLabel.y = circle.y + getNodeLabelOffsetY(node.id);
      nodeLabel.pivot.x = nodeLabel.width / 2;
      nodeLabel.visible = false;
      newNodeLabels.addChild(nodeLabel);

      nodeMap[node.id] = { node, circle, nodeLabel };
    }

    setGraphData("", (prev) => ({
      ...prev,
      lines: newLines,
      circles: newCircles,
      nodeMap: nodeMap,
      nodeLabels: newNodeLabels,
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
      linkLengthInit,
      xStrengthInit,
      yStrengthInit,
      nodeRepulsionStrengthInit
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
      log.error(`${error.message}`);

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
      window.addEventListener("resize", () => handleResize(containerRef, app));
    }

    return () => {
      window.removeEventListener("resize", () => handleResize(containerRef, app));
    };
  }, [app]);

  // redraw runs while the simulation is active //
  function redraw(graph) {
    graphData.lines.clear();

    for (const link of graph.links) {
      drawLine(graphData.lines, link, appearance.linkColorScheme.colorScheme, appearance.linkAttribsToColorIndices);
    }

    if (appearance.showNodeLabels) {
      graph.nodes.forEach((n) => {
        const { node, circle, nodeLabel } = graphData.nodeMap[n.id];
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
      <SettingControl simulation={simulation} app={app} redraw={redraw} />
      <div ref={containerRef} className="container" />
    </>
  );
}
