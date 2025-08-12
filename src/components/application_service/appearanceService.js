import { useAppearance } from "../adapters/state/appearanceState.js";

export const appearanceService = {
  // ===== Generic getter/setter =====
  get(key) {
    return useAppearance.getState().appearance[key];
  },
  set(key, value) {
    useAppearance.getState().setAppearance(key, value);
  },
  getAll() {
    return useAppearance.getState().appearance;
  },
  setAll(value) {
    useAppearance.getState().setAllAppearance(value);
  },

  // ===== Specific getters/setters =====
  getTheme() {
    return this.get("theme");
  },
  setTheme(val) {
    this.set("theme", val);
  },

  getShowNodeLabels() {
    return this.get("showNodeLabels");
  },
  setShowNodeLabels(val) {
    this.set("showNodeLabels", val);
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

  getLinkWidth() {
    return this.get("linkWidth");
  },
  setLinkWidth(val) {
    this.set("linkWidth", val);
  },

  getLinkWidthText() {
    return this.get("linkWidthText");
  },
  setLinkWidthText(val) {
    this.set("linkWidthText", val);
  },
};
