import { useEffect } from "react";
import { useGraphData, useSettings } from "../../states.js";
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
      settings.filter.linkThreshold,
      "\n    Link Attributes: ",
      settings.filter.linkFilter,
      "\n    Node Attributes: ",
      settings.filter.nodeFilter,
      "\n    Mininum component size: ",
      settings.filter.minCompSize,
      "\n    Maximum component size: ",
      settings.filter.maxCompSize,
      "\n    Minimum neighborhood size: ",
      settings.filter.minNeighborhoodSize,
      "\n    Groups: ",
      settings.filter.nodeFilter,
      "\n    Comp Density: ",
      settings.filter.compDensity
    );

    let filteredGraph = {
      ...graphData.graph,
      nodes: graphData.originGraph.nodes,
      links: graphData.originGraph.links,
    };

    filteredGraph = filterByNodeAttribs(filteredGraph, settings.filter.nodeFilter);
    filteredGraph = filterNodesExist(filteredGraph);

    filteredGraph = filterByThreshold(filteredGraph, settings.filter.linkThreshold);
    filteredGraph = filterByLinkAttribs(filteredGraph, settings.filter.linkFilter);

    filteredGraph = filterCompDensity(filteredGraph, settings.filter.compDensity);
    filteredGraph = filterMinNeighborhood(filteredGraph, settings.filter.minNeighborhoodSize);
    filteredGraph = filterNodesExist(filteredGraph);

    filteredGraph = filterMinCompSize(filteredGraph, settings.filter.minCompSize);
    filteredGraph = filterMaxCompSize(filteredGraph, settings.filter.maxCompSize);
    filteredGraph = filterNodesExist(filteredGraph);

    filterActiveNodesForPixi(graphData.circles, graphData.nodeLabels, settings.appearance.showNodeLabels, filteredGraph, graphData.nodeMap);
    setGraphData("filteredAfterStart", true);
    setGraphData("graph", filteredGraph);
  }, [
    settings.filter.linkThreshold,
    settings.filter.linkFilter,
    settings.filter.nodeFilter,
    settings.filter.minCompSize,
    settings.filter.maxCompSize,
    settings.filter.compDensity,
    settings.filter.minNeighborhoodSize,
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
        downloadGraphJsonWithCoordinatesPhysics(graphData.graph, "Graph.json", graphData.nodeMap, settings.physics);
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
    if (settings.physics.linkForce == false) {
      log.info("Disabling link force");

      simulation.force("link").strength(0);
      return;
    }
    log.info("Enabling link force", settings.physics.linkLength);

    simulation.force(
      "link",
      d3
        .forceLink(graphData.graph.links)
        .id((d) => d.id)
        .distance(settings.physics.linkLength)
    );

    setSettings("physics.circleLayout", false);

    simulation.alpha(1).restart();
  }, [settings.physics.linkForce]);

  // change link length //
  useEffect(() => {
    if (!simulation || settings.physics.linkForce == false) return;
    log.info("changing link length", settings.physics.linkLength);

    simulation.force("link").distance(settings.physics.linkLength);
    simulation.alpha(1).restart();
  }, [settings.physics.linkLength]);

  // change X Strength //
  useEffect(() => {
    if (!simulation) return;
    if (settings.physics.xStrength == 0) {
      simulation.alpha(1).restart();
      simulation.force("x", null);
      return;
    }
    log.info("Changing horizontal gravity", settings.physics.xStrength);

    simulation.force("x", d3.forceX(settings.container.width / 2).strength(settings.physics.xStrength));
    simulation.alpha(1).restart();
  }, [settings.physics.xStrength, settings.container.width, settings.container.height]);

  // change Y Strength //
  useEffect(() => {
    if (!simulation) return;
    if (settings.physics.yStrength == 0) {
      simulation.alpha(1).restart();
      simulation.force("y", null);
      return;
    }
    log.info("Changing vertical gravity", settings.physics.yStrength);

    simulation.force("y", d3.forceY(settings.container.height / 2).strength(settings.physics.yStrength));
    simulation.alpha(1).restart();
  }, [settings.physics.yStrength, settings.container.width, settings.container.height]);

  // change component Strength //
  useEffect(() => {
    if (!simulation) return;
    if (settings.physics.componentStrength == 0) {
      simulation.force("component", null);
      simulation.alpha(1).restart();
      return;
    }
    log.info("Changing component strength", settings.physics.componentStrength);

    const [componentArray, componentSizeArray] = returnComponentData(graphData.graph);

    // this value can be increased to slightly increase performance
    const threshold = settings.filter.minCompSize > 2 ? settings.filter.minCompSize : 2;

    simulation.force("component", componentForce(componentArray, componentSizeArray, threshold).strength(settings.physics.componentStrength));
    simulation.alpha(1).restart();
  }, [settings.physics.componentStrength, graphData.graph]);

  // change node repulsion strength //
  useEffect(() => {
    if (!simulation) return;
    if (settings.physics.nodeRepulsionStrength == 0) {
      simulation.force("charge", null);
      return;
    }
    log.info("Changing node repulsion strength", settings.physics.nodeRepulsionStrength);

    simulation.force(
      "charge",
      d3
        .forceManyBody()
        .theta(accuracyBarnesHut)
        .distanceMax(maxDistanceChargeForce)
        .strength(settings.physics.nodeRepulsionStrength * nodeRepulsionMultiplier)
    );
    simulation.alpha(1).restart();
  }, [settings.physics.nodeRepulsionStrength]);

  // change node repulsion strength //
  useEffect(() => {
    if (!simulation || settings.physics.nodeCollision == null) return;
    log.info("Changing node collision strength", settings.physics.nodeCollision);

    if (settings.physics.nodeCollision == false) {
      simulation.force("collision", null);
      return;
    }

    simulation.force(
      "collision",
      d3.forceCollide((d) => radius + 1)
    );
    simulation.alpha(1).restart();
  }, [settings.physics.nodeCollision]);

  // change graph border //
  useEffect(() => {
    if (!simulation || !settings.container.width || !settings.container.height) return;

    if (!settings.physics.checkBorder) {
      log.info("Disabling graph border");
      simulation.force("border", null);
    } else {
      log.info("Setting graph border");
      simulation.force(
        "border",
        borderCheck(radius, settings.physics.borderHeight, settings.physics.borderWidth, settings.container.width, settings.container.height)
      );
    }
    simulation.alpha(1).restart();
  }, [
    settings.physics.checkBorder,
    settings.physics.borderHeight,
    settings.physics.borderWidth,
    settings.container.width,
    settings.container.height,
  ]);

  // enable circular layout
  useEffect(() => {
    if (!simulation) return;
    if (settings.physics.circleLayout == false) {
      log.info("Disabling circular layout");

      // enabling link force by default
      setSettings("physics.linkForce", true);

      simulation.force("circleLayout", null);
      simulation.alpha(1).restart();
      return;
    }

    log.info("Enabling circular layout");

    // have to disable link force for this
    setSettings("physics.linkForce", false);

    const [componentArray, componentSizeArray] = returnComponentData(graphData.graph);
    const adjacentCountMap = returnAdjacentData(graphData.graph);
    const minCircleSize = 6;

    simulation.force("circleLayout", circularLayout(componentArray, adjacentCountMap, minCircleSize));
    simulation.alpha(1).restart();
  }, [settings.physics.circleLayout]);

  // enable community force
  useEffect(() => {
    if (!simulation) return;

    if (settings.physics.communityForceStrength == 0) {
      simulation.force("communityForce", null);
      simulation.alpha(1).restart();
      return;
    }

    log.info("Changing community force", settings.physics.communityForceStrength);

    const communityMap = communityDetectionLouvain(graphData.graph);

    simulation.force("communityForce", communityForce(communityMap).strength(settings.physics.communityForceStrength));
    simulation.alpha(1).restart();
  }, [settings.physics.communityForceStrength]);
}
