import log from "../../logger.js";
import { defaultColorSchemes } from "./appearance.js";
import { addFileDB, getByNameDB } from "./db.js";
import { readGraphFile } from "./parseFiles.js";

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
  const graphFile = await readGraphFile(file, takeAbs);
  addFileDB(graphFile);
  setUploadedGraphNames((uploadedGraphNames) => [...uploadedGraphNames, file.name]);
}
