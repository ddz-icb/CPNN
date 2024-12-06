import { useEffect } from "react";
import { useSettings } from "../../states.js";
import log from "../../logger.js";
import * as d3 from "d3";

import { downloadAsPNG, downloadAsSVG, downloadGraphJson } from "./download.js";
import { changeCircleBorderColor, changeNodeColors, radius } from "../Other/draw.js";
import { lightTheme, themeInit } from "../Other/appearance.js";
import {
  filterActiveCircles,
  filterByAttribs,
  filterByThreshold,
  filterMinCompSize,
  filterNodes,
  filterNodesExist,
  returnAdjacentData,
  returnComponentData,
} from "./graphCalculations.js";
import { borderCheck, circularLayout, componentForce, nodeRepulsionMultiplier } from "./graphPhysics.js";

export function SettingControl({
  graphCurrent,
  setGraphCurrent,
  simulation,
  app,
  circles,
  circleNodeMap,
  redraw,
  allLinks,
  allNodes,
  setFilteredAfterStart,
  width,
  height,
}) {
  const { settings, setSettings } = useSettings();

  // filter nodes and links //
  useEffect(() => {
    if (!graphCurrent || !allLinks || !circles || !allNodes) return;
    log.info(
      "Filtering nodes and links.\n    Threshold:  ",
      settings.filter.linkThreshold,
      "\n    Attributes: ",
      settings.filter.linkFilter,
      "\n    Mininum component size: ",
      settings.filter.minCompSize,
      "\n    Groups: ",
      settings.filter.nodeFilter
    );

    let filteredGraph = {
      ...graphCurrent,
      nodes: allNodes,
      links: allLinks,
    };

    filteredGraph = filterNodes(filteredGraph, settings.filter.nodeFilter);
    filteredGraph = filterNodesExist(filteredGraph);

    filteredGraph = filterByThreshold(filteredGraph, settings.filter.linkThreshold);
    filteredGraph = filterByAttribs(filteredGraph, settings.filter.linkFilter);
    filteredGraph = filterMinCompSize(filteredGraph, settings.filter.minCompSize);

    filteredGraph = filterNodesExist(filteredGraph);

    filterActiveCircles(circles, filteredGraph, circleNodeMap);
    setFilteredAfterStart(true);
    setGraphCurrent(filteredGraph);
  }, [
    settings.filter.linkThreshold,
    settings.filter.linkFilter,
    settings.filter.nodeFilter,
    settings.filter.minCompSize,
    allLinks,
    allNodes,
    circles,
  ]);

  // download graph data as json //
  useEffect(() => {
    if (settings.download.json != null && graphCurrent) {
      try {
        log.info("Downloading graph as JSON");
        downloadGraphJson(graphCurrent, "Graph.json");
      } catch (error) {
        log.error("Error downloading the graph as JSON:", error);
      }
    }
  }, [settings.download.json]);

  // download graph as png //
  useEffect(() => {
    if (settings.download.png != null && graphCurrent) {
      log.info("Downloading graph as PNG");

      changeCircleBorderColor(circles, lightTheme.circleBorderColor);

      downloadAsPNG(app, document);

      changeCircleBorderColor(circles, settings.appearance.theme.circleBorderColor);
    }
  }, [settings.download.png]);

  // download graph as svg //
  useEffect(() => {
    if (settings.download.svg != null && graphCurrent) {
      log.info("Downloading graph as SVG");

      downloadAsSVG(
        document,
        graphCurrent,
        settings.appearance.linkColorScheme,
        settings.appearance.linkAttribsToColorIndices,
        themeInit.circleBorderColor,
        settings.appearance.nodeColorScheme,
        settings.appearance.nodeAttribsToColorIndices,
        circleNodeMap
      );
    }
  }, [settings.download.svg]);

  // switch circle border color //
  useEffect(() => {
    if (!circles) return;
    log.info("Switching circle border color");

    changeCircleBorderColor(circles, settings.appearance.theme.circleBorderColor);
  }, [settings.appearance.theme]);

  // switch node color scheme
  useEffect(() => {
    if (!circles) return;
    log.info("Changing node color scheme");

    changeNodeColors(
      circles,
      circleNodeMap,
      settings.appearance.theme.circleBorderColor,
      settings.appearance.nodeColorScheme.colorScheme,
      settings.appearance.nodeAttribsToColorIndices
    );
  }, [settings.appearance.nodeColorScheme]);

  // switch link color scheme
  useEffect(() => {
    if (!circles) return;
    log.info("Changing link color scheme");

    simulation.on("tick.redraw", () => redraw(graphCurrent));
    redraw(graphCurrent);
  }, [settings.appearance.linkColorScheme]);

  // enable or disable link force //
  useEffect(() => {
    if (!simulation) return;
    if (settings.physics.linkForce === false) {
      log.info("Disabling link force");

      simulation.force("link").strength(0);
      return;
    }
    log.info("Enabling link force", settings.physics.linkLength);

    simulation.force(
      "link",
      d3
        .forceLink(graphCurrent.links)
        .id((d) => d.id)
        .distance(settings.physics.linkLength)
    );

    simulation.alpha(1).restart();
  }, [settings.physics.linkForce]);

  // change link length //
  useEffect(() => {
    if (!simulation || settings.physics.linkForce === false) return;
    log.info("changing link length", settings.physics.linkLength);

    simulation.force("link").distance(settings.physics.linkLength);
    simulation.alpha(1).restart();
  }, [settings.physics.linkLength]);

  // change X Strength //
  useEffect(() => {
    if (!simulation) return;
    if (settings.physics.xStrength === 0) {
      simulation.force("x", null);
      return;
    }
    log.info("Changing horizontal gravity", settings.physics.xStrength);

    simulation.force("x", d3.forceX(width / 2).strength(settings.physics.xStrength));
    simulation.alpha(1).restart();
  }, [settings.physics.xStrength, width, height]);

  // change Y Strength //
  useEffect(() => {
    if (!simulation) return;
    if (settings.physics.yStrength === 0) {
      simulation.force("y", null);
      return;
    }
    log.info("Changing vertical gravity", settings.physics.yStrength);

    simulation.force("y", d3.forceY(height / 2).strength(settings.physics.yStrength));
    simulation.alpha(1).restart();
  }, [settings.physics.yStrength, width, height]);

  // change component Strength //
  useEffect(() => {
    if (!simulation) return;
    if (settings.physics.componentStrength === 0) {
      simulation.force("component", null);
      return;
    }
    log.info("Determining component strength", settings.physics.componentStrength);

    const [componentArray, componentSizeArray] = returnComponentData(graphCurrent);

    // this value can be increased to slightly increase performance
    const threshold = settings.filter.minCompSize > 3 ? settings.filter.minCompSize : 3;

    simulation.force("component", componentForce(componentArray, componentSizeArray, threshold).strength(settings.physics.componentStrength));
    simulation.alpha(1).restart();
  }, [settings.physics.componentStrength, graphCurrent]);

  // change node repulsion strength //
  useEffect(() => {
    if (!simulation) return;
    if (settings.physics.nodeRepulsionStrength === 0) {
      simulation.force("charge", null);
      return;
    }
    log.info("Changing node repulsion strength", settings.physics.nodeRepulsionStrength);

    simulation.force("charge").strength(settings.physics.nodeRepulsionStrength * nodeRepulsionMultiplier);
    simulation.alpha(1).restart();
  }, [settings.physics.nodeRepulsionStrength]);

  // change graph border //
  useEffect(() => {
    if (!simulation || !width || !height) return;

    if (!settings.physics.checkBorder) {
      log.info("Disabling graph border");
      simulation.on("tick.border", null);
    } else {
      log.info("Setting graph border");
      simulation.on("tick.border", () => {
        borderCheck(circles, radius, settings.physics.borderHeight, settings.physics.borderWidth, width, height);
      });
    }
    simulation.alpha(1).restart();
  }, [settings.physics.checkBorder, settings.physics.borderHeight, settings.physics.borderWidth, width, height]);

  // enable circular layout
  useEffect(() => {
    if (!simulation) return;
    if (settings.physics.circleLayout === false) {
      log.info("Disabling circular layout");

      simulation.force("circleLayout", null);
      return;
    }

    log.info("Enabling circular layout");

    // have to disable link force for this
    setSettings("physics.linkForce", false);

    const [componentArray, componentSizeArray] = returnComponentData(graphCurrent);
    const adjacentCountMap = returnAdjacentData(graphCurrent);
    const minCircleSize = 6;

    simulation.force("circleLayout", circularLayout(componentArray, adjacentCountMap, minCircleSize));
    simulation.alpha(1).restart();
  }, [settings.physics.circleLayout, graphCurrent]);
}
