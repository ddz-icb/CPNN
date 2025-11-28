import {
  forceSimulation,
  forceLink,
} from "d3-force-3d";
import { getLinkDistance } from "./physicsGraph.js";

export function getSimulation3D(linkLength) {
  const simulation = forceSimulation([], 3)
    .force(
      "link",
      forceLink()
        .id(d => d.id)
        .distance(link => getLinkDistance(linkLength, link))
    )
    .alphaMin(0.05);

  simulation.randomSource();
  return simulation;
}