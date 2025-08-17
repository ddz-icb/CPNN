import log from "../../adapters/logging/logger.js";
import { useGraphState } from "../../adapters/state/graphState.js";
import { exampleGraphJson } from "../../assets/exampleGraphJSON.js";
import { createGraph, deleteGraph, loadGraphNames, getGraph } from "../../domain_model/graphManager.js";
import { createGraphIfNotExistsDB } from "../../repository/graphRepo.js";
import { errorService } from "./errorService.js";
import { joinGraphNames, joinGraphs } from "../../domain_service/graph_calculations/joinGraph.js";
import { useGraphFlags } from "../../adapters/state/graphFlagsState.js";

export const graphService = {
  async handleLoadGraphNames() {
    log.info("Loading graph names");
    try {
      const graphNames = await loadGraphNames();
      this.setUploadedGraphNames(graphNames);
    } catch (error) {
      errorService.setError("Error setting init graph");
      log.error("Error setting init graph");
    }
  },
  async handleCreateGraph(event, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient, mergeProteins) {
    const file = event?.target?.files?.[0];
    if (!file) {
      errorService.setError("The input is not a valid file");
      log.error("The input is not a valid file");
      return;
    }
    log.info("Adding new graph file");

    try {
      const graph = await createGraph(file, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient, mergeProteins);

      this.setUploadedGraphNames([...(this.getUploadedGraphNames() || []), file.name]);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleSelectGraph(filename) {
    if (!filename) {
      errorService.setError("Selected invalid graph");
      log.error("Selected invalid graph");
      return;
    }
    log.info("Replacing graph");

    try {
      this.setActiveGraphNames([filename]);
      this.setMergeProteins(false);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleAddActiveGraph(filename) {
    if (!filename) {
      errorService.setError("Selected invalid graph");
      log.error("Selected invalid graph");
      return;
    }
    if (this.getActiveGraphNames().some((name) => name === filename)) {
      errorService.setError("Graph already active");
      log.error("Graph already active");
      return;
    }
    log.info("Adding file with name: ", filename);

    try {
      this.setActiveGraphNames([...this.getActiveGraphNames(), filename]);
    } catch (error) {
      errorService.setError("Error loading graph");
      log.error(error);
    }
  },
  async getJoinedGraph(fileNames) {
    if (!fileNames) {
      errorService.setError("Selected invalid graphs");
      log.error("Selected invalid graphs");
      return;
    }
    let graph = await getGraph(fileNames[0]);
    let joinedGraphData = graph.data;
    for (let i = 1; i < fileNames.length; i++) {
      graph = await getGraph(fileNames[i]);
      joinedGraphData = joinGraphs(joinedGraphData, graph.data);
    }
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
      let remainingGraphNames = this.getActiveGraphNames()?.filter((name) => name !== filename);
      if (remainingGraphNames.length === 0) {
        remainingGraphNames = [exampleGraphJson.name];
      }
      this.setActiveGraphNames(remainingGraphNames);
    } catch (error) {
      errorService.setError("Error removing graph");
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
      errorService.setError("Cannot delete selected graph as it's still active");
      log.error("Cannot delete selected graph as it's still active");
      return;
    }
    if (filename === exampleGraphJson.name) {
      errorService.setError("Cannot delete default graph");
      log.error("Cannot delete default graph");
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
      await createGraphIfNotExistsDB(exampleGraphJson);
      this.setActiveGraphNames([exampleGraphJson.name]);
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
  getMergeProteins() {
    return this.getGraphFlags("mergeProteins");
  },
  setMergeProteins(val) {
    this.setGraphFlags("mergeProteins", val);
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
