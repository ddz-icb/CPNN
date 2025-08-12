import log from "../../logger.js";
import { useGraphData } from "../adapters/state/graphState.js";
import { createGraph, selectGraph } from "../domain_service/graphManager.js";
import { errorService } from "./errorService.js";
import { resetService } from "./resetService.js";

export const graphService = {
  async handleCreateGraph(event, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient, mergeSameProtein) {
    const file = event?.target?.files?.[0];
    if (!file) {
      errorService.setError("The input is not a valid file");
      return;
    }
    log.info("Adding new graph file");

    try {
      const graphObject = await createGraph(
        file,
        this.getUploadedGraphNames(),
        takeAbs,
        minCorrForEdge,
        minCompSizeForNode,
        maxCompSizeForNode,
        takeSpearmanCoefficient,
        mergeSameProtein
      );

      this.setUploadedGraphNames([...(this.getUploadedGraphNames() || []), graphObject.name]);
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error creating graph:", error);
    }
  },

  async handleSelectGraph(filename) {
    if (!filename) {
      errorService.setError("Selected invalid graph");
      return;
    }
    log.info("Replacing graph");

    try {
      const graphObject = await selectGraph(filename);
      this.setOriginGraph(graphObject);
      this.getActiveGraphNames([graphObject.name]);
      this.setGraphIsPreprocessed(false);
      this.setMergeProteins(false);
      resetService.simulationReset();
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error loading graph:", error);
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

  getUploadedMappingNames() {
    return this.get("uploadedMappingNames");
  },
  setUploadedMappingNames(val) {
    this.set("uploadedMappingNames", val);
  },
};
