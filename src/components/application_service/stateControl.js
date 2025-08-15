import { useEffect } from "react";
import log from "../../logger.js";
import * as d3 from "d3";

import { downloadAsPDF, downloadAsPNG, downloadAsSVG, downloadGraphJson, downloadLegendPdf } from "./download.js";
import { changeCircleBorderColor, changeNodeColors, changeNodeLabelColor, radius } from "../other/draw.js";
import { lightTheme, themeInit } from "../adapters/state/appearanceState.js";
import { getAdjacentData, getComponentData, getCommunityMap } from "../domain_service/graph_calculations/graphUtils.js";
import {
  accuracyBarnesHut,
  borderCheck,
  circularLayout,
  communityForce,
  componentForce,
  maxDistanceChargeForce,
  nodeRepulsionMultiplier,
} from "../domain_service/physics_calculations/physicsGraph.js";
import { usePhysics } from "../adapters/state/physicsState.js";
import { useFilter } from "../adapters/state/filterState.js";
import { useDownload } from "../adapters/state/downloadState.js";
import { useAppearance } from "../adapters/state/appearanceState.js";
import { useContainer } from "../adapters/state/containerState.js";
import { useGraphState } from "../adapters/state/graphState.js";

import { useMappingState } from "../adapters/state/mappingState.js";
import { useColorschemeState } from "../adapters/state/colorschemeState.js";
import {
  filterActiveNodesForPixi,
  filterByLinkAttribs,
  filterByNodeAttribs,
  filterByThreshold,
  filterCompDensity,
  filterMaxCompSize,
  filterMinCompSize,
  filterMinNeighborhood,
  filterNodesExist,
} from "../domain_service/graph_calculations/filterGraph.js";
import { applyPhysics } from "../domain_service/physics_calculations/applyPhysics.js";

export function StateControl({ simulation, app, redraw }) {
  const { physics, setPhysics } = usePhysics();
  const { filter, setFilter } = useFilter();
  const { download, setDownload } = useDownload();
  const { appearance, setAppearance } = useAppearance();
  const { colorschemeState, setColorschemeState } = useColorschemeState();
  const { container, setContainer } = useContainer();
  const { graphState, setGraphState } = useGraphState();
  const { mappingState, setMappingState } = useMappingState();

  // filter nodes and links //
  useEffect(() => {
    if (
      !graphState.graph ||
      !graphState.originGraph ||
      !graphState.circles ||
      !graphState.circles.children ||
      !graphState.circles.children.length > 0 ||
      !graphState.nodeMap ||
      !graphState.graphIsPreprocessed
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

    let filteredGraphData = {
      ...graphState.graph.data,
      nodes: graphState.originGraph.data.nodes,
      links: graphState.originGraph.data.links,
    };

    filteredGraphData = filterByNodeAttribs(filteredGraphData, filter.nodeFilter);
    filteredGraphData = filterNodesExist(filteredGraphData);

    filteredGraphData = filterByThreshold(filteredGraphData, filter.linkThreshold);
    filteredGraphData = filterByLinkAttribs(filteredGraphData, filter.linkFilter);

    filteredGraphData = filterCompDensity(filteredGraphData, filter.compDensity);
    filteredGraphData = filterMinNeighborhood(filteredGraphData, filter.minNeighborhoodSize);
    filteredGraphData = filterNodesExist(filteredGraphData);

    filteredGraphData = filterMinCompSize(filteredGraphData, filter.minCompSize);
    filteredGraphData = filterMaxCompSize(filteredGraphData, filter.maxCompSize);
    filteredGraphData = filterNodesExist(filteredGraphData);

    const filteredGraph = { name: graphState.graph.name, data: filteredGraphData };

    filterActiveNodesForPixi(graphState.circles, graphState.nodeLabels, appearance.showNodeLabels, filteredGraphData, graphState.nodeMap);
    setGraphState("filteredAfterStart", true);
    setGraphState("graph", filteredGraph);
  }, [
    filter.linkThreshold,
    filter.linkFilter,
    filter.nodeFilter,
    filter.minCompSize,
    filter.maxCompSize,
    filter.compDensity,
    filter.minNeighborhoodSize,
    graphState.originGraph,
    graphState.circles,
  ]);

  useEffect(() => {
    if (!graphState.graph?.data?.physics) return;
    const physics = graphState.graph.data.physics;
    log.info("applying physics settings", physics);

    applyPhysics(physics, setPhysics);
  }, [graphState.graph?.data?.physics]);

  // enable/disable node labels
  useEffect(() => {
    if (!graphState.circles || !app) return;
    log.info("Enabling/Disabling node labels");

    if (appearance.showNodeLabels == true) {
      graphState.graph.data.nodes.forEach((n) => {
        const { nodeLabel } = graphState.nodeMap[n.id];
        nodeLabel.visible = true;
      });
      simulation.on("tick.redraw", () => redraw(graphState.graph.data));
      redraw(graphState.graph.data);
    } else {
      graphState.nodeLabels.children.forEach((label) => (label.visible = false));
      simulation.on("tick.redraw", () => redraw(graphState.graph.data));
      redraw(graphState.graph.data);
    }
  }, [appearance.showNodeLabels]);

  // download graph data as json //
  useEffect(() => {
    if (download.json != null && graphState.graph) {
      try {
        log.info("Downloading graph as JSON");
        downloadGraphJson(graphState.graph);
      } catch (error) {
        log.error("Error downloading the graph as JSON:", error);
      }
    }
  }, [download.json]);

  // download graph data as json with coordinates and physics //
  useEffect(() => {
    if (download.jsonCoordsPhysics != null && graphState.graph) {
      try {
        log.info("Downloading graph as JSON with coordinates and physics");
        downloadGraphJson(graphState.graph, graphState.nodeMap, physics);
      } catch (error) {
        log.error("Error downloading the graph as JSON with coordinates:", error);
      }
    }
  }, [download.jsonCoordsPhysics]);

  // download graph as png //
  useEffect(() => {
    if (download.png != null && graphState.graph) {
      log.info("Downloading graph as PNG");

      changeCircleBorderColor(graphState.circles, lightTheme.circleBorderColor);
      changeNodeLabelColor(graphState.nodeLabels, lightTheme.textColor);

      downloadAsPNG(app, document, graphState.graph.name);

      changeCircleBorderColor(graphState.circles, appearance.theme.circleBorderColor);
      changeNodeLabelColor(graphState.nodeLabels, appearance.theme.textColor);
    }
  }, [download.png]);

  // download graph as svg //
  useEffect(() => {
    if (download.svg != null && graphState.graph) {
      log.info("Downloading graph as SVG");

      downloadAsSVG(
        graphState.graph,
        appearance.linkWidth,
        colorschemeState.linkColorscheme.data,
        colorschemeState.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        themeInit.textColor,
        colorschemeState.nodeColorscheme.data,
        colorschemeState.nodeAttribsToColorIndices,
        graphState.nodeMap
      );
    }
  }, [download.svg]);

  // download graph as pdf //
  useEffect(() => {
    if (download.pdf != null && graphState.graph) {
      log.info("Downloading graph as PDF");

      downloadAsPDF(
        graphState.graph,
        appearance.linkWidth,
        colorschemeState.linkColorscheme.data,
        colorschemeState.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        themeInit.textColor,
        colorschemeState.nodeColorscheme.data,
        colorschemeState.nodeAttribsToColorIndices,
        graphState.nodeMap
      );
    }
  }, [download.pdf]);

  // download legend as pdf //
  useEffect(() => {
    if (download.legendPdf != null && graphState.graph) {
      log.info("Downloading legend as PDF");

      downloadLegendPdf(
        graphState.graph.name,
        colorschemeState.linkColorscheme.data,
        colorschemeState.linkAttribsToColorIndices,
        colorschemeState.nodeColorscheme.data,
        colorschemeState.nodeAttribsToColorIndices,
        mappingState.activeMapping
      );
    }
  }, [download.legendPdf]);

  // switch colors upon changing theme //
  useEffect(() => {
    if (!graphState.circles) return;
    log.info("Switching colors");

    changeCircleBorderColor(graphState.circles, appearance.theme.circleBorderColor);
    changeNodeLabelColor(graphState.nodeLabels, appearance.theme.textColor);
  }, [appearance.theme]);

  // switch node color scheme
  useEffect(() => {
    if (!graphState.circles) return;
    log.info("Changing node color scheme");

    changeNodeColors(
      graphState.circles,
      graphState.nodeMap,
      appearance.theme.circleBorderColor,
      colorschemeState.nodeColorscheme.data,
      colorschemeState.nodeAttribsToColorIndices
    );
  }, [colorschemeState.nodeColorscheme, colorschemeState.nodeAttribsToColorIndices]);

  // switch link color scheme
  useEffect(() => {
    if (!simulation || !graphState.lines) return;
    log.info("Changing link color scheme");

    simulation.on("tick.redraw", () => redraw(graphState.graph.data));
    redraw(graphState.graph.data);
  }, [colorschemeState.linkColorscheme, colorschemeState.linkAttribsToColorIndices]);

  // change link width
  useEffect(() => {
    if (!simulation || !graphState.lines) return;
    log.info("Changing link width", physics.communityForceStrength);

    simulation.on("tick.redraw", () => redraw(graphState.graph.data));
    redraw(graphState.graph.data);
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
        .forceLink(graphState.graph.data.links)
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

    const [componentArray, componentSizeArray] = getComponentData(graphState.graph.data);

    // this value can be increased to slightly increase performance
    const threshold = filter.minCompSize > 2 ? filter.minCompSize : 2;

    simulation.force("component", componentForce(componentArray, threshold).strength(physics.componentStrength));
    simulation.alpha(1).restart();
  }, [physics.componentStrength, graphState.graph]);

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

    const [componentArray, componentSizeArray] = getComponentData(graphState.graph.data);
    const adjacentCountMap = getAdjacentData(graphState.graph.data);
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

    const communityMap = getCommunityMap(graphState.graph.data);

    simulation.force("communityForce", communityForce(communityMap).strength(physics.communityForceStrength));
    simulation.alpha(1).restart();
  }, [physics.communityForceStrength]);
}
