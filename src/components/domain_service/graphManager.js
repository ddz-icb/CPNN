import { exampleGraphJson } from "../assets/exampleGraphJSON.js";
import log from "../../logger.js";
import { joinGraphs } from "../application_service/graphCalculations.js";
import { addGraphDB, addGraphIfNotExistsDB, fromAllGetGraphNameDB, getGraphDB, removeGraphByNameDB } from "../repository/graphRepo.js";
import { parseGraphFile } from "../application_service/parsing/graphParser.js";

export async function setInitGraph() {
  const graph = JSON.parse(exampleGraphJson.data);
  await addGraphIfNotExistsDB(exampleGraphJson);
  return { name: exampleGraphJson.name, data: graph };
}

export async function loadGraphNames() {
  const graphNames = await fromAllGetGraphNameDB();
  return graphNames;
}

export async function selectGraph(filename) {
  const graphObject = await getGraphDB(filename);
  return graphObject;
}

export async function addActiveGraph(filename, oldGraph) {
  const graphObject = await getGraphDB(filename);
  const combinedGraphObject = joinGraphs(oldGraph, graphObject);
  return combinedGraphObject;
}

export async function removeActiveGraph(filename, activeGraphNames) {
  let stillActiveGraphNames = activeGraphNames?.filter((name) => name !== filename);
  if (stillActiveGraphNames.length === 0) stillActiveGraphNames = [exampleGraphJson.name];
  let graphObject = await getGraphDB(stillActiveGraphNames[0]);
  let combinedGraphObject = graphObject;
  for (let i = 1; i < stillActiveGraphNames.length; i++) {
    graphObject = await getGraphDB(stillActiveGraphNames[i]);
    combinedGraphObject = joinGraphs(combinedGraphObject, graphObject);
  }
  return { activeGraphNames: stillActiveGraphNames, graphObject: combinedGraphObject };
}

export async function createGraph(file, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient) {
  const graphObject = await parseGraphFile(file, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient);
  await addGraphDB(graphObject);
  return graphObject;
}

export async function deleteGraph(filename) {
  await removeGraphByNameDB(filename);
}
