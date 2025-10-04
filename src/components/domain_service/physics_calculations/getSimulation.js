import * as d3 from "d3";

export function getSimulation(linkLength) {
  const simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3
        .forceLink()
        .id((d) => d.id)
        .distance(linkLength)
    )
    .alphaMin(0.05);

  simulation.randomSource();
  return simulation;
}
