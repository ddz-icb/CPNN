import { exampleGraphJson } from "../../demodata/exampleGraphJSON.js";
import log from "../../logger.js";
import { joinGraphs } from "../GraphStuff/graphCalculations.js";
import { applyTheme, defaultColorSchemes, lightTheme } from "./appearance.js";
import { addGraphFileDB, addGraphFileIfNotExistsDB, fromAllGetGraphNameDB, getGraphDB, removeGraphFileByNameDB } from "./dbGraphs.js";
import { addMappingFileDB, fromAllGetMappingNameDB, getMappingDB, removeMappingFileByNameDB } from "./dbMappings.js";
import { parseAnnotationMappingFile, parseColorSchemeFile, parseGraphFile } from "./parseFiles.js";

export async function selectGraph(filename, setGraphData) {
  const { graph, file } = await getGraphDB(filename);

  setGraphData("originGraph", graph);
  setGraphData("activeGraphFileNames", [file.name]);
  log.info("Graph Loaded Successfully:", graph);
}

export async function selectMapping(mappingName, setGraphData) {
  const { mapping, file } = await getMappingDB(mappingName);

  setGraphData("activeAnnotationMapping", mapping);
  setGraphData("uploadedAnnotationMappingNames", [file.name]);
  log.info("Mapping Loaded Successfully:", mapping);
}

export function removeColorScheme(colorSchemes, setColorSchemes, colorSchemeName, nodeColorScheme, linkColorScheme, setSettings) {
  let updatedColorSchemes = colorSchemes?.filter((colorScheme) => colorScheme.name !== colorSchemeName);

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

export async function addNewGraphFile(file, uploadedGraphFileNames, setGraphData, takeAbs, minCorrForEdge, minCompSizeForNode) {
  const graphFile = await parseGraphFile(file, takeAbs, minCorrForEdge, minCompSizeForNode);
  addGraphFileDB(graphFile);
  setGraphData("uploadedGraphFileNames", [...(uploadedGraphFileNames || []), file.name]);
}

export async function addNewColorScheme(file, setColorSchemes) {
  const colorScheme = await parseColorSchemeFile(file);
  setColorSchemes((colorSchemes) => [...colorSchemes, { name: file.name, colorScheme: colorScheme }]);
}

export async function addNewAnnotationMappingFile(file, uploadedAnnotationMappingNames, setGraphData) {
  const mappingFile = await parseAnnotationMappingFile(file);
  addMappingFileDB(mappingFile);
  setGraphData("uploadedAnnotationMappingNames", [...(uploadedAnnotationMappingNames || []), file.name]);
}

export function deleteAnnotationMapping(uploadedAnnotationMappingNames, mappingName, setGraphData) {
  const updatedMappingNames = uploadedAnnotationMappingNames?.filter((name) => name !== mappingName);
  setGraphData("uploadedAnnotationMappingNames", updatedMappingNames);
  removeMappingFileByNameDB(mappingName);
}

export async function deleteGraphFile(uploadedGraphFileNames, filename, setGraphData) {
  const updatedGraphFileNames = uploadedGraphFileNames?.filter((name) => {
    return name !== filename;
  });

  setGraphData("uploadedGraphFileNames", updatedGraphFileNames);
  removeGraphFileByNameDB(filename);
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

export async function loadGraphFileNames(setGraphData) {
  const filenames = await fromAllGetGraphNameDB();
  setGraphData("uploadedGraphFileNames", filenames);
}

export function loadTheme(setSettings) {
  let storedTheme = localStorage.getItem("theme");

  log.info("Stored Theme:", storedTheme);

  if (storedTheme) {
    try {
      storedTheme = JSON.parse(storedTheme);
    } catch (error) {
      log.error("Fehler beim Parsen des gespeicherten Themes:", error);
      storedTheme = lightTheme;
      localStorage.setItem("theme", JSON.stringify(lightTheme));
    }
  } else {
    storedTheme = lightTheme;
    localStorage.setItem("theme", JSON.stringify(lightTheme));
  }
  applyTheme(document, storedTheme);
  setSettings("appearance.theme", storedTheme);
}

export function storeTheme(theme) {
  let storedTheme = localStorage.getItem("theme");

  if (storedTheme) {
    try {
      storedTheme = JSON.parse(storedTheme);
      if (theme.name === storedTheme.name) return;
    } catch (error) {
      log.error("Error parsing stored theme:", error);
    }
  }

  log.info("Storing theme:", theme);
  localStorage.setItem("theme", JSON.stringify(theme));
}

export async function loadAnnotationMappings(setGraphData) {
  const mappings = await fromAllGetMappingNameDB();
  setGraphData("uploadedAnnotationMappingNames", mappings);
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
