import { exampleGraphJson } from "../assets/exampleGraphJSON.js";
import log from "../../logger.js";
import { joinGraphs } from "../application_service/graphCalculations.js";
import { getFileNameWithoutExtension, parseGraphFile } from "../other/parseFiles.js";
import { addGraphFileDB, addGraphFileIfNotExistsDB, fromAllGetGraphNameDB, getGraphDB, removeGraphFileByNameDB } from "../repository/repoGraphs.js";

export async function setInitGraph(setGraphData) {
  const graph = JSON.parse(exampleGraphJson.content);
  addGraphFileIfNotExistsDB(exampleGraphJson);
  setGraphData("originGraph", graph);
  setGraphData("activeGraphNames", [exampleGraphJson.name]);
}

export async function loadGraphNames(setGraphData) {
  const filenames = await fromAllGetGraphNameDB();
  setGraphData("uploadedGraphNames", filenames);
}

export async function selectGraph(filename, setGraphData) {
  const { graph, file } = await getGraphDB(filename);

  setGraphData("originGraph", graph);
  setGraphData("activeGraphNames", [file.name]);
  log.info("Graph Loaded Successfully:", graph);
}

export async function addActiveGraph(filename, activeGraphNames, setGraphData, oldGraph) {
  const { graph, file } = await getGraphDB(filename);
  const combinedGraph = joinGraphs(oldGraph, graph);
  setGraphData("originGraph", combinedGraph);
  setGraphData("activeGraphNames", [...activeGraphNames, filename]);
}

export async function removeActiveGraph(filename, activeGraphNames, setGraphData) {
  let stillActiveFileNames = activeGraphNames?.filter((name) => name !== filename);
  if (stillActiveFileNames.length === 0) stillActiveFileNames = [exampleGraphJson.name];
  try {
    let { graph, file } = await getGraphDB(stillActiveFileNames[0]);
    let combinedGraph = graph;
    for (let i = 1; i < stillActiveFileNames.length; i++) {
      let { graph, file } = await getGraphDB(stillActiveFileNames[i]);
      combinedGraph = joinGraphs(combinedGraph, graph);
    }
    setGraphData("originGraph", combinedGraph);
    setGraphData("activeGraphNames", stillActiveFileNames);
  } catch (error) {
    log.error("the graph file doesn't exist. This shouldn't be possible");
    return;
  }
}

export async function createGraph(
  file,
  uploadedGraphNames,
  setGraphData,
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

  const graphFile = await parseGraphFile(file, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient);
  addGraphFileDB(graphFile);
  setGraphData("uploadedGraphNames", [...(uploadedGraphNames || []), file.name]);
}

export async function deleteGraph(uploadedGraphNames, filename, setGraphData) {
  const updatedGraphFileNames = uploadedGraphNames?.filter((name) => name !== filename);
  setGraphData("uploadedGraphNames", updatedGraphFileNames);
  removeGraphFileByNameDB(filename);
}
