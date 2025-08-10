import { exampleGraphJson } from "../assets/exampleGraphJSON.js";
import log from "../../logger.js";
import { joinGraphs } from "../application_service/graphCalculations.js";
import { getFileNameWithoutExtension, parseGraphFile } from "../other/parseFiles.js";
import { addGraphFileDB, addGraphFileIfNotExistsDB, fromAllGetGraphNameDB, getGraphDB, removeGraphFileByNameDB } from "../repository/repoGraphs.js";

export async function setInitGraph(setGraphData) {
  const graph = JSON.parse(exampleGraphJson.content);
  addGraphFileIfNotExistsDB(exampleGraphJson);
  setGraphData("originGraph", graph);
  setGraphData("activeGraphFileNames", [exampleGraphJson.name]);
}

export async function loadGraphFileNames(setGraphData) {
  const filenames = await fromAllGetGraphNameDB();
  setGraphData("uploadedGraphFileNames", filenames);
}

export async function selectGraph(filename, setGraphData) {
  const { graph, file } = await getGraphDB(filename);

  setGraphData("originGraph", graph);
  setGraphData("activeGraphFileNames", [file.name]);
  log.info("Graph Loaded Successfully:", graph);
}

export async function addActiveGraphFile(filename, activeGraphFileNames, setGraphData, oldGraph) {
  const { graph, file } = await getGraphDB(filename);
  const combinedGraph = joinGraphs(oldGraph, graph);
  setGraphData("originGraph", combinedGraph);
  setGraphData("activeGraphFileNames", [...activeGraphFileNames, filename]);
}

export async function removeActiveGraphFile(filename, activeGraphFileNames, setGraphData) {
  let stillActiveFileNames = activeGraphFileNames?.filter((name) => name !== filename);
  if (stillActiveFileNames.length === 0) stillActiveFileNames = [exampleGraphJson.name];
  try {
    let { graph, file } = await getGraphDB(stillActiveFileNames[0]);
    let combinedGraph = graph;
    for (let i = 1; i < stillActiveFileNames.length; i++) {
      let { graph, file } = await getGraphDB(stillActiveFileNames[i]);
      combinedGraph = joinGraphs(combinedGraph, graph);
    }
    setGraphData("originGraph", combinedGraph);
    setGraphData("activeGraphFileNames", stillActiveFileNames);
  } catch (error) {
    log.error("the graph file doesn't exist. This shouldn't be possible");
    return;
  }
}

export async function addNewGraphFile(
  file,
  uploadedGraphFileNames,
  setGraphData,
  takeAbs,
  minCorrForEdge,
  minCompSizeForNode,
  maxCompSizeForNode,
  takeSpearmanCoefficient
) {
  if (uploadedGraphFileNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
    log.warn("Graph with this name already exists");
    throw new Error("Graph with this name already exists");
  }

  const graphFile = await parseGraphFile(file, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient);
  addGraphFileDB(graphFile);
  setGraphData("uploadedGraphFileNames", [...(uploadedGraphFileNames || []), file.name]);
}

export async function deleteGraphFile(uploadedGraphFileNames, filename, setGraphData) {
  const updatedGraphFileNames = uploadedGraphFileNames?.filter((name) => name !== filename);
  setGraphData("uploadedGraphFileNames", updatedGraphFileNames);
  removeGraphFileByNameDB(filename);
}
