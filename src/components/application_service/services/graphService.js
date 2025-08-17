import log from "../../logger.js";
import { useGraphState } from "../../adapters/state/graphState.js";
import { exampleGraphJson } from "../../assets/exampleGraphJSON.js";
import { createGraph, deleteGraph, loadGraphNames, getGraph } from "../../domain_model/graphManager.js";
import { createGraphIfNotExistsDB } from "../../repository/graphRepo.js";
import { errorService } from "./errorService.js";
import { joinGraphNames, joinGraphs } from "../../domain_service/graph_calculations/joinGraph.js";

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
  get(key) {
    return useGraphState.getState().graphState[key];
  },
  set(key, value) {
    useGraphState.getState().setGraphState(key, value);
  },
  getAll() {
    return useGraphState.getState().graphState;
  },
  setAll(value) {
    useGraphState.getState().setAllGraphState(value);
  },
  // ====== Specific getter/setter ======
  getGraph() {
    return this.get("graph");
  },
  setGraph(val) {
    this.set("graph", val);
  },

  getOriginGraph() {
    return this.get("originGraph");
  },
  setOriginGraph(val) {
    this.set("originGraph", val);
  },

  getLinkWeightMin() {
    return this.get("linkWeightMin");
  },
  setLinkWeightMin(val) {
    this.set("linkWeightMin", val);
  },

  getLinkWeightMax() {
    return this.get("linkWeightMax");
  },
  setLinkWeightMax(val) {
    this.set("linkWeightMax", val);
  },

  getMergeProteins() {
    return this.get("mergeProteins");
  },
  setMergeProteins(val) {
    this.set("mergeProteins", val);
  },

  getNodeMap() {
    return this.get("nodeMap");
  },
  setNodeMap(val) {
    this.set("nodeMap", val);
  },

  getCircles() {
    return this.get("circles");
  },
  setCircles(val) {
    this.set("circles", val);
  },

  getNodeLabels() {
    return this.get("nodeLabels");
  },
  setNodeLabels(val) {
    this.set("nodeLabels", val);
  },

  getLines() {
    return this.get("lines");
  },
  setLines(val) {
    this.set("lines", val);
  },

  getFilteredAfterStart() {
    return this.get("filteredAfterStart");
  },
  setFilteredAfterStart(val) {
    this.set("filteredAfterStart", val);
  },

  getGraphIsPreprocessed() {
    return this.get("graphIsPreprocessed");
  },
  setGraphIsPreprocessed(val) {
    this.set("graphIsPreprocessed", val);
  },

  getActiveGraphNames() {
    return this.get("activeGraphNames");
  },
  setActiveGraphNames(val) {
    this.set("activeGraphNames", val);
  },

  getUploadedGraphNames() {
    return this.get("uploadedGraphNames");
  },
  setUploadedGraphNames(val) {
    this.set("uploadedGraphNames", val);
  },

  getActiveMapping() {
    return this.get("activeMapping");
  },
  setActiveMapping(val) {
    this.set("activeMapping", val);
  },
};
