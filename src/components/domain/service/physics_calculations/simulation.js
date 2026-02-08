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
  const drawToken = (simulation.__drawToken ?? 0) + 1;
  simulation.__drawToken = drawToken;

  const isActiveDraw = () => simulation.__drawToken === drawToken;

  const drawImmediate = () => {
    if (!isActiveDraw()) return;
    if (threeD) {
      redraw3D(graphData, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, showNodeLabels, nodeMap, grid3D, app, container, cameraRef.current);
      return;
    }
    redraw(graphData, lines, linkWidth, linkColorscheme, linkAttribsToColorIndices, showNodeLabels, nodeMap, app);
  };

  if (typeof simulation?.__cancelDraw === "function") {
    simulation.__cancelDraw();
  }

  const drawScheduler = createFrameScheduler(drawImmediate);
  const drawNow = drawScheduler.flush;
  simulation.__cancelDraw = () => {
    if (simulation.__drawToken === drawToken) {
      simulation.__drawToken = drawToken + 1;
    }
    drawScheduler.cancel();
  };

  // expose the redraw function so interactions (e.g. zooming) can trigger re-projection without relying on simulation ticks
  if (threeD && cameraRef?.current) {
    cameraRef.current.redraw = drawNow;
  } else if (cameraRef?.current?.redraw) {
    cameraRef.current.redraw = null;
  }

  simulation.on("tick.redraw", drawScheduler.schedule);

  return drawNow;
}
