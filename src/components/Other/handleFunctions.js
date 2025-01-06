import { exampleGraphJson } from "../../demographs/exampleGraphJSON.js";
import log from "../../logger.js";
import { joinGraphs } from "../GraphStuff/graphCalculations.js";
import { applyTheme, defaultColorSchemes, lightTheme } from "./appearance.js";
import { addGraphFileDB, addGraphFileIfNotExistsDB, fromAllGetGraphNameDB, getGraphDB, removeGraphFileByNameDB } from "./dbGraphs.js";
import { parseAnnotationMapping, parseColorScheme, parseGraphFile } from "./parseFiles.js";

export async function selectGraph(filename, setGraphData) {
  const { graph, file } = await getGraphDB(filename);

  setGraphData("originGraph", graph);
  setGraphData("activeGraphFileNames", [file.name]);
  log.info("Graph Loaded Successfully:", graph);
}

export function selectMapping(mapping, activeAnnotationMapping, setGraphData) {
  if (mapping !== activeAnnotationMapping) {
    setGraphData("activeAnnotationMapping", mapping);
  } else {
    throw new Error("Mapping is already the current mapping");
  }
}

export function removeColorScheme(colorSchemes, setColorSchemes, colorSchemeName, nodeColorScheme, linkColorScheme, setSettings) {
  let updatedColorSchemes = colorSchemes.filter((colorScheme) => colorScheme.name !== colorSchemeName);

  if (updatedColorSchemes.length === 0) {
    updatedColorSchemes = defaultColorSchemes;
  }

  if (nodeColorScheme.name === colorSchemeName) {
    setSettings("nodeColorScheme", updatedColorSchemes[0]);
  }

  if (linkColorScheme.name === colorSchemeName) {
    setSettings("linkColorScheme", updatedColorSchemes[0]);
  }

  setColorSchemes(updatedColorSchemes);
}

export async function addNewGraphFile(file, uploadedGraphFileNames, setGraphData, takeAbs) {
  const graphFile = await parseGraphFile(file, takeAbs);
  addGraphFileDB(graphFile);
  setGraphData("uploadedGraphFileNames", [...(uploadedGraphFileNames || []), file.name]);
}

export async function addNewColorScheme(file, setColorSchemes) {
  const colorScheme = await parseColorScheme(file);
  setColorSchemes((colorSchemes) => [...colorSchemes, { name: file.name, colorScheme: colorScheme }]);
}

export async function addAnnotationMapping(file, uploadedAnnotationMappings, setGraphData) {
  const mapping = await parseAnnotationMapping(file);
  setGraphData("uploadedAnnotationMappings", uploadedAnnotationMappings ? [...uploadedAnnotationMappings, mapping] : [mapping]);
}

export function deleteAnnotationMapping(uploadedAnnotationMappings, mappingName, setGraphData) {
  const updatedMappings = uploadedAnnotationMappings.filter((mapping) => mapping.name !== mappingName);
  setGraphData("uploadedAnnotationMappings", updatedMappings);
}

export async function deleteGraphFile(uploadedGraphFileNames, filename, setGraphData) {
  const updatedGraphFileNames = uploadedGraphFileNames.filter((name) => {
    return name !== filename;
  });

  setGraphData("uploadedGraphFileNames", updatedGraphFileNames);
  removeGraphFileByNameDB(filename);
}

export async function removeActiveGraphFile(filename, activeGraphFileNames, setGraphData) {
  let stillActiveFileNames = activeGraphFileNames.filter((name) => name !== filename);
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

export async function addActiveGraphFile(filename, activeGraphFileNames, setGraphData, oldGraph) {
  const { graph, file } = await getGraphDB(filename);
  const combinedGraph = joinGraphs(oldGraph, graph);
  setGraphData("originGraph", combinedGraph);
  setGraphData("activeGraphFileNames", [...activeGraphFileNames, filename]);
}

export async function setInitGraph(setGraphData) {
  log.info("Making sure example graph is in DB");

  const graph = JSON.parse(exampleGraphJson.content);
  addGraphFileIfNotExistsDB(exampleGraphJson);
  setGraphData("originGraph", graph);
  setGraphData("activeGraphFileNames", [exampleGraphJson.name]);
}

export async function loadFileNames(setGraphData) {
  const filenames = await fromAllGetGraphNameDB();
  setGraphData("uploadedGraphFileNames", filenames);
}

export function loadTheme(setSettings) {
  const storedTheme = JSON.parse(localStorage.getItem("theme")) || lightTheme;
  applyTheme(document, storedTheme);
  setSettings("appearance.theme", storedTheme);
}

export function storeTheme(theme) {
  localStorage.setItem("theme", JSON.stringify(theme));
}

export function loadAnnotationMappings(setGraphData) {
  let mappings = JSON.parse(localStorage.getItem("mappings")) || [];
  if (mappings.length === 0) mappings = null;
  setGraphData("uploadedAnnotationMappings", mappings);
}

export function storeAnnotationMappings(uploadedAnnotationMappings) {
  localStorage.setItem("mappings", JSON.stringify(uploadedAnnotationMappings));
}

export function loadColorSchemes(setColorSchemes) {
  let storedSchemes = JSON.parse(localStorage.getItem("colorSchemes")) || [];
  if (storedSchemes.length === 0) {
    storedSchemes = defaultColorSchemes;
  }
  setColorSchemes(storedSchemes);
}

export function storeColorSchemes(colorSchemes) {
  localStorage.setItem("colorSchemes", JSON.stringify(colorSchemes));
}
