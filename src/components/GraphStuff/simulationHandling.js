import { returnComponentData, returnAdjacentData } from "./graphCalculations.js";
import { circularLayout } from "./graphPhysics.js";

export function simCircularLayout(graphCurrent, simulation) {
  const [componentArray, componentSizeArray] = returnComponentData(graphCurrent);
  const adjacentCountMap = returnAdjacentData(graphCurrent);
  const minCircleSize = 6;

  simulation.force("circleLayout", circularLayout(componentArray, adjacentCountMap, minCircleSize));
  simulation.alpha(1).restart();
}
