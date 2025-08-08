import { useEffect } from "react";
import { useFilter, useGraphData, usePhysics, useSettings } from "../../states.js";
import log from "../../logger.js";
import * as d3 from "d3";

import {
  downloadAsPDF,
  downloadAsPNG,
  downloadAsSVG,
  downloadGraphJson,
  downloadGraphWithLegendPdf,
  downloadLegendPdf,
  downloadGraphJsonWithCoordinates,
  downloadGraphJsonWithCoordinatesPhysics,
} from "./download.js";
import { changeCircleBorderColor, changeNodeColors, changeNodeLabelColor, radius } from "../Other/draw.js";
import { lightTheme, themeInit } from "../Other/appearance.js";
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

export function SettingControl({ simulation, app, redraw }) {
  const { settings, setSettings } = useSettings();
  const { physics, setPhysics } = usePhysics();
  const { filter, setFilter } = useFilter();
  const { graphData, setGraphData } = useGraphData();

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

    filterActiveNodesForPixi(graphData.circles, graphData.nodeLabels, settings.appearance.showNodeLabels, filteredGraph, graphData.nodeMap);
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

    applyPhysics(physics, setSettings);
  }, [graphData.graph?.physics]);

  // enable/disable node labels
  useEffect(() => {
    if (!graphData.circles || !app) return;
    log.info("Enabling/Disabling node labels");

    if (settings.appearance.showNodeLabels == true) {
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
  }, [settings.appearance.showNodeLabels]);

  // download graph data as json //
  useEffect(() => {
    if (settings.download.json != null && graphData.graph) {
      try {
        log.info("Downloading graph as JSON");
        downloadGraphJson(graphData.graph, "Graph.json");
      } catch (error) {
        log.error("Error downloading the graph as JSON:", error);
      }
    }
  }, [settings.download.json]);

  // download graph data as json with coordinates //
  useEffect(() => {
    if (settings.download.jsonWithCoordinates != null && graphData.graph) {
      try {
        log.info("Downloading graph as JSON with coordinates");
        downloadGraphJsonWithCoordinates(graphData.graph, "Graph.json", graphData.nodeMap);
      } catch (error) {
        log.error("Error downloading the graph as JSON with coordinates:", error);
      }
    }
  }, [settings.download.jsonWithCoordinates]);

  // download graph data as json with coordinates and physics //
  useEffect(() => {
    if (settings.download.jsonWithCoordinatesPhysics != null && graphData.graph) {
      try {
        log.info("Downloading graph as JSON with coordinates and physics");
        downloadGraphJsonWithCoordinatesPhysics(graphData.graph, "Graph.json", graphData.nodeMap, physics);
      } catch (error) {
        log.error("Error downloading the graph as JSON with coordinates:", error);
      }
    }
  }, [settings.download.jsonWithCoordinatesPhysics]);

  // download graph as png //
  useEffect(() => {
    if (settings.download.png != null && graphData.graph) {
      log.info("Downloading graph as PNG");

      changeCircleBorderColor(graphData.circles, lightTheme.circleBorderColor);
      changeNodeLabelColor(graphData.nodeLabels, lightTheme.textColor);

      downloadAsPNG(app, document);

      changeCircleBorderColor(graphData.circles, settings.appearance.theme.circleBorderColor);
      changeNodeLabelColor(graphData.nodeLabels, settings.appearance.theme.textColor);
    }
  }, [settings.download.png]);

  // download graph as svg //
  useEffect(() => {
    if (settings.download.svg != null && graphData.graph) {
      log.info("Downloading graph as SVG");

      downloadAsSVG(
        document,
        graphData.graph,
        settings.appearance.linkColorScheme,
        settings.appearance.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        themeInit.textColor,
        settings.appearance.nodeColorScheme,
        settings.appearance.nodeAttribsToColorIndices,
        graphData.nodeMap
      );
    }
  }, [settings.download.svg]);

  // download graph as pdf //
  useEffect(() => {
    if (settings.download.pdf != null && graphData.graph) {
      log.info("Downloading graph as PDF");

      downloadAsPDF(
        graphData.graph,
        settings.appearance.linkColorScheme,
        settings.appearance.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        themeInit.textColor,
        settings.appearance.nodeColorScheme,
        settings.appearance.nodeAttribsToColorIndices,
        graphData.nodeMap
      );
    }
  }, [settings.download.pdf]);

  // download legend as pdf //
  useEffect(() => {
    if (settings.download.legendPdf != null && graphData.graph) {
      log.info("Downloading legend as PDF");

      downloadLegendPdf(
        graphData.graph,
        settings.appearance.linkColorScheme,
        settings.appearance.linkAttribsToColorIndices,
        settings.appearance.nodeColorScheme,
        settings.appearance.nodeAttribsToColorIndices,
        graphData.activeAnnotationMapping
      );
    }
  }, [settings.download.legendPdf]);

  // switch colors upon changing theme //
  useEffect(() => {
    if (!graphData.circles) return;
    log.info("Switching colors");

    changeCircleBorderColor(graphData.circles, settings.appearance.theme.circleBorderColor);
    changeNodeLabelColor(graphData.nodeLabels, settings.appearance.theme.textColor);
  }, [settings.appearance.theme]);

  // download graph and legend as pdf //
  useEffect(() => {
    if (settings.download.graphWithLegendPdf != null && graphData.graph) {
      log.info("Downloading legend as PDF");

      downloadGraphWithLegendPdf(
        graphData.graph,
        settings.appearance.linkColorScheme,
        settings.appearance.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        themeInit.textColor,
        settings.appearance.nodeColorScheme,
        settings.appearance.nodeAttribsToColorIndices,
        graphData.nodeMap,
        graphData.activeAnnotationMapping
      );
    }
  }, [settings.download.graphWithLegendPdf]);

  // switch node color scheme
  useEffect(() => {
    if (!graphData.circles) return;
    log.info("Changing node color scheme");

    changeNodeColors(
      graphData.circles,
      graphData.nodeMap,
      settings.appearance.theme.circleBorderColor,
      settings.appearance.nodeColorScheme.colorScheme,
      settings.appearance.nodeAttribsToColorIndices
    );
  }, [settings.appearance.nodeColorScheme, settings.appearance.nodeAttribsToColorIndices]);

  // switch link color scheme
  useEffect(() => {
    if (!graphData.circles) return;
    log.info("Changing link color scheme");

    simulation.on("tick.redraw", () => redraw(graphData.graph));
    redraw(graphData.graph);
  }, [settings.appearance.linkColorScheme, settings.appearance.linkAttribsToColorIndices]);

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

    simulation.force("x", d3.forceX(settings.container.width / 2).strength(physics.xStrength));
    simulation.alpha(1).restart();
  }, [physics.xStrength, settings.container.width, settings.container.height]);

  // change Y Strength //
  useEffect(() => {
    if (!simulation) return;
    if (physics.yStrength == 0) {
      simulation.alpha(1).restart();
      simulation.force("y", null);
      return;
    }
    log.info("Changing vertical gravity", physics.yStrength);

    simulation.force("y", d3.forceY(settings.container.height / 2).strength(physics.yStrength));
    simulation.alpha(1).restart();
  }, [physics.yStrength, settings.container.width, settings.container.height]);

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
    if (!simulation || !settings.container.width || !settings.container.height) return;

    if (!physics.checkBorder) {
      log.info("Disabling graph border");
      simulation.force("border", null);
    } else {
      log.info("Setting graph border");
      simulation.force("border", borderCheck(radius, physics.borderHeight, physics.borderWidth, settings.container.width, settings.container.height));
    }
    simulation.alpha(1).restart();
  }, [physics.checkBorder, physics.borderHeight, physics.borderWidth, settings.container.width, settings.container.height]);

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
