import log from "../../../adapters/logging/logger.js";
import { getFileAsText, getFileNameWithoutExtension, parseSVFile } from "./fileParsing.js";
import {
  filterThreshold,
  filterMergeByName,
  filterNodesExist,
  filterIgnoreNegatives,
  filterComponentSizeRange,
} from "../graph_calculations/filterGraph.js";
import { isCorrMatrix, isTableData, verifyGraph } from "../verification/graphVerification.js";
import { sortGraph } from "../graph_calculations/graphUtils.js";
import { buildGraphFromRawTable } from "../correlation/correlationService.js";

const supportedSeparatedFileExtensions = new Set(["csv", "tsv"]);
const supportedDataFormats = new Set(["json", "matrix", "tabular"]);

function applyFilters(graphData, settings) {
  let filteredGraph = graphData;
  filteredGraph = filterMergeByName(filteredGraph, settings.mergeByName);
  filteredGraph = filterIgnoreNegatives(filteredGraph, settings.ignoreNegatives);
  filteredGraph = filterThreshold(filteredGraph, settings.minEdgeCorr);
  filteredGraph = filterComponentSizeRange(filteredGraph, settings.minCompSize, settings.maxCompSize);

  return filterNodesExist(filteredGraph);
}

export async function parseGraphFile(file, settings) {
  if (!file) {
    throw new Error("No file was provided.");
  }

  const fileContent = await getFileAsText(file);
  const resolvedGraphName = resolveGraphName(file);
  const selectedDataFormat = resolveSelectedDataFormat(settings);
  let graphData = await parseGraphBySelectedFormat({
    fileName: file.name,
    content: fileContent,
    settings,
    dataFormat: selectedDataFormat,
    generatedLinkAttrib: resolvedGraphName,
  });
  graphData = applyFilters(graphData, settings);
  sortGraph(graphData);

  const graph = { name: resolvedGraphName, data: graphData };
  verifyGraph(graph);

  return graph;
}

async function parseGraphBySelectedFormat({ fileName, content, settings, dataFormat, generatedLinkAttrib }) {
  try {
    if (dataFormat === "json") {
      return parseJsonGraphFile(fileName, content);
    }

    const parsedData = parseSeparatedGraphFile(fileName, content);
    if (dataFormat === "matrix") {
      return parseCorrelationMatrixGraph(parsedData, generatedLinkAttrib);
    }
    if (dataFormat === "tabular") {
      return await parseTabularDataGraph(parsedData, settings, generatedLinkAttrib);
    }

    throw new Error(`Unsupported data format '${dataFormat}'.`);
  } catch (error) {
    log.error(`Failed to parse graph: ${error.message}`);
    throw error;
  }
}

function parseJsonGraphFile(fileName, content) {
  const fileExtension = getFileExtension(fileName);
  if (fileExtension !== "json") {
    throw new Error("Selected data format 'Listed Data (JSON)' requires a .json file.");
  }

  log.info("Parsing JSON graph");
  return JSON.parse(content);
}

function parseSeparatedGraphFile(fileName, content) {
  const fileExtension = getFileExtension(fileName);
  if (!supportedSeparatedFileExtensions.has(fileExtension)) {
    throw new Error("Selected data format requires a CSV or TSV file.");
  }

  const parsedData = parseSVFile(content);
  if (!parsedData || !parsedData.header) {
    throw new Error("CSV/TSV file has a wrong or empty format.");
  }
  return parsedData;
}

function parseCorrelationMatrixGraph(parsedData, generatedLinkAttrib) {
  if (!isCorrMatrix(parsedData)) {
    throw new Error("Selected data format is 'Correlation Matrix', but the uploaded TSV/CSV does not match matrix format.");
  }

  log.info("Parsing symmetrical matrix (CSV/TSV)");
  return convertCorrMatrixToGraph(parsedData, generatedLinkAttrib);
}

async function parseTabularDataGraph(parsedData, settings, generatedLinkAttrib) {
  if (isCorrMatrix(parsedData)) {
    throw new Error("Selected data format is 'Tabular Data', but the uploaded TSV/CSV looks like a correlation matrix.");
  }
  if (!isTableData(parsedData)) {
    throw new Error("Selected data format is 'Tabular Data', but the uploaded TSV/CSV does not match tabular format.");
  }

  log.info("Parsing tabular data (CSV/TSV)");
  return await buildGraphFromRawTable(parsedData, {
    takeSpearman: settings?.takeSpearman,
    ignoreNegatives: settings?.ignoreNegatives,
    minEdgeCorr: settings?.minEdgeCorr,
    linkAttrib: generatedLinkAttrib,
  });
}

function resolveSelectedDataFormat(settings) {
  const candidate = String(settings?.dataFormat ?? settings?.graphStructure ?? "")
    .trim()
    .toLowerCase();
  if (supportedDataFormats.has(candidate)) return candidate;

  throw new Error("Please select a data format before uploading.");
}

function getFileExtension(fileName) {
  return String(fileName).split(".").pop().toLowerCase();
}

function resolveGraphName(file) {
  return getFileNameWithoutExtension(file.name);
}

function convertCorrMatrixToGraph(fileData, linkAttrib) {
  const graphData = { nodes: [], links: [] };
  const { header, data } = fileData;

  graphData.nodes = header.map((id) => ({ id, attribs: [] }));

  const round2 = (value) => Math.round(value * 100) / 100;

  for (let i = 0; i < header.length; i++) {
    for (let j = 0; j < i; j++) {
      graphData.links.push({
        source: header[i],
        target: header[j],
        weights: [round2(data[i][j])],
        attribs: [linkAttrib],
      });
    }
  }

  return graphData;
}
