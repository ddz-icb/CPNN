import * as d3 from "d3";
import { getLinkDistance } from "./physicsGraph.js";

export function getSimulation(linkLength) {
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
