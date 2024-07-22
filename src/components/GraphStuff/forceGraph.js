import { useRef, useEffect, useState } from "react";
import { cloneDeep } from "lodash";
import { handleResize, initDragAndZoom } from "../Other/interactiveCanvas";
import { initTooltips, Tooltips } from "../Other/toolTipCanvas";
import {
  radius,
  changeCircleBorderColor,
  drawCircle,
  drawLine,
  changeNodeColors,
  getColor,
} from "../Other/draw";
import {
  filterByThreshold,
  filterNodesExist,
  filterMinComponentSize,
  filterByAttribs,
  returnComponentData,
  deleteNode,
  returnAdjacentData,
  filterNodeGroups,
  filterActiveCircles,
  applyNodeMapping,
} from "./graphCalculations";
import { downloadAsPNG, downloadAsSVG, downloadGraphJson } from "./download";
import {
  getSimulation,
  borderCheck,
  componentForce,
  circularLayout,
  chargeStrengthMultiplier,
} from "./graphPhysics";
import * as PIXI from "pixi.js";
import "../../index.css";
import * as d3 from "d3";

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
  minComponentSize,
  linkAttribs,
  checkBorder,
  borderWidth,
  borderHeight,
  linkLength,
  xStrength,
  yStrength,
  componentStrength,
  centroidThreshold,
  linkForce,
  setLinkForce,
  chargeStrength,
  circleLayout,
  nodeColorScheme,
  linkColorScheme,
  theme,
  mapping,
  nodeGroups,
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
    console.log("Resetting simulation");

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
    console.log("Init PIXI app");

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
      console.log("PIXI Initialized successfully");
    };

    initPIXI();
  }, [containerRef, graphCurrent]); // preferably don't change these

  // set stage //
  useEffect(() => {
    if (!app || !graphCurrent || circles || !width || !height) return;
    console.log("Setting stage");

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
        circleBorderColor,
        nodeColorScheme[1],
        groupToColorIndex
      );
      circle.id = node.id;
      circle.interactive = true;
      circle.buttonMode = true;
      circle.x =
        width / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
      circle.y =
        height / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
      initTooltips(
        circle,
        node,
        setIsHoverTooltipActive,
        setHoverTooltipData,
        setIsClickTooltipActive,
        setClickTooltipData
      );
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
    console.log("Init simulation");

    const newSimulation = getSimulation(
      width,
      height,
      linkLength,
      xStrength,
      yStrength,
      chargeStrength
    );
    initDragAndZoom(
      app,
      newSimulation,
      radius,
      setIsClickTooltipActive,
      setIsHoverTooltipActive,
      width,
      height
    );

    setSimulation(newSimulation);
  }, [app, graphCurrent, linkLength]);

  // running simulation //
  useEffect(() => {
    if (!circles || !graphCurrent || !simulation || !filteredAfterStart) return;
    console.log("Running simulation with the following graph:", graphCurrent);

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
      setError(
        "Error loading graph. The graph data is most likely incorrect",
        error.message
      );
      console.error("error: ", error);

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
        console.log("Downloading graph as JSON");
        downloadGraphJson(graphCurrent, "Graph.json");
      } catch (error) {
        console.error("Error downloading the graph as JSON:", error);
      }
    }
  }, [downloadJSON]);

  // download graph as png //
  useEffect(() => {
    if (downloadPNG != null && graphCurrent) {
      console.log("Downloading graph as PNG");

      changeCircleBorderColor(circles, "#0d3b66");

      downloadAsPNG(app, document);

      changeCircleBorderColor(circles, circleBorderColor);
    }
  }, [downloadPNG]);

  // download graph as png //
  useEffect(() => {
    if (downloadSVG != null && graphCurrent) {
      console.log("Downloading graph as SVG");

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
    console.log("Switching circle border color");

    changeCircleBorderColor(circles, circleBorderColor);
  }, [circleBorderColor]);

  // switch node color scheme
  useEffect(() => {
    if (!circles) return;
    console.log("Changing node color scheme");

    changeNodeColors(
      circles,
      circleNodeMap,
      circleBorderColor,
      nodeColorScheme[1],
      groupToColorIndex
    );
  }, [nodeColorScheme]);

  // switch link color scheme
  useEffect(() => {
    if (!circles) return;
    console.log("Changing link color scheme");

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
    console.log("saving link data", graphCurrent.links);

    // deep clone so allLinks doesn't change
    setAllLinks(cloneDeep(graphCurrent.links));
    setLinksStored(true);
  }, [graphCurrent]);

  // store all nodes in variable at start to enable filtering //
  useEffect(() => {
    if (!graphCurrent || nodesStored) return;
    console.log("saving node data", graphCurrent.nodes);

    // deep clone so allNodes doesn't change
    setAllNodes(cloneDeep(graphCurrent.nodes));
    setNodesStored(true);
  }, [graphCurrent]);

  // filter nodes and links //
  useEffect(() => {
    if (!graphCurrent || !allLinks || !circles || !allNodes) return;
    console.log(
      "Filtering nodes and links.\n    Threshold:  ",
      linkThreshold,
      "\n    Attributes: ",
      linkAttribs,
      "\n    Mininum component size: ",
      minComponentSize,
      "\n    Groups: ",
      nodeGroups
    );

    let filteredGraph = {
      ...graphCurrent,
      nodes: allNodes,
      links: allLinks,
    };

    filteredGraph = filterNodeGroups(filteredGraph, nodeGroups);
    filteredGraph = filterNodesExist(filteredGraph);

    filteredGraph = filterByThreshold(filteredGraph, linkThreshold);
    filteredGraph = filterByAttribs(filteredGraph, linkAttribs);

    filteredGraph = filterMinComponentSize(filteredGraph, minComponentSize);
    filteredGraph = filterNodesExist(filteredGraph);

    filterActiveCircles(circles, filteredGraph, circleNodeMap);
    setFilteredAfterStart(true);
    setGraphCurrent(filteredGraph);
  }, [
    linkThreshold,
    linkAttribs,
    nodeGroups,
    minComponentSize,
    allLinks,
    allNodes,
    circles,
  ]);

  // enable or disable link force //
  useEffect(() => {
    if (!simulation) return;
    if (linkForce === false) {
      console.log("Disabling link force");

      simulation.force("link").strength(0);
      return;
    }
    console.log("Enabling link force", linkLength);

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
    console.log("changing link length", linkLength);

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
    console.log("Changing horizontal gravity", xStrength);

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
    console.log("Changing vertical gravity", yStrength);

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
    console.log("Determining component strength", componentStrength);

    const [componentArray, componentSizeArray] =
      returnComponentData(graphCurrent);

    const threshold =
      minComponentSize > centroidThreshold
        ? minComponentSize
        : centroidThreshold;

    simulation.force(
      "component",
      componentForce(componentArray, componentSizeArray, threshold).strength(
        componentStrength
      )
    );
    simulation.alpha(1).restart();
  }, [componentStrength, centroidThreshold, graphCurrent]);

  // change charge strength //
  useEffect(() => {
    if (!simulation) return;
    if (chargeStrength === 0) {
      simulation.force("charge", null);
      return;
    }
    console.log("Changing node repulsion strength", chargeStrength);

    simulation
      .force("charge")
      .strength(chargeStrength * chargeStrengthMultiplier);
    simulation.alpha(1).restart();
  }, [chargeStrength]);

  // change graph border //
  useEffect(() => {
    if (!simulation || !width || !height) return;

    if (!checkBorder) {
      console.log("Disabling graph border");
      simulation.on("tick.border", null);
    } else {
      console.log("Setting graph border");
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
      console.log("Disabling circular layout");

      simulation.force("circleLayout", null);
      return;
    }

    console.log("Enabling circular layout");

    // have to disable link force for this
    setLinkForce(false);

    const [componentArray, componentSizeArray] =
      returnComponentData(graphCurrent);
    const adjacentCountMap = returnAdjacentData(graphCurrent);

    simulation.force(
      "circleLayout",
      circularLayout(componentArray, adjacentCountMap, 6)
    );
    simulation.alpha(1).restart();
  }, [circleLayout]);

  // remove node
  useEffect(() => {
    if (!nodeToDelete || !graphCurrent) return;
    console.log("Deleting node", nodeToDelete);

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
