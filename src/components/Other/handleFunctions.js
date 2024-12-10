import { exampleGraphJson } from "../../demographs/exampleGraphJSON.js";
import log from "../../logger.js";
import { joinGraphs } from "../GraphStuff/graphCalculations.js";
import { applyTheme, defaultColorSchemes, lightTheme } from "./appearance.js";
import { addFileDB, fromAllGetNameDB, getGraphDB, removeFileByNameDB } from "./db.js";
import { parseAnnotationMapping, parseColorScheme, parseGraphFile } from "./parseFiles.js";

export async function selectGraph(filename, setGraphData) {
  const { graph, file } = await getGraphDB(filename);

  setGraphData("graph", graph);
  setGraphData("activeGraphFiles", [file]);
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
  addFileDB(graphFile);
  setGraphData("uploadedGraphFileNames", [...uploadedGraphFileNames, file.name]);
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
  removeFileByNameDB(filename);
}

export async function removeActiveGraphFile(file, activeFiles, setGraphData) {
  let stillActive = activeFiles.filter((f) => f.name !== file.name);
  if (stillActive.length === 0) stillActive = [exampleGraphJson];

  // no error handling since these graphs were previously active already
  let graph = JSON.parse(stillActive[0].content);
  for (let i = 1; i < stillActive.length; i++) {
    const newGraph = JSON.parse(stillActive[i].content);
    graph = joinGraphs(graph, newGraph);
  }

  setGraphData("graph", graph);
  setGraphData("activeGraphFiles", stillActive);
}

export async function addActiveGraphFile(filename, activeGraphFiles, setGraphData, oldGraph) {
  const { graph, file } = await getGraphDB(filename);
  const combinedGraph = joinGraphs(oldGraph, graph);
  setGraphData("graph", combinedGraph);
  setGraphData("activeGraphFiles", [...activeGraphFiles, file]);
}

export async function setInitGraph(setGraphData) {
  const graph = JSON.parse(exampleGraphJson.content);
  setGraphData("graph", graph);
  setGraphData("activeGraphFiles", [exampleGraphJson]);
}

export async function loadFileNames(setGraphData) {
  const filenames = await fromAllGetNameDB();
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
