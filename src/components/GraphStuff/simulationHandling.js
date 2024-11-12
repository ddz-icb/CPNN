import { returnComponentData, returnAdjacentData } from "./graphCalculations";
import { circularLayout } from "./graphPhysics";

export function simCircularLayout(graphCurrent, simulation) {
  const [componentArray, componentSizeArray] = returnComponentData(graphCurrent);
  const adjacentCountMap = returnAdjacentData(graphCurrent);

  simulation.force("circleLayout", circularLayout(componentArray, adjacentCountMap, 6));
  simulation.alpha(1).restart();
}
