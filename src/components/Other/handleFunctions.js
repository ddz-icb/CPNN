import { exampleGraphJson } from "../../demographs/exampleGraphJSON.js";
import log from "../../logger.js";
import { joinGraphs } from "../GraphStuff/graphCalculations.js";
import { defaultColorSchemes } from "./appearance.js";
import { addFileDB, getByNameDB } from "./db.js";
import { parseAnnotationMapping, parseColorScheme, parseGraphFile } from "./parseFiles.js";

export async function selectGraph(filename, setGraph, setActiveFiles) {
  const file = await getByNameDB(filename);
  if (!file || !file.content) throw new Error(`No file found with the name ${filename}.`);

  const graph = JSON.parse(file.content);
  if (!graph) throw new Error("File format not recognized");

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

export function removeColorScheme(
  colorSchemes,
  colorSchemeName,
  setNodeColorScheme,
  setLinkColorScheme,
  setColorSchemes,
  nodeColorScheme,
  linkColorScheme
) {
  let updatedColorSchemes = colorSchemes.filter((colorScheme) => colorScheme.name !== colorSchemeName);

  if (updatedColorSchemes.length === 0) {
    updatedColorSchemes = defaultColorSchemes;
  }

  if (nodeColorScheme.name === colorSchemeName) {
    setNodeColorScheme(updatedColorSchemes[0]);
  }

  if (linkColorScheme.name === colorSchemeName) {
    setLinkColorScheme(updatedColorSchemes[0]);
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

export async function deleteGraphFile(uploadedGraphNames, filename, setUploadedGraphNames, removeFileByNameDB) {
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
