import log from "../../adapters/logging/logger.js";
import Papa from "papaparse";
import axios from "axios";
import { getFileAsText } from "./fileParsing.js";
import { filterByThreshold, filterMaxCompSize, filterMinCompSize, filterNodesExist } from "../graph_calculations/filterGraph.js";
import { verifyGraph } from "../verification/graphVerification.js";

function applyFilters(graph, settings) {
  graph = filterByThreshold(graph, settings.minEdgeCorr);
  graph = filterMinCompSize(graph, settings.minCompSize);
  graph = filterMaxCompSize(graph, settings.maxCompSize);
  return filterNodesExist(graph);
}

function normalizeWeightsAbs(graph) {
  graph.links.forEach((link) => {
    link.weights = link.weights.map(Math.abs);
  });
}

function filterPositiveWeights(graph) {
  graph.links.forEach((link) => {
    link.weights = link.weights.filter((w) => w > 0);
  });
}

function sortGraph(graph) {
  graph.nodes.sort((a, b) => a.id.localeCompare(b.id));
  graph.links.sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
}

// --- Hauptfunktionen für das Parsen und Verarbeiten ---

export async function parseGraphFile(file, settings) {
  if (!file) {
    throw new Error("No file was provided.");
  }

  const fileContent = await getFileAsText(file);
  let graphData = await parseByFileType(file.name, fileContent);

  graphData = applyFilters(graphData, settings);

  // should be contained in filters
  if (settings.takeAbs) {
    normalizeWeightsAbs(graphData);
  } else {
    filterPositiveWeights(graphData);
  }

  // should be contained in filters
  if (settings.mergeProteins) {
    graphData = settings.mergeProteins(graphData);
  }

  sortGraph(graphData);

  const graph = { name: file.name, data: graphData };
  verifyGraph(graph);

  return graph;
}

export async function parseByFileType(name, content) {
  const fileExtension = name.split(".").pop();
  const linkAttrib = name.split(".")[0];

  try {
    if (fileExtension === "json") {
      log.info("Parsing JSON graph");
      return JSON.parse(content);
    } else if ((fileExtension === "csv" || fileExtension === "tsv") && isSymmMatrix(content)) {
      log.info("Parsing symmetrical matrix (csv/tsv)");
      const fileData = parseSVFile(content);
      if (!fileData || !fileData.header) {
        throw new Error("Symmetrical matrix has wrong format.");
      }
      return convertSymmMatrixToGraph(fileData, linkAttrib);
    } else if ((fileExtension === "csv" || fileExtension === "tsv") && isValidRawTableData(content)) {
      log.info("Parsing raw table data (csv/tsv)");
      const fileData = parseSVFile(content);
      if (!fileData || !fileData.header) {
        throw new Error("Raw table data has wrong format.");
      }
      console.log("FILEDATAAAAAAA", fileData);
      const corrMatrix = await convertToCorrMatrix(fileData);
      return convertSymmMatrixToGraph(corrMatrix, linkAttrib);
    } else {
      throw new Error("File has an unknown type or format.");
    }
  } catch (error) {
    log.error(`Failed to parse graph: ${error.message}`);
    throw error;
  }
}

function convertSymmMatrixToGraph(fileData, linkAttrib) {
  console.log("FILEDATA", fileData);
  console.log("AATRIB", linkAttrib);

  const graphData = { nodes: [], links: [] };

  // Create nodes
  graphData.nodes = fileData.header.map((id) => ({ id, groups: [] }));

  // Create links
  for (let i = 0; i < fileData.header.length; i++) {
    for (let j = 0; j < i; j++) {
      graphData.links.push({
        source: fileData.header[i],
        target: fileData.header[j],
        weights: [fileData.data[i][j]],
        attribs: [linkAttrib],
      });
    }
  }

  return graphData;
}

function parseSVFile(content) {
  const fileData = Papa.parse(content, {
    header: false,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: "", // Auto-detect delimiter
  });

  if (!fileData.data?.length) return null;

  // Ensure the header row is treated as strings + slice off header
  const header = fileData.data[0].map(String).slice(1);
  const data = fileData.data.slice(1);
  const firstColumn = data.map((row) => row[0]);

  // Slice the first column from the data rows
  const updatedData = data.map((row) => row.slice(1));

  return { header, firstColumn, data: updatedData };
}

///////////////////////

export function isSymmMatrix(content) {
  const fileData = Papa.parse(content, { header: false, dynamicTyping: true, skipEmptyLines: true });
  if (!fileData.data?.length || fileData.data[0].length !== fileData.data.length) {
    return false;
  }
  const firstColumn = fileData.data.map((row) => row[0]);
  const firstRow = fileData.data[0];
  return firstColumn.every((val, i) => val === firstRow[i]);
}

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

export async function convertToCorrMatrix(fileData, useSpearman = false) {
  const method = useSpearman ? "spearman" : "pearson";
  const data = fileData.data.map((row, index) => [fileData.firstColumn[index], ...row]);

  const formData = new FormData();
  formData.append("file", new Blob([JSON.stringify(data)], { type: "application/json" }));
  formData.append("method", method);

  try {
    const response = await axios.post("http://localhost:3001/correlationMatrix", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const { columns, data, index } = response.data;
    return { header: columns, firstColumn: columns, data: data };
  } catch (error) {
    console.error("Error fetching correlation matrix:", error.message);
    throw error;
  }
}
