import log from "../../logger.js";
import { useGraphData } from "../adapters/state/graphState.js";
import {
  addActiveGraph,
  createGraph,
  deleteGraph,
  loadGraphNames,
  removeActiveGraph,
  selectGraph,
  setInitGraph,
} from "../domain_service/graphManager.js";
import { errorService } from "./errorService.js";
import { resetService } from "./resetService.js";

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
  async handleSetInitGraph() {
    try {
      const graphObject = await setInitGraph();
      this.setOriginGraph(graphObject.data);
      this.setActiveGraphNames([graphObject.name]);
      this.setGraphIsPreprocessed(false);
    } catch (error) {
      errorService.setError("Error setting init graph");
      log.error("Error setting init graph");
    }
  },
  async handleCreateGraph(event, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient, mergeSameProtein) {
    const file = event?.target?.files?.[0];
    if (!file) {
      errorService.setError("The input is not a valid file");
      log.error("The input is not a valid file");
      return;
    }
    log.info("Adding new graph file");

    try {
      const graphObject = await createGraph(
        file,
        takeAbs,
        minCorrForEdge,
        minCompSizeForNode,
        maxCompSizeForNode,
        takeSpearmanCoefficient,
        mergeSameProtein
      );

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
      const graphObject = await selectGraph(filename); // graphObject is so far just the content!!!!!!!!!!!!!!!
      this.setOriginGraph(graphObject);
      this.setActiveGraphNames([filename]);
      this.setGraphIsPreprocessed(false);
      this.setMergeProteins(false);
      resetService.simulationReset();
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
      this.setGraphIsPreprocessed(false);
      const graphObject = await addActiveGraph(filename, this.getOriginGraph());
      this.setOriginGraph(graphObject);
      this.setActiveGraphNames([...this.getActiveGraphNames(), filename]);
      resetService.simulationReset();
    } catch (error) {
      errorService.setError("Error loading graph");
      log.error(error);
    }
  },
  async handleRemoveActiveGraph(filename) {
    if (!filename) {
      errorService.setError("Selected invalid graph");
      log.error("Selected invalid graph");
      return;
    }
    log.info("removing graph file with name:", filename);

    try {
      graphService.setGraphIsPreprocessed(false);
      const { activeGraphNames, graphObject } = await removeActiveGraph(filename, graphService.getActiveGraphNames());
      graphService.setOriginGraph(graphObject);
      graphService.setActiveGraphNames(activeGraphNames);
      resetService.simulationReset();
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
    if (graphService.getActiveGraphNames()?.includes(filename)) {
      errorService.setError("Cannot remove selected graph as it's still active");
      log.error("Cannot remove selected graph as it's still active");
      return;
    }
    log.info("Deleting files with name", filename);

    try {
      const remainingdGraphNames = await deleteGraph(graphService.getUploadedGraphNames(), filename);
      graphService.setUploadedGraphNames(remainingdGraphNames);
    } catch (error) {
      errorService.setError("Error deleting the graph");
      log.error(error);
    }
  },

  // ====== Generic getter/setter ======
  get(key) {
    return useGraphData.getState().graphData[key];
  },
  set(key, value) {
    useGraphData.getState().setGraphData(key, value);
  },
  getAll() {
    return useGraphData.getState().graphData;
  },
  setAll(value) {
    useGraphData.getState().setAllGraphData(value);
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
