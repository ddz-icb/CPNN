import "../../index.css";
import log from "../../logger.js";
import * as PIXI from "pixi.js";
import { useRef, useEffect, useState } from "react";
import { cloneDeep } from "lodash";

import { handleResize, initDragAndZoom } from "../Other/interactiveCanvas.js";
import { initTooltips, Tooltips } from "../Other/toolTipCanvas.js";
import { radius, drawCircle, drawLine } from "../Other/draw.js";
import { getSimulation } from "./graphPhysics.js";
import { useSettings } from "../../states.js";
import { SettingControl } from "./settingControl.js";

export function ForceGraph({ graphCurrent, reset, setReset, setError, setGraphCurrent, activeAnnotationMapping }) {
  const { settings, setSettings } = useSettings();

  const containerRef = useRef(null);

  const [height, setHeight] = useState(null);
  const [width, setWidth] = useState(null);

  const [app, setApp] = useState(null);
  const [simulation, setSimulation] = useState(null);

  // these indicate whether allLinks or allNodes respectfully are already stored
  const [linksStored, setLinksStored] = useState(false);
  const [nodesStored, setNodesStored] = useState(false);

  const [filteredAfterStart, setFilteredAfterStart] = useState(false);

  // these variables contain the default values for the nodes
  const [allLinks, setAllLinks] = useState(null);
  const [allNodes, setAllNodes] = useState(null);

  // mapping from circles to nodes
  const [circleNodeMap, setCircleNodeMap] = useState(null);

  // these are the PIXI containers for drawing
  const [circles, setCircles] = useState(null);
  const [lines, setLines] = useState(null);

  // tooltip stuff
  const [isClickTooltipActive, setIsClickTooltipActive] = useState(false);
  const [clickTooltipData, setClickTooltipData] = useState(null);
  const [isHoverTooltipActive, setIsHoverTooltipActive] = useState(false);
  const [hoverTooltipData, setHoverTooltipData] = useState(null);

  // reset simulation //
  useEffect(() => {
    if (!reset) return;
    log.info("Resetting simulation");

    setReset(null);

    setCircles(null);
    setLines(null);

    setLinksStored(false);
    setNodesStored(false);

    setAllLinks(null);
    setAllNodes(null);

    setFilteredAfterStart(false);

    setIsClickTooltipActive(false);
    setClickTooltipData(null);
    setIsHoverTooltipActive(false);
    setHoverTooltipData(null);

    if (simulation) {
      simulation.stop();
      setSimulation(null);
    }

    if (app) {
      app.stage.removeChildren();
      containerRef.current.appendChild(app.canvas);
    }
  }, [reset]);

  // init Pixi //
  useEffect(() => {
    if (!containerRef.current || app || !graphCurrent) return;
    log.info("Init PIXI app");

    const containerRect = containerRef.current.getBoundingClientRect();
    const height = containerRect.height;
    const width = containerRect.width;
    setHeight(height);
    setWidth(width);

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
  }, [containerRef, graphCurrent]);

  // set stage //
  useEffect(() => {
    if (!app || !graphCurrent || circles || !width || !height || !settings.appearance.theme || !settings.appearance.nodeColorScheme) return;
    log.info("Setting stage");

    const newLines = new PIXI.Graphics();
    const newCircles = new PIXI.Container();
    app.stage.addChild(newLines);
    app.stage.addChild(newCircles);

    const offsetSpawnValue = graphCurrent.nodes.length * 10;
    const circleNodeMap = {};
    for (const node of graphCurrent.nodes) {
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
      circle.x = width / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
      circle.y = height / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
      initTooltips(circle, node, setIsHoverTooltipActive, setHoverTooltipData, setIsClickTooltipActive, setClickTooltipData);
      newCircles.addChild(circle);
      circleNodeMap[node.id] = { node, circle };
    }
    setLines(newLines);
    setCircles(newCircles);

    setCircleNodeMap(circleNodeMap);
  }, [app, graphCurrent]);

  // init simulation //
  useEffect(() => {
    if (!app || !graphCurrent || simulation) {
      return;
    }
    log.info("Init simulation");

    const newSimulation = getSimulation(
      width,
      height,
      settings.physics.linkLength,
      settings.physics.xStrength,
      settings.physics.yStrength,
      settings.physics.nodeRepulsionStrength
    );
    initDragAndZoom(app, newSimulation, radius, setIsClickTooltipActive, setIsHoverTooltipActive, width, height);

    setSimulation(newSimulation);
  }, [app, graphCurrent]);

  // running simulation //
  useEffect(() => {
    if (!circles || !graphCurrent || !simulation || !filteredAfterStart || !lines) return;
    log.info("Running simulation with the following graph:", graphCurrent);

    try {
      let activeCircles = circles.children.filter((circle) => circle.visible);

      simulation
        .on("tick.redraw", () => redraw(graphCurrent))
        .on("end", render)
        .nodes(activeCircles)
        .force("link")
        .links(graphCurrent.links);

      // restart the simulation and reheat if necessary to make sure everything is being rerendered correctly
      simulation.restart();
      if (simulation.alpha() <= 0.05) {
        simulation.alpha(0.1);
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
  }, [graphCurrent, circles, simulation]);

  // resize the canvas on window resize //
  useEffect(() => {
    if (app) {
      window.addEventListener("resize", () => handleResize(window, app));
    }

    return () => {
      window.removeEventListener("resize", () => handleResize(window, app));
    };
  }, [app]);

  // store all links in variable at start to enable filtering etc. //
  useEffect(() => {
    if (!graphCurrent || linksStored) return;
    log.info("saving link data", graphCurrent.links);

    // deep clone so allLinks doesn't change
    setAllLinks(cloneDeep(graphCurrent.links));
    setLinksStored(true);
  }, [graphCurrent]);

  // store all nodes in variable at start to enable filtering //
  useEffect(() => {
    if (!graphCurrent || nodesStored) return;
    log.info("saving node data", graphCurrent.nodes);

    // deep clone so allNodes doesn't change
    setAllNodes(cloneDeep(graphCurrent.nodes));
    setNodesStored(true);
  }, [graphCurrent]);

  // redraw runs while the simulation is active //
  function redraw(graph) {
    lines.clear();

    for (const link of graph.links) {
      drawLine(lines, link, settings.appearance.linkColorScheme.colorScheme, settings.appearance.linkAttribsToColorIndices);
    }

    app.renderer.render(app.stage);
  }

  // render runs when the simulation is inactive //
  function render() {
    app.renderer.render(app.stage);
  }

  return (
    <>
      <Tooltips
        isClickTooltipActive={isClickTooltipActive}
        setIsClickTooltipActive={setIsClickTooltipActive}
        clickTooltipData={clickTooltipData}
        isHoverTooltipActive={isHoverTooltipActive}
        setIsHoverTooltipActive={setIsHoverTooltipActive}
        hoverTooltipData={hoverTooltipData}
        mapping={activeAnnotationMapping}
      />
      <SettingControl
        graphCurrent={graphCurrent}
        setGraphCurrent={setGraphCurrent}
        simulation={simulation}
        app={app}
        circles={circles}
        circleNodeMap={circleNodeMap}
        redraw={redraw}
        allLinks={allLinks}
        allNodes={allNodes}
        setFilteredAfterStart={setFilteredAfterStart}
        width={width}
        height={height}
      />
      <div ref={containerRef} className="container" />
    </>
  );
}
