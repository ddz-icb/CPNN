import { exampleGraphJson } from "../../demographs/exampleGraphJSON.js";
import log from "../../logger.js";
import { joinGraphs } from "../GraphStuff/graphCalculations.js";
import { applyTheme, defaultColorSchemes, lightTheme } from "./appearance.js";
import { addFileDB, fromAllGetNameDB, getByNameDB, getGraphDB, removeFileByNameDB } from "./db.js";
import { parseAnnotationMapping, parseColorScheme, parseGraphFile } from "./parseFiles.js";

export async function selectGraph(filename, setGraph, setActiveFiles) {
  const { graph, file } = await getGraphDB(filename);

  setGraph(graph);
  setActiveFiles([file]);
  log.info("Graph Loaded Successfully:", graph);
}

export function selectMapping(mapping, activeAnnotationMapping, setActiveAnnotationMapping) {
  if (mapping !== activeAnnotationMapping) {
    setActiveAnnotationMapping(mapping);
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

export async function addNewGraphFile(file, setUploadedGraphNames, takeAbs) {
  const graphFile = await parseGraphFile(file, takeAbs);
  addFileDB(graphFile);
  setUploadedGraphNames((uploadedGraphNames) => [...uploadedGraphNames, file.name]);
}

export async function addNewColorScheme(file, setColorSchemes) {
  const colorScheme = await parseColorScheme(file);
  setColorSchemes((colorSchemes) => [...colorSchemes, { name: file.name, colorScheme: colorScheme }]);
}

export async function addAnnotationMapping(file, setUploadedAnnotationMappings) {
  const mapping = await parseAnnotationMapping(file);
  setUploadedAnnotationMappings((uploadedAnnotationMappings) => (uploadedAnnotationMappings ? [...uploadedAnnotationMappings, mapping] : [mapping]));
}

export function deleteAnnotationMapping(uploadedAnnotationMappings, mappingName, setUploadedAnnotationMappings) {
  const updatedMappings = uploadedAnnotationMappings.filter((mapping) => mapping.name !== mappingName);
  setUploadedAnnotationMappings(updatedMappings);
}

export async function deleteGraphFile(uploadedGraphNames, filename, setUploadedGraphNames) {
  const updatedFileNames = uploadedGraphNames.filter((name) => {
    return name !== filename;
  });

  setUploadedGraphNames(updatedFileNames);
  removeFileByNameDB(filename);
}

export async function removeActiveGraphFile(file, activeFiles, setGraph, setActiveFiles) {
  let stillActive = activeFiles.filter((f) => f.name !== file.name);
  if (stillActive.length === 0) stillActive = [exampleGraphJson];

  // no error handling since these graphs were previously active already
  let graph = JSON.parse(stillActive[0].content);
  for (let i = 1; i < stillActive.length; i++) {
    const newGraph = JSON.parse(stillActive[i].content);
    graph = joinGraphs(graph, newGraph);
  }

  setGraph(graph);
  setActiveFiles(stillActive);
}

export async function addActiveGraphFile(filename, setGraph, setActiveFiles, oldGraph) {
  const { graph, file } = await getGraphDB(filename);
  const combinedGraph = joinGraphs(oldGraph, graph);
  setGraph(combinedGraph);
  setActiveFiles((activeFiles) => [...activeFiles, file]);
}

export async function setInitGraph(setGraph, setActiveFiles) {
  const graph = JSON.parse(exampleGraphJson.content);
  setGraph(graph);
  setActiveFiles([exampleGraphJson]);
}

export async function loadFileNames(setUploadedGraphNames) {
  const filenames = await fromAllGetNameDB();
  setUploadedGraphNames(filenames);
}

export function loadTheme(setSettings) {
  const storedTheme = JSON.parse(localStorage.getItem("theme")) || lightTheme;
  applyTheme(document, storedTheme);
  setSettings("appearance.theme", storedTheme);
}

export function storeTheme(theme) {
  localStorage.setItem("theme", JSON.stringify(theme));
}

export function loadAnnotationMappings(setUploadedAnnotationMappings) {
  let mappings = JSON.parse(localStorage.getItem("mappings")) || [];
  if (mappings.length === 0) mappings = null;
  setUploadedAnnotationMappings(mappings);
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
