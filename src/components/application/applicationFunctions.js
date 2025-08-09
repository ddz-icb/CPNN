import { exampleGraphJson } from "../../demodata/exampleGraphJSON.js";
import log from "../../logger.js";
import { joinGraphs } from "../graph_domain/graphCalculations.js";
import {
  applyTheme,
  defaultColorSchemeNames,
  ibmAntiBlindness,
  ibmAntiBlindnessJson,
  lightTheme,
  manyColors,
  manyColorsJson,
  okabe_ItoAntiBlindness,
  okabe_ItoAntiBlindnessJson,
} from "../init_values/appearanceInitValues.js";
import { addGraphFileDB, addGraphFileIfNotExistsDB, fromAllGetGraphNameDB, getGraphDB, removeGraphFileByNameDB } from "../database/dbGraphs.js";
import { addMappingFileDB, fromAllGetMappingNameDB, getMappingDB, removeMappingFileByNameDB } from "../database/dbMappings.js";
import { getFileNameWithoutExtension, parseAnnotationMappingFile, parseColorSchemeFile, parseGraphFile } from "../other/parseFiles.js";
import {
  addColorSchemeFileDB,
  addColorSchemeIfNotExistsDB,
  fromAllGetColorSchemeNameDB,
  getColorSchemeDB,
  removeColorSchemeByNameDB,
} from "../database/dbColorScheme.js";

// GRAPH
////////

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

// MAPPING
//////////

export async function loadAnnotationMappings(setGraphData) {
  const mappings = await fromAllGetMappingNameDB();
  setGraphData("uploadedAnnotationMappingNames", mappings);
}

export async function selectMapping(mappingName, setGraphData) {
  const { mapping, file } = await getMappingDB(mappingName);

  setGraphData("activeAnnotationMapping", mapping);
  log.info("Mapping Loaded Successfully:", mapping);
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

// COLORSCHEME
//////////////

export async function setInitColorSchemes(appearance, setAppearance) {
  addColorSchemeIfNotExistsDB(ibmAntiBlindnessJson);
  addColorSchemeIfNotExistsDB(okabe_ItoAntiBlindnessJson);
  addColorSchemeIfNotExistsDB(manyColorsJson);

  setAppearance("linkColorScheme", ibmAntiBlindness);
  setAppearance("nodeColorScheme", manyColors);
  setAppearance("uploadedColorSchemeNames", [...new Set([...(appearance.uploadedColorSchemeNames || []), ...defaultColorSchemeNames])]);

  if (!appearance.uploadedColorSchemeNames) {
    setAppearance("uploadedColorSchemeNames", defaultColorSchemeNames);
  }
}

export async function loadColorSchemeNames(setAppearance) {
  const filenames = await fromAllGetColorSchemeNameDB();
  if (filenames.length === 0) return;

  setAppearance("uploadedColorSchemeNames", filenames);
}

export async function selectLinkColorScheme(colorSchemeName, setAppearance) {
  const { colorScheme, file } = await getColorSchemeDB(colorSchemeName);

  setAppearance("linkColorScheme", colorScheme);
  log.info("Link color scheme Loaded Successfully:", colorSchemeName);
}

export async function selectNodeColorScheme(colorSchemeName, setAppearance) {
  const { colorScheme, file } = await getColorSchemeDB(colorSchemeName);

  setAppearance("nodeColorScheme", colorScheme);
  log.info("Node color scheme Loaded Successfully:", colorScheme);
}

export async function addNewColorScheme(file, uploadedColorSchemeNames, setAppearance) {
  if (uploadedColorSchemeNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
    log.warn("Color scheme with this name already exists");
    throw new Error("Color scheme with this name already exists");
  }
  const colorSchemeFile = await parseColorSchemeFile(file);
  addColorSchemeFileDB(colorSchemeFile);
  setAppearance("uploadedColorSchemeNames", [...(uploadedColorSchemeNames || [defaultColorSchemeNames]), file.name]);
}

export function deleteColorScheme(uploadedColorSchemeNames, colorSchemeName, setAppearance) {
  const updatedColorSchemes = uploadedColorSchemeNames?.filter((name) => name !== colorSchemeName);
  setAppearance("uploadedColorSchemeNames", updatedColorSchemes);
  removeColorSchemeByNameDB(colorSchemeName);
}

// THEME
////////

export function loadTheme(setAppearance) {
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
  setAppearance("theme", storedTheme);
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
