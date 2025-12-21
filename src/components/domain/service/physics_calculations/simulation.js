import * as d3 from "d3";
import { forceSimulation, forceLink } from "d3-force-3d";
import { getLinkDistance } from "./physicsGraph.js";
import { redraw3D } from "../canvas_drawing/render3D.js";
import { redraw } from "../canvas_drawing/render2D.js";
import { createFrameScheduler } from "../utils/frameScheduler.js";

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
  grid3D,
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
    grid3D,
    app,
    container,
    cameraRef,
    threeD
  );

  simulation
    .on("end", () => drawFunc())
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
  grid3D,
  app,
  container,
  cameraRef,
  threeD
) {
  const drawImmediate = threeD
    ? () =>
        redraw3D(graphData, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, showNodeLabels, nodeMap, grid3D, app, container, cameraRef.current)
    : () => redraw(graphData, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, showNodeLabels, nodeMap, app);

  const scheduleDraw = createFrameScheduler(drawImmediate);

  // expose the redraw function so interactions (e.g. zooming) can trigger re-projection without relying on simulation ticks
  if (threeD && cameraRef?.current) {
    cameraRef.current.redraw = drawImmediate;
  }

  simulation.on("tick.redraw", scheduleDraw);

  return drawImmediate;
}
