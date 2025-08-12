import { exampleGraphJson } from "../assets/exampleGraphJSON.js";
import log from "../../logger.js";
import { joinGraphs } from "../application_service/graphCalculations.js";
import { getFileNameWithoutExtension, parseGraphFile } from "../other/parseFiles.js";
import { addGraphDB, addGraphIfNotExistsDB, fromAllGetGraphNameDB, getGraphDB, removeGraphByNameDB } from "../repository/repoGraphs.js";

export async function setInitGraph(setGraphData) {
  const graph = JSON.parse(exampleGraphJson.content);
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

export async function removeActiveGraph(filename, activeGraphNames, setGraphData) {
  let stillActiveFileNames = activeGraphNames?.filter((name) => name !== filename);
  if (stillActiveFileNames.length === 0) stillActiveFileNames = [exampleGraphJson.name];
  try {
    let graphObject = await getGraphDB(stillActiveFileNames[0]);
    let combinedGraphObject = graphObject;
    for (let i = 1; i < stillActiveFileNames.length; i++) {
      graphObject = await getGraphDB(stillActiveFileNames[i]);
      combinedGraphObject = joinGraphs(combinedGraphObject, graphObject);
    }
    setGraphData("originGraph", combinedGraphObject);
    setGraphData("activeGraphNames", stillActiveFileNames);
  } catch (error) {
    log.error("the graph file doesn't exist. This shouldn't be possible");
    return;
  }
}

export async function createGraph(
  file,
  uploadedGraphNames,
  takeAbs,
  minCorrForEdge,
  minCompSizeForNode,
  maxCompSizeForNode,
  takeSpearmanCoefficient
) {
  if (uploadedGraphNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
    log.warn("Graph with this name already exists");
    throw new Error("Graph with this name already exists");
  }

  const graphObject = await parseGraphFile(file, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient);
  addGraphDB(graphObject);

  return graphObject;
}

export async function deleteGraph(uploadedGraphNames, filename, setGraphData) {
  const updatedGraphNames = uploadedGraphNames?.filter((name) => name !== filename);
  setGraphData("uploadedGraphNames", updatedGraphNames);
  removeGraphByNameDB(filename);
}
