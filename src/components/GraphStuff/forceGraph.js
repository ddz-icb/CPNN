import "../../index.css";
import log from "../../logger.js";
import * as PIXI from "pixi.js";
import * as d3 from "d3";
import { useRef, useEffect, useState } from "react";
import { cloneDeep } from "lodash";

import { handleResize, initDragAndZoom } from "../Other/interactiveCanvas.js";
import { initTooltips, Tooltips } from "../Other/toolTipCanvas.js";
import { radius, changeCircleBorderColor, drawCircle, drawLine, changeNodeColors, getColor } from "../Other/draw.js";

import {
  filterByThreshold,
  filterNodesExist,
  filterMinCompSize,
  filterByAttribs,
  returnComponentData,
  deleteNode,
  filterNodes,
  filterActiveCircles,
} from "./graphCalculations.js";
import { downloadAsPNG, downloadAsSVG, downloadGraphJson } from "./download.js";
import { getSimulation, borderCheck, componentForce, nodeRepulsionMultiplier } from "./graphPhysics.js";
import { simCircularLayout } from "./simulationHandling.js";

export function ForceGraph({
  graphCurrent,
  reset,
  downloadJSON,
  downloadPNG,
  downloadSVG,
  circleBorderColor,
  setReset,
  setError,
  linkThreshold,
  setGraphCurrent,
  minCompSize,
  linkAttribs,
  checkBorder,
  borderWidth,
  borderHeight,
  linkLength,
  xStrength,
  yStrength,
  componentStrength,
  linkForce,
  setLinkForce,
  nodeRepulsionStrength,
  circleLayout,
  nodeColorScheme,
  linkColorScheme,
  theme,
  mapping,
  nodeFilter,
  groupToColorIndex,
  attribToColorIndex,
}) {
  const containerRef = useRef(null);

  const [height, setHeight] = useState(null);
  const [width, setWidth] = useState(null);

  const [app, setApp] = useState(null);
  const [simulation, setSimulation] = useState(null);

  // these indicate whether allLinks or allNodes respectfully are already stored
  const [linksStored, setLinksStored] = useState(false);
  const [nodesStored, setNodesStored] = useState(false);

  // these variables contain the default values for the nodes
  const [allLinks, setAllLinks] = useState(null);
  const [allNodes, setAllNodes] = useState(null);

  const [filteredAfterStart, setFilteredAfterStart] = useState(false);

  // these are the PIXI containers for drawing
  const [circleNodeMap, setCircleNodeMap] = useState(null);
  const [circles, setCircles] = useState(null);
  const [lines, setLines] = useState(null);

  const [nodeToDelete, setNodeToDelete] = useState(null);

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
  }, [containerRef, graphCurrent]); // preferably don't change these

  // set stage //
  useEffect(() => {
    if (!app || !graphCurrent || circles || !width || !height) return;
    log.info("Setting stage");

    const newLines = new PIXI.Graphics();
    const newCircles = new PIXI.Container();
    app.stage.addChild(newLines);
    app.stage.addChild(newCircles);

    const offsetSpawnValue = graphCurrent.nodes.length * 10;
    const circleNodeMap = {};
    for (const node of graphCurrent.nodes) {
      let circle = new PIXI.Graphics();
      circle = drawCircle(circle, node, circleBorderColor, nodeColorScheme[1], groupToColorIndex);
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

    const newSimulation = getSimulation(width, height, linkLength, xStrength, yStrength, nodeRepulsionStrength);
    initDragAndZoom(app, newSimulation, radius, setIsClickTooltipActive, setIsHoverTooltipActive, width, height);

    setSimulation(newSimulation);
  }, [app, graphCurrent, linkLength]);

  // running simulation //
  useEffect(() => {
    if (!circles || !graphCurrent || !simulation || !filteredAfterStart) return;
    log.info("Running simulation with the following graph:", graphCurrent);

    try {
      let activeCircles = circles.children.filter((circle) => circle.visible);

      simulation
        .on("tick.redraw", () => redraw(graphCurrent, linkColorScheme))
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

  // download graph data as json //
  useEffect(() => {
    if (downloadJSON != null && graphCurrent) {
      try {
        log.info("Downloading graph as JSON");
        downloadGraphJson(graphCurrent, "Graph.json");
      } catch (error) {
        log.error("Error downloading the graph as JSON:", error);
      }
    }
  }, [downloadJSON]);

  // download graph as png //
  useEffect(() => {
    if (downloadPNG != null && graphCurrent) {
      log.info("Downloading graph as PNG");

      changeCircleBorderColor(circles, "#0d3b66");

      downloadAsPNG(app, document);

      changeCircleBorderColor(circles, circleBorderColor);
    }
  }, [downloadPNG]);

  // download graph as png //
  useEffect(() => {
    if (downloadSVG != null && graphCurrent) {
      log.info("Downloading graph as SVG");

      downloadAsSVG(
        document,
        graphCurrent,
        linkColorScheme,
        attribToColorIndex,
        "#0d3b66", // the standard light theme circle border color
        nodeColorScheme,
        groupToColorIndex,
        circleNodeMap
      );
    }
  }, [downloadSVG]);

  // switch circle border color //
  useEffect(() => {
    if (!circles) return;
    log.info("Switching circle border color");

    changeCircleBorderColor(circles, circleBorderColor);
  }, [circleBorderColor]);

  // switch node color scheme
  useEffect(() => {
    if (!circles) return;
    log.info("Changing node color scheme");

    changeNodeColors(circles, circleNodeMap, circleBorderColor, nodeColorScheme[1], groupToColorIndex);
  }, [nodeColorScheme]);

  // switch link color scheme
  useEffect(() => {
    if (!circles) return;
    log.info("Changing link color scheme");

    simulation.on("tick.redraw", () => redraw(graphCurrent, linkColorScheme));
    redraw(graphCurrent, linkColorScheme);
  }, [linkColorScheme]);

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

  // filter nodes and links //
  useEffect(() => {
    if (!graphCurrent || !allLinks || !circles || !allNodes) return;
    log.info(
      "Filtering nodes and links.\n    Threshold:  ",
      linkThreshold,
      "\n    Attributes: ",
      linkAttribs,
      "\n    Mininum component size: ",
      minCompSize,
      "\n    Groups: ",
      nodeFilter
    );

    let filteredGraph = {
      ...graphCurrent,
      nodes: allNodes,
      links: allLinks,
    };

    filteredGraph = filterNodes(filteredGraph, nodeFilter);
    filteredGraph = filterNodesExist(filteredGraph);

    filteredGraph = filterByThreshold(filteredGraph, linkThreshold);
    filteredGraph = filterByAttribs(filteredGraph, linkAttribs);

    filteredGraph = filterMinCompSize(filteredGraph, minCompSize);
    filteredGraph = filterNodesExist(filteredGraph);

    filterActiveCircles(circles, filteredGraph, circleNodeMap);
    setFilteredAfterStart(true);
    setGraphCurrent(filteredGraph);
  }, [linkThreshold, linkAttribs, nodeFilter, minCompSize, allLinks, allNodes, circles]);

  // enable or disable link force //
  useEffect(() => {
    if (!simulation) return;
    if (linkForce === false) {
      log.info("Disabling link force");

      simulation.force("link").strength(0);
      return;
    }
    log.info("Enabling link force", linkLength);

    simulation.force(
      "link",
      d3
        .forceLink(graphCurrent.links)
        .id((d) => d.id)
        .distance(linkLength)
    );

    simulation.alpha(1).restart();
  }, [linkForce]);

  // change link length //
  useEffect(() => {
    if (!simulation || linkForce === false) return;
    log.info("changing link length", linkLength);

    simulation.force("link").distance(linkLength);
    simulation.alpha(1).restart();
  }, [linkLength]);

  // change X Strength //
  useEffect(() => {
    if (!simulation) return;
    if (xStrength === 0) {
      simulation.force("x", null);
      return;
    }
    log.info("Changing horizontal gravity", xStrength);

    simulation.force("x", d3.forceX(width / 2).strength(xStrength));
    simulation.alpha(1).restart();
  }, [xStrength, width, height]);

  // change Y Strength //
  useEffect(() => {
    if (!simulation) return;
    if (yStrength === 0) {
      simulation.force("y", null);
      return;
    }
    log.info("Changing vertical gravity", yStrength);

    simulation.force("y", d3.forceY(height / 2).strength(yStrength));
    simulation.alpha(1).restart();
  }, [yStrength, width, height]);

  // change component Strength //
  useEffect(() => {
    if (!simulation) return;
    if (componentStrength === 0) {
      simulation.force("component", null);
      return;
    }
    log.info("Determining component strength", componentStrength);

    const [componentArray, componentSizeArray] = returnComponentData(graphCurrent);

    // this value can be increased to slightly increase performance
    const threshold = minCompSize > 3 ? minCompSize : 3;

    simulation.force("component", componentForce(componentArray, componentSizeArray, threshold).strength(componentStrength));
    simulation.alpha(1).restart();
  }, [componentStrength, graphCurrent]);

  // change node repulsion strength //
  useEffect(() => {
    if (!simulation) return;
    if (nodeRepulsionStrength === 0) {
      simulation.force("charge", null);
      return;
    }
    log.info("Changing node repulsion strength", nodeRepulsionStrength);

    simulation.force("charge").strength(nodeRepulsionStrength * nodeRepulsionMultiplier);
    simulation.alpha(1).restart();
  }, [nodeRepulsionStrength]);

  // change graph border //
  useEffect(() => {
    if (!simulation || !width || !height) return;

    if (!checkBorder) {
      log.info("Disabling graph border");
      simulation.on("tick.border", null);
    } else {
      log.info("Setting graph border");
      simulation.on("tick.border", () => {
        borderCheck(circles, radius, borderHeight, borderWidth, width, height);
      });
    }
    simulation.alpha(1).restart();
  }, [checkBorder, borderHeight, borderWidth, width, height]);

  // enable circular layout
  useEffect(() => {
    if (!simulation) return;
    if (circleLayout === false) {
      log.info("Disabling circular layout");

      simulation.force("circleLayout", null);
      return;
    }

    log.info("Enabling circular layout");

    // have to disable link force for this
    setLinkForce(false);

    simCircularLayout(graphCurrent, simulation);
  }, [circleLayout, graphCurrent]);

  // remove node
  useEffect(() => {
    if (!nodeToDelete || !graphCurrent) return;
    log.info("Deleting node", nodeToDelete);

    let filteredGraph = {
      ...graphCurrent,
    };

    filteredGraph = deleteNode(filteredGraph, circles, nodeToDelete);

    filteredGraph = filterNodesExist(filteredGraph);

    filterActiveCircles(circles, filteredGraph, circleNodeMap);
    setGraphCurrent(filteredGraph);

    setNodeToDelete(null);
    setIsClickTooltipActive(false);
    setClickTooltipData(null);
  }, [nodeToDelete]);

  // redraw runs while the simulation is active //
  function redraw(graph, linkColorScheme) {
    lines.clear();

    for (const link of graph.links) {
      drawLine(lines, link, linkColorScheme[1], attribToColorIndex);
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
        setNodeToDelete={setNodeToDelete}
        theme={theme}
        mapping={mapping}
      />
      <div ref={containerRef} className="container" />
    </>
  );
}
