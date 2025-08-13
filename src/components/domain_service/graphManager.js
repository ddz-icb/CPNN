import { exampleGraphJson } from "../assets/exampleGraphJSON.js";
import log from "../../logger.js";
import { joinGraphs } from "../application_service/graphCalculations.js";
import { getFileNameWithoutExtension, parseGraphFile } from "../other/parseFiles.js";
import { addGraphDB, addGraphIfNotExistsDB, fromAllGetGraphNameDB, getGraphDB, removeGraphByNameDB } from "../repository/graphRepo.js";

export async function setInitGraph(setGraphData) {
  const graph = JSON.parse(exampleGraphJson.data);
  addGraphIfNotExistsDB(exampleGraphJson);
  setGraphData("originGraph", graph);
  setGraphData("activeGraphNames", [exampleGraphJson.name]);
}

export async function loadGraphNames(setGraphData) {
  const filenames = await fromAllGetGraphNameDB();
  setGraphData("uploadedGraphNames", filenames);
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
  addGraphDB(graphObject);
  return graphObject;
}

export async function deleteGraph(uploadedGraphNames, filename) {
  const updatedGraphNames = (uploadedGraphNames ?? []).filter((name) => name !== filename);
  removeGraphByNameDB(filename);
  return updatedGraphNames;
}
