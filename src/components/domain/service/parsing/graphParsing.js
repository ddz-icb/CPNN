import log from "../../../adapters/logging/logger.js";
import { getFileAsText, getFileNameWithoutExtension, parseSVFile } from "./fileParsing.js";
import {
  filterThreshold,
  filterMergeByName,
  filterNodesExist,
  filterIgnoreNegatives,
  filterComponentSizeRange,
} from "../graph_calculations/filterGraph.js";
import {
  getCorrelationMatrixIssue,
  getCorrelationMatrixWeight,
  getTableDataIssue,
  isCorrMatrix,
  verifyGraph,
} from "../verification/graphVerification.js";
import { sortGraph } from "../graph_calculations/graphUtils.js";
import { buildGraphFromRawTable } from "../correlation/correlationService.js";

const supportedSeparatedFileExtensions = new Set(["csv", "tsv"]);
const supportedDataFormats = new Set(["json", "matrix", "tabular"]);

function normalizeIdValue(value) {
  return String(value ?? "").trim();
}

function assertUniqueIds(values, label, getPosition = (index) => `position ${index + 1}`) {
  const seen = new Map();

  values.forEach((value, index) => {
    const normalized = normalizeIdValue(value);
    if (!normalized) {
      throw new Error(`${label} at ${getPosition(index)} is empty.`);
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Duplicate ${label.toLowerCase()} '${normalized}' detected at ${getPosition(index)}. First occurrence is at ${seen.get(key)}.`);
    }
    seen.set(key, getPosition(index));
  });
}

function verifySeparatedFileStructure(parsedData) {
  if (!parsedData || !Array.isArray(parsedData.header) || !Array.isArray(parsedData.firstColumn) || !Array.isArray(parsedData.data)) {
    throw new Error("CSV/TSV file has a wrong or empty format.");
  }

  const firstHeader = normalizeIdValue(parsedData.firstHeader).toLowerCase();
  if (firstHeader !== "id") {
    const foundHeader = parsedData.firstHeader ? `'${parsedData.firstHeader}'` : "an empty value";
    throw new Error(`CSV/TSV files must use 'id' as the first column header. Found ${foundHeader} instead.`);
  }

  if (parsedData.header.length === 0) {
    throw new Error("CSV/TSV file must contain at least one data column.");
  }
  if (parsedData.firstColumn.length === 0) {
    throw new Error("CSV/TSV file must contain at least one row.");
  }

  parsedData.data.forEach((row, index) => {
    const rowNumber = parsedData.rowNumbers?.[index] ?? index + 2;
    if (!Array.isArray(row)) {
      throw new Error(`CSV/TSV row ${rowNumber} could not be read as a list of values.`);
    }
    if (row.length !== parsedData.header.length) {
      throw new Error(
        `CSV/TSV row ${rowNumber} has ${row.length} data value(s), but the header defines ${parsedData.header.length} data column(s). Check for missing or extra delimiters.`,
      );
    }
  });

  assertUniqueIds(parsedData.header, "Column ID", (index) => `column ${index + 2}`);
  assertUniqueIds(parsedData.firstColumn, "Row ID", (index) => `row ${parsedData.rowNumbers?.[index] ?? index + 2}`);
}

function verifyCorrelationMatrixIds(parsedData) {
  const { header, firstColumn } = parsedData;
  if (header.length !== firstColumn.length) {
    throw new Error(`Correlation matrix must have the same number of row and column IDs. Found ${firstColumn.length} row ID(s) and ${header.length} column ID(s).`);
  }

  for (let i = 0; i < header.length; i++) {
    if (normalizeIdValue(header[i]) !== normalizeIdValue(firstColumn[i])) {
      throw new Error(
        `Correlation matrix ID mismatch at row ${parsedData.rowNumbers?.[i] ?? i + 2}: row ID '${firstColumn[i]}' does not match column ${i + 2} '${header[i]}'.`,
      );
    }
  }
}

function applyFilters(graphData, settings) {
  let filteredGraph = graphData;
  filteredGraph = filterMergeByName(filteredGraph, settings.mergeByName);
  filteredGraph = filterIgnoreNegatives(filteredGraph, settings.ignoreNegatives);
  filteredGraph = filterThreshold(filteredGraph, settings.minEdgeCorr, settings.maxEdgeCorr);
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
  verifyGraph({ name: resolvedGraphName, data: graphData });

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
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON file format: ${error.message}`);
  }
}

function parseSeparatedGraphFile(fileName, content) {
  const fileExtension = getFileExtension(fileName);
  if (!supportedSeparatedFileExtensions.has(fileExtension)) {
    throw new Error("Selected data format requires a CSV or TSV file.");
  }

  const parsedData = parseSVFile(content);
  verifySeparatedFileStructure(parsedData);
  return parsedData;
}

function parseCorrelationMatrixGraph(parsedData, generatedLinkAttrib) {
  verifyCorrelationMatrixIds(parsedData);

  const matrixIssue = getCorrelationMatrixIssue(parsedData);
  if (matrixIssue) {
    throw new Error(`Selected data format is 'Correlation Matrix', but the uploaded TSV/CSV does not match matrix format. ${matrixIssue}`);
  }

  log.info("Parsing symmetrical matrix (CSV/TSV)");
  return convertCorrMatrixToGraph(parsedData, generatedLinkAttrib);
}

async function parseTabularDataGraph(parsedData, settings, generatedLinkAttrib) {
  if (isCorrMatrix(parsedData)) {
    throw new Error("Selected data format is 'Tabular Data', but the uploaded TSV/CSV looks like a correlation matrix. Select 'Correlation Matrix' instead.");
  }
  const tableIssue = getTableDataIssue(parsedData);
  if (tableIssue) {
    throw new Error(`Selected data format is 'Tabular Data', but the uploaded TSV/CSV does not match tabular format. ${tableIssue}`);
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
        weight: round2(getCorrelationMatrixWeight(data[i][j])),
        attrib: linkAttrib,
      });
    }
  }

  return graphData;
}
