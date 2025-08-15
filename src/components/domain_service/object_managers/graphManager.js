import { createGraphDB, deleteGraphDB, getAllGraphNamesDB, getGraphDB } from "../../repository/graphRepo.js";
import { parseGraphFile } from "../parsing/graphParser.js";

export async function loadGraphNames() {
  const graphNames = await getAllGraphNamesDB();
  return graphNames;
}

export async function getGraph(filename) {
  const graph = await getGraphDB(filename);
  return graph;
}

export async function createGraph(file, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient) {
  const graph = await parseGraphFile(file, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient);
  await createGraphDB(graph);
  return graph;
}

export async function deleteGraph(filename) {
  await deleteGraphDB(filename);
}
