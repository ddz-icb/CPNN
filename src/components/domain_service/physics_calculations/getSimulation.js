import * as d3 from "d3";
import { accuracyBarnesHut, maxDistanceChargeForce, nodeRepulsionMultiplier } from "./physicsGraph.js";

export function getSimulation(width, height, linkLength, gravityStrength, nodeRepulsionStrength) {
  const simulation = d3
    .forceSimulation()
    .force(
      "charge",
      d3
        .forceManyBody()
        .theta(accuracyBarnesHut)
        .distanceMax(maxDistanceChargeForce)
        .strength(nodeRepulsionStrength * nodeRepulsionMultiplier)
    )
    .force(
      "link",
      d3
        .forceLink()
        .id((d) => d.id)
        .distance(linkLength)
    )
    // .forceCenter(width / 2, height / 2).strength(gravityStrength)
    .force("x", d3.forceX(width / 2).strength(gravityStrength))
    .force("y", d3.forceY(height / 2).strength(gravityStrength))
    // .force("gravity", d3.forceCenter(width / 2, height / 2).strength(gravityStrength))
    .alphaMin(0.05);

  simulation.randomSource();
  return simulation;
}
