import log from "../../adapters/logging/logger.js";
import { useGraphState } from "../../adapters/state/graphState.js";
import { defaultExampleGraphName, isExampleGraphName } from "../../../assets/exampleGraphMetadata.js";
import { createGraph, deleteGraph, loadGraphNames, getGraph } from "../../domain/models/graph.js";
import { errorService } from "./errorService.js";
import { joinGraphDataList, joinGraphNames } from "../../domain/service/graph_calculations/joinGraph.js";
import { useGraphFlags } from "../../adapters/state/graphFlagsState.js";
import { processNamedFileUpload } from "./fileUploadService.js";
import { getFileNameWithoutExtension } from "../../domain/service/parsing/fileParsing.js";

function normalizeGraphForRuntime(graph) {
  const data = typeof graph.data === "string" ? JSON.parse(graph.data) : graph.data;
  return {
    ...graph,
    data: {
      ...data,
      nodes: data.nodes.map((node) => ({
        ...node,
        attribs: node.attribs === undefined || node.attribs === null ? [] : Array.isArray(node.attribs) ? [...node.attribs] : [node.attribs],
      })),
      links: data.links.map((link) => ({ ...link })),
    },
  };
}

export function getSelectedActiveGraphNames(filename) {
  if (!filename) throw new Error("Selected invalid graph");
  return [filename];
}

export function getAddedActiveGraphNames(activeGraphNames, filename) {
  if (!filename) throw new Error("Selected invalid graph");

  const currentGraphNames = activeGraphNames ?? [];
  if (currentGraphNames.some((name) => name === filename)) {
    throw new Error("Graph already active");
  }

  return [...currentGraphNames, filename];
}

export function getRemainingActiveGraphNames(activeGraphNames, filename, fallbackGraphName = defaultExampleGraphName) {
  if (!filename) throw new Error("Selected invalid graph");

  const remainingGraphNames = (activeGraphNames ?? []).filter((name) => name !== filename);
  return remainingGraphNames.length === 0 ? [fallbackGraphName] : remainingGraphNames;
}

export const graphService = {
  async handleLoadGraphNames() {
    log.info("Loading graph names");
    try {
      const graphNames = (await loadGraphNames()).filter((name) => !isExampleGraphName(name));
      this.setUploadedGraphNames(graphNames);
    } catch (error) {
      errorService.setError("Error setting init graph");
      log.error("Error setting init graph");
    }
  },
  async handleCreateGraph(files, createGraphSettings) {
    try {
      await processNamedFileUpload({
        files,
        entityLabel: "graph",
        uploadSingleFile: (file) => createUploadedGraph(file, createGraphSettings),
        getExistingNames: () => this.getUploadedGraphNames(),
        setMergedNames: (names) => this.setUploadedGraphNames(names),
        log,
        setError: (message) => errorService.setError(message),
      });
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleSelectGraph(filename) {
    log.info("Replacing graph");

    try {
      this.setActiveGraphNames(getSelectedActiveGraphNames(filename));
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleAddActiveGraph(filename) {
    log.info("Adding file with name: ", filename);

    try {
      this.setActiveGraphNames(getAddedActiveGraphNames(this.getActiveGraphNames(), filename));
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async getJoinedGraph(fileNames) {
    if (!fileNames) {
      errorService.setError("Selected invalid graphs");
      log.error("Selected invalid graphs");
      return;
    }
    const graphDataList = [];
    for (const fileName of fileNames) {
      graphDataList.push((await getGraphByName(fileName)).data);
    }
    const joinedGraphData = joinGraphDataList(graphDataList);
    const joinedGraphName = joinGraphNames(fileNames);
    const joinedGraph = { name: joinedGraphName, data: joinedGraphData };
    return joinedGraph;
  },
  async handleRemoveActiveGraph(filename) {
    if (!filename) {
      errorService.setError("Selected invalid graph");
      log.error("Selected invalid graph");
      return;
    }
    log.info("removing graph file with name:", filename);

    try {
      this.setActiveGraphNames(getRemainingActiveGraphNames(this.getActiveGraphNames(), filename));
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleDeleteGraph(filename) {
    if (!filename) {
      errorService.setError("Selected invalid graph");
      log.error("Selected invalid graph");
      return;
    }
    if (this.getActiveGraphNames()?.includes(filename)) {
      this.handleRemoveActiveGraph(filename);
    }
    if (isExampleGraphName(filename)) {
      errorService.setError("Cannot delete example graph");
      log.error("Cannot delete example graph");
      return;
    }
    log.info("Deleting files with name", filename);

    try {
      await deleteGraph(filename);
      const remainingdGraphNames = this.getUploadedGraphNames().filter((name) => name !== filename);
      this.setUploadedGraphNames(remainingdGraphNames);
    } catch (error) {
      errorService.setError("Error deleting the graph");
      log.error(error);
    }
  },
  async handleSetInitGraph() {
    try {
      this.setActiveGraphNames([defaultExampleGraphName]);
    } catch (error) {
      errorService.setError("Error setting init graph");
      log.error("Error setting init graph");
    }
  },
  // ====== Generic getter/setter ======
  getGraphState(key) {
    return useGraphState.getState().graphState[key];
  },
  getGraphFlags(key) {
    return useGraphFlags.getState().graphFlags[key];
  },
  setGraphState(key, value) {
    useGraphState.getState().setGraphState(key, value);
  },
  setGraphFlags(key, value) {
    useGraphFlags.getState().setGraphFlags(key, value);
  },
  getAllGraphState() {
    return useGraphState.getState().graphState;
  },
  getAllGraphFlags() {
    return useGraphFlags.getState().graphFlags;
  },
  setAllGraphState(value) {
    useGraphState.getState().setAllGraphState(value);
  },
  setAllGraphFlags(value) {
    useGraphFlags.getState().setAllGraphFlags(value);
  },
  // ====== Specific getter/setter ======
  getGraph() {
    return this.getGraphState("graph");
  },
  setGraph(val) {
    this.setGraphState("graph", val);
  },
  getOriginGraph() {
    return this.getGraphState("originGraph");
  },
  setOriginGraph(val) {
    this.setGraphState("originGraph", val);
  },
  getMergeByName() {
    return this.getGraphFlags("mergeByName");
  },
  setMergeByName(val) {
    this.setGraphFlags("mergeByName", val);
  },
  getFilteredAfterStart() {
    return this.getGraphFlags("filteredAfterStart");
  },
  setFilteredAfterStart(val) {
    this.setGraphFlags("filteredAfterStart", val);
  },

  getGraphIsPreprocessed() {
    return this.getGraphFlags("isPreprocessed");
  },
  setGraphIsPreprocessed(val) {
    this.setGraphFlags("isPreprocessed", val);
  },

  getActiveGraphNames() {
    return this.getGraphState("activeGraphNames");
  },
  setActiveGraphNames(val) {
    this.setGraphState("activeGraphNames", val);
  },

  getUploadedGraphNames() {
    return this.getGraphState("uploadedGraphNames");
  },
  setUploadedGraphNames(val) {
    this.setGraphState("uploadedGraphNames", val);
  },

  getMapping() {
    return this.getGraphState("mapping");
  },
  setMapping(val) {
    this.setGraphState("mapping", val);
  },
};

async function getGraphByName(filename) {
  return isExampleGraphName(filename)
    ? normalizeGraphForRuntime((await import("../../../assets/exampleGraphs.js")).getExampleGraphByName(filename))
    : getGraph(filename);
}

function createUploadedGraph(file, createGraphSettings) {
  const graphName = getFileNameWithoutExtension(file?.name ?? "");
  if (isExampleGraphName(graphName)) {
    throw new Error(`'${graphName}' is a built-in example graph. Rename the file before uploading it as a custom graph.`);
  }
  return createGraph(file, createGraphSettings);
}
