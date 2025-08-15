import * as d3 from "d3";
import { accuracyBarnesHut, maxDistanceChargeForce, nodeRepulsionMultiplier } from "./physicsGraph.js";

export function getSimulation(width, height, linkLength, xStrength, yStrength, nodeRepulsionStrength) {
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
    .force("x", d3.forceX(width / 2).strength(xStrength))
    .force("y", d3.forceY(height / 2).strength(yStrength))
    .alphaMin(0.05);

  simulation.randomSource();
  return simulation;
}
