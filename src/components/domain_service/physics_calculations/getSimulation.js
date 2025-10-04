import * as d3 from "d3";
import { accuracyBarnesHut, gravityForce, maxDistanceChargeForce, nodeRepulsionMultiplier } from "./physicsGraph.js";

export function getSimulation(width, height, linkLength, gravityStrength, nodeRepulsionStrength) {
  const simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3
        .forceLink()
        .id((d) => d.id)
        .distance(linkLength)
    )
    .force("gravity", gravityForce(width / 2, height / 2).strength(gravityStrength))
    .alphaMin(0.05);

  simulation.randomSource();
  return simulation;
}
