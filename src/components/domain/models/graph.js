import { createGraphDB, deleteGraphDB, getAllGraphNamesDB, getGraphDB } from "../../repository/graphRepo.js";
import { parseGraphFile } from "../service/parsing/graphParsing.js";

export async function loadGraphNames() {
  const graphNames = await getAllGraphNamesDB();
  return graphNames;
}

export async function getGraph(filename) {
  const graph = await getGraphDB(filename);
  return graph;
}

export async function createGraph(file, createGraphSettings) {
  const graph = await parseGraphFile(file, createGraphSettings);
  await createGraphDB(graph);
  return graph;
}

export async function deleteGraph(filename) {
  await deleteGraphDB(filename);
}
