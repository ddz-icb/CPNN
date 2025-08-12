import { useColorscheme } from "../adapters/state/colorschemeState.js";

export const colorschemeService = {
  // ===== Generic getter/setter =====
  get(key) {
    return useColorscheme.getState().colorscheme[key];
  },
  set(key, value) {
    useColorscheme.getState().setColorscheme(key, value);
  },
  getAll() {
    return useColorscheme.getState().colorscheme;
  },
  setAll(value) {
    useColorscheme.getState().setAllColorscheme(value);
  },

  // ===== Specific getters/setters =====
  getUploadedColorschemeNames() {
    return this.get("uploadedColorschemeNames");
  },
  setUploadedColorschemeNames(val) {
    this.set("uploadedColorschemeNames", val);
  },

  getNodeColorscheme() {
    return this.get("nodeColorscheme");
  },
  setNodeColorscheme(val) {
    this.set("nodeColorscheme", val);
  },

  getLinkColorscheme() {
    return this.get("linkColorscheme");
  },
  setLinkColorscheme(val) {
    this.set("linkColorscheme", val);
  },

  getLinkAttribsToColorIndices() {
    return this.get("linkAttribsToColorIndices");
  },
  setLinkAttribsToColorIndices(val) {
    this.set("linkAttribsToColorIndices", val);
  },

  getNodeAttribsToColorIndices() {
    return this.get("nodeAttribsToColorIndices");
  },
  setNodeAttribsToColorIndices(val) {
    this.set("nodeAttribsToColorIndices", val);
  },
};
