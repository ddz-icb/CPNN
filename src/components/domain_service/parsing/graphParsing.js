import log from "../../adapters/logging/logger.js";
import Papa from "papaparse";
import axios from "axios";
import { getFileAsText } from "./fileParsing.js";
import {
  filterByThreshold,
  filterMaxCompSize,
  filterMergeProteins,
  filterMinCompSize,
  filterNodesExist,
  filterTakeAbs,
} from "../graph_calculations/filterGraph.js";
import { verifyGraph } from "../verification/graphVerification.js";

function applyFilters(graphData, settings) {
  let filteredGraph = graphData;
  filteredGraph = filterByThreshold(filteredGraph, settings.minEdgeCorr);
  filteredGraph = filterMinCompSize(filteredGraph, settings.minCompSize);
  filteredGraph = filterMaxCompSize(filteredGraph, settings.maxCompSize);
  filteredGraph = filterTakeAbs(filteredGraph, settings.takeAbs);
  filteredGraph = filterMergeProteins(filteredGraph, settings.mergeProteins);

  return filterNodesExist(filteredGraph);
}

function sortGraph(graph) {
  graph.nodes.sort((a, b) => a.id.localeCompare(b.id));
  graph.links.sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
}

////////////////////

export async function parseGraphFile(file, settings) {
  if (!file) {
    throw new Error("No file was provided.");
  }

  const fileContent = await getFileAsText(file);
  let graphData = await parseByFileType(file.name, fileContent, settings.takeSpearman);

  graphData = applyFilters(graphData, settings);

  sortGraph(graphData);

  const graph = { name: file.name, data: graphData };
  verifyGraph(graph);

  return graph;
}

export async function parseByFileType(name, content, takeSpearman) {
  const fileExtension = name.split(".").pop();
  const linkAttrib = name.split(".")[0];

  try {
    if (fileExtension === "json") {
      log.info("Parsing JSON graph");
      return JSON.parse(content);
    }

    const parsedData = parseSVFile(content);
    if (!parsedData || !parsedData.header) {
      throw new Error("CSV/TSV file has a wrong or empty format.");
    }

    if (isSymmetricMatrix(content)) {
      log.info("Parsing symmetrical matrix (csv/tsv)");
      return convertSymmetricMatrixToGraph(parsedData, linkAttrib);
    }

    if (isValidRawTableData(content)) {
      log.info("Parsing raw table data (csv/tsv)");
      const corrMatrix = await convertToCorrMatrix(parsedData, takeSpearman);
      return convertSymmetricMatrixToGraph(corrMatrix, linkAttrib);
    }

    throw new Error("File has an unknown type or format.");
  } catch (error) {
    log.error(`Failed to parse graph: ${error.message}`);
    throw error;
  }
}

function parseSVFile(content) {
  const { data } = Papa.parse(content, {
    header: false,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: "", // Auto-detect delimiter
  });

  if (!data?.length) return null;

  const header = data[0].map(String).slice(1);
  const dataRows = data.slice(1);
  const firstColumn = dataRows.map((row) => row[0]);
  const updatedData = dataRows.map((row) => row.slice(1));

  return { header, firstColumn, data: updatedData };
}

//////////////////

function convertSymmetricMatrixToGraph(fileData, linkAttrib) {
  const graphData = { nodes: [], links: [] };
  const { header, data } = fileData;

  graphData.nodes = header.map((id) => ({ id, groups: [] }));

  for (let i = 0; i < header.length; i++) {
    for (let j = 0; j < i; j++) {
      graphData.links.push({
        source: header[i],
        target: header[j],
        weights: [data[i][j]],
        attribs: [linkAttrib],
      });
    }
  }

  return graphData;
}

////////////////////////

export function isSymmetricMatrix(content) {
  const { data: rows } = Papa.parse(content, { header: false, dynamicTyping: true, skipEmptyLines: true });
  if (!rows?.length || rows[0].length !== rows.length) {
    return false;
  }
  const firstColumn = rows.map((row) => row[0]);
  const firstRow = rows[0];
  return firstColumn.every((val, i) => val === firstRow[i]);
}

/////////////////

export function isValidRawTableData(content) {
  const { data: rows } = Papa.parse(content, { header: false, dynamicTyping: true, skipEmptyLines: true });
  if (rows.length < 2) return false;

  const columnCount = rows[0].length;
  if (columnCount < 2 || !rows.every((r) => r.length === columnCount)) {
    log.error("Invalid number of columns in raw table.");
    return false;
  }

  const [headerRow, ...dataRows] = rows;
  if (!headerRow.slice(1).every((col) => typeof col === "string" && col.trim() !== "")) {
    log.error("Invalid header row in raw table.");
    return false;
  }

  for (const row of dataRows) {
    if (typeof row[0] !== "string" || row[0].trim() === "") {
      log.error("Invalid first column in raw table.");
      return false;
    }
  }

  return true;
}

////////////////////////

export async function convertToCorrMatrix(fileData, takeSpearman = false) {
  const method = takeSpearman ? "spearman" : "pearson";
  const data = fileData.data.map((row, index) => [fileData.firstColumn[index], ...row]);

  const formData = new FormData();
  formData.append("file", new Blob([JSON.stringify(data)], { type: "application/json" }));
  formData.append("method", method);

  try {
    const response = await axios.post("http://localhost:3001/correlationMatrix", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const { columns, data: matrixData } = response.data;
    return { header: columns, firstColumn: columns, data: matrixData };
  } catch (error) {
    log.error("Error fetching correlation matrix:", error.message);
    throw error;
  }
}
