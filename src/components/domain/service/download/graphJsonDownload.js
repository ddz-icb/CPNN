import { getFileNameWithoutExtension } from "../parsing/fileParsing.js";
import { cleanLinks, cleanNodes, cleanNodesNoCoords } from "./exportGraph.js";
import { triggerDownload } from "./fileDownload.js";

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function normalizeGraphJsonOptions(options) {
  if (!isObject(options)) return {};
  if (Object.hasOwn(options, "settings") || Object.hasOwn(options, "includeCoordinates")) return options;

  return {
    includeCoordinates: Boolean(options.physics),
    settings: options,
  };
}

export function buildGraphJsonData(graph, options = {}) {
  const { includeCoordinates = false, settings = null } = normalizeGraphJsonOptions(options);
  const nodes = includeCoordinates ? cleanNodes(graph.data.nodes) : cleanNodesNoCoords(graph.data.nodes);
  const links = cleanLinks(graph.data.links);

  const data = { nodes, links };
  if (isObject(settings)) {
    Object.assign(data, settings);
  }

  // Attribution travels with the graph, including exports without settings.
  // Settings must not overwrite the graph's source/license information.
  if (isObject(graph.data.metadata)) {
    data.metadata = structuredClone(graph.data.metadata);
  }
  return data;
}

export function buildGraphJsonDownload(graph, options = {}) {
  const data = buildGraphJsonData(graph, options);
  const blob = new Blob([JSON.stringify(data, null, 4)], {
    type: "application/json",
  });

  return {
    blob,
    filename: `${getFileNameWithoutExtension(graph.name)}.json`,
  };
}

export function downloadGraphJson(graph, options = {}) {
  const { blob, filename } = buildGraphJsonDownload(graph, options);
  triggerDownload(blob, filename);
}
