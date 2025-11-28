import * as d3 from "d3";
import { forceSimulation, forceLink } from "d3-force-3d";
import { getLinkDistance } from "./physicsGraph.js";
import { redraw3D } from "../canvas_drawing/render3D.js";
import { redraw, render } from "../canvas_drawing/render2D.js";

export function getSimulation(linkLength, threeD) {
  if (threeD) {
    return getSimulation3D(linkLength);
  } else {
    return getSimulation2D(linkLength);
  }
}

function getSimulation2D(linkLength) {
  const simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3
        .forceLink()
        .id((d) => d.id)
        .distance((link) => getLinkDistance(linkLength, link))
    )
    .alphaMin(0.05);

  simulation.randomSource();
  return simulation;
}

function getSimulation3D(linkLength) {
  const simulation = forceSimulation([], 3)
    .force(
      "link",
      forceLink()
        .id((d) => d.id)
        .distance((link) => getLinkDistance(linkLength, link))
    )
    .alphaMin(0.05);

  simulation.randomSource();
  return simulation;
}

export function mountSimulation(
  simulation,
  graphData,
  lines,
  linkWidth,
  linkColorscheme,
  linkAttribsToColorIndices,
  showNodeLabels,
  nodeMap,
  app,
  container,
  cameraRef,
  threeD
) {
  const drawFunc = mountRedraw(
    simulation,
    graphData,
    lines,
    linkWidth,
    linkColorscheme,
    linkAttribsToColorIndices,
    showNodeLabels,
    nodeMap,
    app,
    container,
    cameraRef,
    threeD
  );

  simulation
    .on("end", () => render(app))
    .nodes(graphData.nodes)
    .force("link")
    .links(graphData.links);

  return drawFunc;
}

export function mountRedraw(
  simulation,
  graphData,
  lines,
  linkWidth,
  linkColorscheme,
  linkAttribsToColorIndices,
  showNodeLabels,
  nodeMap,
  app,
  container,
  cameraRef,
  threeD
) {
  const drawFunc = threeD
    ? () => redraw3D(graphData, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, showNodeLabels, nodeMap, app, container, cameraRef)
    : () => redraw(graphData, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, showNodeLabels, nodeMap, app);

  simulation.on("tick.redraw", drawFunc);

  return drawFunc;
}
