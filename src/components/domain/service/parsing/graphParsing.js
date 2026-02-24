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

const defaultGeneratedLinkAttrib = "uploaded";

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
  let graphData = await parseGraphByFileType(file.name, fileContent, settings);
  graphData = applyFilters(graphData, settings);
  sortGraph(graphData);

  const graph = { name: getFileNameWithoutExtension(file.name), data: graphData };
  verifyGraph(graph);

  return graph;
}

async function parseGraphByFileType(name, content, settings) {
  const fileExtension = name.split(".").pop();
  const generatedLinkAttrib = resolveGeneratedLinkAttrib(settings);

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
      return convertCorrMatrixToGraph(parsedData, generatedLinkAttrib);
    }

    if (isTableData(parsedData)) {
      log.info("Parsing tabular data (CSV/TSV)");
      return await buildGraphFromRawTable(parsedData, {
        takeSpearman: settings?.takeSpearman,
        ignoreNegatives: settings?.ignoreNegatives,
        minEdgeCorr: settings?.minEdgeCorr,
        linkAttrib: generatedLinkAttrib,
      });
    }

    throw new Error("File has an unknown format.");
  } catch (error) {
    log.error(`Failed to parse graph: ${error.message}`);
    throw error;
  }
}

function resolveGeneratedLinkAttrib(settings) {
  const candidate = String(settings?.generatedLinkAttrib ?? "").trim();
  return candidate.length > 0 ? candidate : defaultGeneratedLinkAttrib;
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

// NOTE: server-side correlation has been replaced by a client-side worker implementation.
