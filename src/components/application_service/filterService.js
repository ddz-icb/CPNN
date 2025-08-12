import { useFilter } from "../adapters/state/filterState.js";

export const filterService = {
  // ===== Generic getter/setter =====
  get(key) {
    return useFilter.getState().filter[key];
  },
  set(key, value) {
    useFilter.getState().setFilter(key, value);
  },
  getAll() {
    return useFilter.getState().filter;
  },
  setAll(value) {
    useFilter.getState().setAllFilter(value);
  },

  // ===== Specific getters/setters =====
  getLinkThreshold() {
    return this.get("linkThreshold");
  },
  setLinkThreshold(val) {
    this.set("linkThreshold", val);
  },

  getLinkThresholdText() {
    return this.get("linkThresholdText");
  },
  setLinkThresholdText(val) {
    this.set("linkThresholdText", val);
  },

  getLinkFilter() {
    return this.get("linkFilter");
  },
  setLinkFilter(val) {
    this.set("linkFilter", val);
  },

  getLinkFilterText() {
    return this.get("linkFilterText");
  },
  setLinkFilterText(val) {
    this.set("linkFilterText", val);
  },

  getNodeFilter() {
    return this.get("nodeFilter");
  },
  setNodeFilter(val) {
    this.set("nodeFilter", val);
  },

  getNodeFilterText() {
    return this.get("nodeFilterText");
  },
  setNodeFilterText(val) {
    this.set("nodeFilterText", val);
  },

  getMinCompSize() {
    return this.get("minCompSize");
  },
  setMinCompSize(val) {
    this.set("minCompSize", val);
  },

  getMinCompSizeText() {
    return this.get("minCompSizeText");
  },
  setMinCompSizeText(val) {
    this.set("minCompSizeText", val);
  },

  getMaxCompSize() {
    return this.get("maxCompSize");
  },
  setMaxCompSize(val) {
    this.set("maxCompSize", val);
  },

  getMaxCompSizeText() {
    return this.get("maxCompSizeText");
  },
  setMaxCompSizeText(val) {
    this.set("maxCompSizeText", val);
  },

  getCompDensity() {
    return this.get("compDensity");
  },
  setCompDensity(val) {
    this.set("compDensity", val);
  },

  getCompDensityText() {
    return this.get("compDensityText");
  },
  setCompDensityText(val) {
    this.set("compDensityText", val);
  },

  getMinNeighborhoodSize() {
    return this.get("minNeighborhoodSize");
  },
  setMinNeighborhoodSize(val) {
    this.set("minNeighborhoodSize", val);
  },

  getMinNeighborhoodSizeText() {
    return this.get("minNeighborhoodSizeText");
  },
  setMinNeighborhoodSizeText(val) {
    this.set("minNeighborhoodSizeText", val);
  },
};
