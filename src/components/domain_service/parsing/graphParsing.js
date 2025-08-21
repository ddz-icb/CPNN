import log from "../../adapters/logging/logger.js";
import Papa from "papaparse";
import axios from "axios";
import { getFileAsText, parseSVFile } from "./fileParsing.js";
import {
  filterByThreshold,
  filterMaxCompSize,
  filterMergeProteins,
  filterMinCompSize,
  filterNodesExist,
  filterTakeAbs,
} from "../graph_calculations/filterGraph.js";
import { isCorrMatrix, isTableData, verifyGraph } from "../verification/graphVerification.js";
import { sortGraph } from "../graph_calculations/graphUtils.js";

function applyFilters(graphData, settings) {
  let filteredGraph = graphData;
  filteredGraph = filterByThreshold(filteredGraph, settings.minEdgeCorr);
  filteredGraph = filterMinCompSize(filteredGraph, settings.minCompSize);
  filteredGraph = filterMaxCompSize(filteredGraph, settings.maxCompSize);
  filteredGraph = filterTakeAbs(filteredGraph, settings.takeAbs);
  filteredGraph = filterMergeProteins(filteredGraph, settings.mergeProteins);

  return filterNodesExist(filteredGraph);
}

export async function parseGraphFile(file, settings) {
  if (!file) {
    throw new Error("No file was provided.");
  }

  const fileContent = await getFileAsText(file);
  let graphData = await parseGraphByFileType(file.name, fileContent, settings.takeSpearman);
  graphData = applyFilters(graphData, settings);
  sortGraph(graphData);

  const graph = { name: file.name, data: graphData };
  verifyGraph(graph);

  return graph;
}

async function parseGraphByFileType(name, content, takeSpearman) {
  const fileExtension = name.split(".").pop();
  const linkAttrib = name.split(".")[0];

  try {
    if (fileExtension === "json") {
      log.info("Parsing JSON graph");
      return JSON.parse(content);
    }
    if (fileExtension != "csv" && fileExtension != "tsv") throw new Error("Unknown file type");

    const parsedData = parseSVFile(content);
    if (!parsedData || !parsedData.header) throw new Error("CSV/TSV file has a wrong or empty format.");

    if (isCorrMatrix(parsedData)) {
      log.info("Parsing symmetrical matrix (CSV/TSV)");
      return convertCorrMatrixToGraph(parsedData, linkAttrib);
    }

    if (isTableData(parsedData)) {
      log.info("Parsing raw table data (CSV/TSV)");
      const corrMatrix = await convertRawTableToCorrMatrix(parsedData, takeSpearman);
      return convertCorrMatrixToGraph(corrMatrix, linkAttrib);
    }

    throw new Error("File has an unknown format.");
  } catch (error) {
    log.error(`Failed to parse graph: ${error.message}`);
    throw error;
  }
}

function convertCorrMatrixToGraph(fileData, linkAttrib) {
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

async function convertRawTableToCorrMatrix(fileData, takeSpearman = false) {
  const method = takeSpearman ? "spearman" : "pearson";
  const data = fileData.data.map((row, index) => [fileData.firstColumn[index], ...row]);

  const formData = new FormData();
  formData.append("file", new Blob([JSON.stringify(data)], { type: "application/json" }));
  formData.append("method", method);

  try {
    // const response = await axios.post("http://localhost:3001/correlationMatrix", formData, {
    const response = await axios.post("https://cpnn.ddz.de/api/correlationMatrix", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const { columns, data: matrixData } = response.data;
    return { header: columns, firstColumn: columns, data: matrixData };
  } catch (error) {
    log.error("Error fetching correlation matrix:", error.message);
    throw error;
  }
}
