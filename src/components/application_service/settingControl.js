import { useEffect } from "react";
import log from "../../logger.js";
import * as d3 from "d3";

import { downloadAsPDF, downloadAsPNG, downloadAsSVG, downloadGraphJson, downloadLegendPdf } from "./download.js";
import { changeCircleBorderColor, changeNodeColors, changeNodeLabelColor, radius } from "../other/draw.js";
import { lightTheme, themeInit } from "../adapters/state/appearanceState.js";
import {
  filterActiveNodesForPixi,
  filterByLinkAttribs,
  filterByThreshold,
  filterMinCompSize,
  filterMaxCompSize,
  filterByNodeAttribs,
  filterNodesExist,
  returnAdjacentData,
  returnComponentData,
  filterCompDensity,
  filterMinNeighborhood,
  communityDetectionLouvain,
} from "./graphCalculations.js";
import {
  accuracyBarnesHut,
  applyPhysics,
  borderCheck,
  circularLayout,
  communityForce,
  componentForce,
  maxDistanceChargeForce,
  nodeRepulsionMultiplier,
} from "./graphPhysics.js";
import { usePhysics } from "../adapters/state/physicsState.js";
import { useFilter } from "../adapters/state/filterState.js";
import { useDownload } from "../adapters/state/downloadState.js";
import { useAppearance } from "../adapters/state/appearanceState.js";
import { useContainer } from "../adapters/state/containerState.js";
import { useGraphData } from "../adapters/state/graphState.js";
import { useMappingData } from "../adapters/state/mappingState.js";
import { useColorscheme } from "../adapters/state/colorschemeState.js";

export function SettingControl({ simulation, app, redraw }) {
  const { physics, setPhysics } = usePhysics();
  const { filter, setFilter } = useFilter();
  const { download, setDownload } = useDownload();
  const { appearance, setAppearance } = useAppearance();
  const { colorscheme, setColorscheme } = useColorscheme();
  const { container, setContainer } = useContainer();
  const { graphData, setGraphData } = useGraphData();
  const { mappingData, setMappingData } = useMappingData();

  // filter nodes and links //
  useEffect(() => {
    if (
      !graphData.graph ||
      !graphData.originGraph ||
      !graphData.originGraph.links ||
      !graphData.originGraph.nodes ||
      !graphData.circles ||
      !graphData.circles.children ||
      !graphData.circles.children.length > 0 ||
      !graphData.nodeMap ||
      !graphData.graphIsPreprocessed
    ) {
      return;
    }

    log.info(
      "Filtering nodes and links.\n    Threshold:  ",
      filter.linkThreshold,
      "\n    Link Attributes: ",
      filter.linkFilter,
      "\n    Node Attributes: ",
      filter.nodeFilter,
      "\n    Mininum component size: ",
      filter.minCompSize,
      "\n    Maximum component size: ",
      filter.maxCompSize,
      "\n    Minimum neighborhood size: ",
      filter.minNeighborhoodSize,
      "\n    Groups: ",
      filter.nodeFilter,
      "\n    Comp Density: ",
      filter.compDensity
    );

    let filteredGraph = {
      ...graphData.graph,
      nodes: graphData.originGraph.nodes,
      links: graphData.originGraph.links,
    };

    filteredGraph = filterByNodeAttribs(filteredGraph, filter.nodeFilter);
    filteredGraph = filterNodesExist(filteredGraph);

    filteredGraph = filterByThreshold(filteredGraph, filter.linkThreshold);
    filteredGraph = filterByLinkAttribs(filteredGraph, filter.linkFilter);

    filteredGraph = filterCompDensity(filteredGraph, filter.compDensity);
    filteredGraph = filterMinNeighborhood(filteredGraph, filter.minNeighborhoodSize);
    filteredGraph = filterNodesExist(filteredGraph);

    filteredGraph = filterMinCompSize(filteredGraph, filter.minCompSize);
    filteredGraph = filterMaxCompSize(filteredGraph, filter.maxCompSize);
    filteredGraph = filterNodesExist(filteredGraph);

    filterActiveNodesForPixi(graphData.circles, graphData.nodeLabels, appearance.showNodeLabels, filteredGraph, graphData.nodeMap);
    setGraphData("filteredAfterStart", true);
    setGraphData("graph", filteredGraph);
  }, [
    filter.linkThreshold,
    filter.linkFilter,
    filter.nodeFilter,
    filter.minCompSize,
    filter.maxCompSize,
    filter.compDensity,
    filter.minNeighborhoodSize,
    graphData.originGraph,
    graphData.circles,
  ]);

  useEffect(() => {
    if (!graphData.graph || !graphData.graph.physics) return;
    const physics = graphData.graph.physics;
    log.info("applying physics settings", physics);

    applyPhysics(physics, setPhysics);
  }, [graphData.graph?.physics]);

  // enable/disable node labels
  useEffect(() => {
    if (!graphData.circles || !app) return;
    log.info("Enabling/Disabling node labels");

    if (appearance.showNodeLabels == true) {
      graphData.graph.nodes.forEach((n) => {
        const { nodeLabel } = graphData.nodeMap[n.id];
        nodeLabel.visible = true;
      });
      simulation.on("tick.redraw", () => redraw(graphData.graph));
      redraw(graphData.graph);
    } else {
      graphData.nodeLabels.children.forEach((label) => (label.visible = false));
      simulation.on("tick.redraw", () => redraw(graphData.graph));
      redraw(graphData.graph);
    }
  }, [appearance.showNodeLabels]);

  // download graph data as json //
  useEffect(() => {
    if (download.json != null && graphData.graph) {
      try {
        log.info("Downloading graph as JSON");
        downloadGraphJson(graphData.graph, "Graph.json");
      } catch (error) {
        log.error("Error downloading the graph as JSON:", error);
      }
    }
  }, [download.json]);

  // download graph data as json with coordinates and physics //
  useEffect(() => {
    if (download.jsonCoordsPhysics != null && graphData.graph) {
      try {
        log.info("Downloading graph as JSON with coordinates and physics");
        downloadGraphJson(graphData.graph, "Graph.json", graphData.nodeMap, physics);
      } catch (error) {
        log.error("Error downloading the graph as JSON with coordinates:", error);
      }
    }
  }, [download.jsonCoordsPhysics]);

  // download graph as png //
  useEffect(() => {
    if (download.png != null && graphData.graph) {
      log.info("Downloading graph as PNG");

      changeCircleBorderColor(graphData.circles, lightTheme.circleBorderColor);
      changeNodeLabelColor(graphData.nodeLabels, lightTheme.textColor);

      downloadAsPNG(app, document);

      changeCircleBorderColor(graphData.circles, appearance.theme.circleBorderColor);
      changeNodeLabelColor(graphData.nodeLabels, appearance.theme.textColor);
    }
  }, [download.png]);

  // download graph as svg //
  useEffect(() => {
    if (download.svg != null && graphData.graph) {
      log.info("Downloading graph as SVG");

      downloadAsSVG(
        document,
        graphData.graph,
        appearance.linkWidth,
        colorscheme.linkColorscheme.content,
        colorscheme.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        themeInit.textColor,
        colorscheme.nodeColorscheme.content,
        colorscheme.nodeAttribsToColorIndices,
        graphData.nodeMap
      );
    }
  }, [download.svg]);

  // download graph as pdf //
  useEffect(() => {
    if (download.pdf != null && graphData.graph) {
      log.info("Downloading graph as PDF");

      downloadAsPDF(
        graphData.graph,
        appearance.linkWidth,
        colorscheme.linkColorscheme.content,
        colorscheme.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        themeInit.textColor,
        colorscheme.nodeColorscheme.content,
        colorscheme.nodeAttribsToColorIndices,
        graphData.nodeMap
      );
    }
  }, [download.pdf]);

  // download legend as pdf //
  useEffect(() => {
    if (download.legendPdf != null && graphData.graph) {
      log.info("Downloading legend as PDF");

      downloadLegendPdf(
        colorscheme.linkColorscheme.content,
        colorscheme.linkAttribsToColorIndices,
        colorscheme.nodeColorscheme.content,
        colorscheme.nodeAttribsToColorIndices,
        mappingData.activeMapping
      );
    }
  }, [download.legendPdf]);

  // switch colors upon changing theme //
  useEffect(() => {
    if (!graphData.circles) return;
    log.info("Switching colors");

    changeCircleBorderColor(graphData.circles, appearance.theme.circleBorderColor);
    changeNodeLabelColor(graphData.nodeLabels, appearance.theme.textColor);
  }, [appearance.theme]);

  // switch node color scheme
  useEffect(() => {
    if (!graphData.circles) return;
    log.info("Changing node color scheme");

    changeNodeColors(
      graphData.circles,
      graphData.nodeMap,
      appearance.theme.circleBorderColor,
      colorscheme.nodeColorscheme.content,
      colorscheme.nodeAttribsToColorIndices
    );
  }, [colorscheme.nodeColorscheme, colorscheme.nodeAttribsToColorIndices]);

  // switch link color scheme
  useEffect(() => {
    if (!simulation || !graphData.lines) return;
    log.info("Changing link color scheme");

    simulation.on("tick.redraw", () => redraw(graphData.graph));
    redraw(graphData.graph);
  }, [colorscheme.linkColorscheme, colorscheme.linkAttribsToColorIndices]);

  // change link width
  useEffect(() => {
    if (!simulation || !graphData.lines) return;
    log.info("Changing link width", physics.communityForceStrength);

    simulation.on("tick.redraw", () => redraw(graphData.graph));
    redraw(graphData.graph);
  }, [appearance.linkWidth]);

  // enable or disable link force //
  useEffect(() => {
    if (!simulation) return;
    if (physics.linkForce == false) {
      log.info("Disabling link force");

      simulation.force("link").strength(0);
      return;
    }
    log.info("Enabling link force", physics.linkLength);

    simulation.force(
      "link",
      d3
        .forceLink(graphData.graph.links)
        .id((d) => d.id)
        .distance(physics.linkLength)
    );

    setPhysics("circleLayout", false);

    simulation.alpha(1).restart();
  }, [physics.linkForce]);

  // change link length //
  useEffect(() => {
    if (!simulation || physics.linkForce == false) return;
    log.info("changing link length", physics.linkLength);

    simulation.force("link").distance(physics.linkLength);
    simulation.alpha(1).restart();
  }, [physics.linkLength]);

  // change X Strength //
  useEffect(() => {
    if (!simulation) return;
    if (physics.xStrength == 0) {
      simulation.alpha(1).restart();
      simulation.force("x", null);
      return;
    }
    log.info("Changing horizontal gravity", physics.xStrength);

    simulation.force("x", d3.forceX(container.width / 2).strength(physics.xStrength));
    simulation.alpha(1).restart();
  }, [physics.xStrength, container.width, container.height]);

  // change Y Strength //
  useEffect(() => {
    if (!simulation) return;
    if (physics.yStrength == 0) {
      simulation.alpha(1).restart();
      simulation.force("y", null);
      return;
    }
    log.info("Changing vertical gravity", physics.yStrength);

    simulation.force("y", d3.forceY(container.height / 2).strength(physics.yStrength));
    simulation.alpha(1).restart();
  }, [physics.yStrength, container.width, container.height]);

  // change component Strength //
  useEffect(() => {
    if (!simulation) return;
    if (physics.componentStrength == 0) {
      simulation.force("component", null);
      simulation.alpha(1).restart();
      return;
    }
    log.info("Changing component strength", physics.componentStrength);

    const [componentArray, componentSizeArray] = returnComponentData(graphData.graph);

    // this value can be increased to slightly increase performance
    const threshold = filter.minCompSize > 2 ? filter.minCompSize : 2;

    simulation.force("component", componentForce(componentArray, componentSizeArray, threshold).strength(physics.componentStrength));
    simulation.alpha(1).restart();
  }, [physics.componentStrength, graphData.graph]);

  // change node repulsion strength //
  useEffect(() => {
    if (!simulation) return;
    if (physics.nodeRepulsionStrength == 0) {
      simulation.force("charge", null);
      return;
    }
    log.info("Changing node repulsion strength", physics.nodeRepulsionStrength);

    simulation.force(
      "charge",
      d3
        .forceManyBody()
        .theta(accuracyBarnesHut)
        .distanceMax(maxDistanceChargeForce)
        .strength(physics.nodeRepulsionStrength * nodeRepulsionMultiplier)
    );
    simulation.alpha(1).restart();
  }, [physics.nodeRepulsionStrength]);

  // change node repulsion strength //
  useEffect(() => {
    if (!simulation || physics.nodeCollision == null) return;
    log.info("Changing node collision strength", physics.nodeCollision);

    if (physics.nodeCollision == false) {
      simulation.force("collision", null);
      return;
    }

    simulation.force(
      "collision",
      d3.forceCollide((d) => radius + 1)
    );
    simulation.alpha(1).restart();
  }, [physics.nodeCollision]);

  // change graph border //
  useEffect(() => {
    if (!simulation || !container.width || !container.height) return;

    if (!physics.checkBorder) {
      log.info("Disabling graph border");
      simulation.force("border", null);
    } else {
      log.info("Setting graph border");
      simulation.force("border", borderCheck(radius, physics.borderHeight, physics.borderWidth, container.width, container.height));
    }
    simulation.alpha(1).restart();
  }, [physics.checkBorder, physics.borderHeight, physics.borderWidth, container.width, container.height]);

  // enable circular layout
  useEffect(() => {
    if (!simulation) return;
    if (physics.circleLayout == false) {
      log.info("Disabling circular layout");

      // enabling link force by default
      setPhysics("linkForce", true);

      simulation.force("circleLayout", null);
      simulation.alpha(1).restart();
      return;
    }

    log.info("Enabling circular layout");

    // have to disable link force for this
    setPhysics("linkForce", false);

    const [componentArray, componentSizeArray] = returnComponentData(graphData.graph);
    const adjacentCountMap = returnAdjacentData(graphData.graph);
    const minCircleSize = 6;

    simulation.force("circleLayout", circularLayout(componentArray, adjacentCountMap, minCircleSize));
    simulation.alpha(1).restart();
  }, [physics.circleLayout]);

  // enable community force
  useEffect(() => {
    if (!simulation) return;

    if (physics.communityForceStrength == 0) {
      simulation.force("communityForce", null);
      simulation.alpha(1).restart();
      return;
    }

    log.info("Changing community force", physics.communityForceStrength);

    const communityMap = communityDetectionLouvain(graphData.graph);

    simulation.force("communityForce", communityForce(communityMap).strength(physics.communityForceStrength));
    simulation.alpha(1).restart();
  }, [physics.communityForceStrength]);
}
