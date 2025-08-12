import { useTooltipSettings } from "../adapters/state/tooltipState.js";

export const tooltipService = {
  // ===== Generic getter/setter =====
  get(key) {
    return useTooltipSettings.getState().tooltipSettings[key];
  },
  set(key, value) {
    useTooltipSettings.getState().setTooltipSettings(key, value);
  },
  getAll() {
    return useTooltipSettings.getState().tooltipSettings;
  },
  setAll(value) {
    useTooltipSettings.getState().setAllTooltipSettings(value);
  },

  // ===== Specific getters/setters =====
  getIsClickTooltipActive() {
    return this.get("isClickTooltipActive");
  },
  setIsClickTooltipActive(val) {
    this.set("isClickTooltipActive", val);
  },

  getClickTooltipData() {
    return this.get("clickTooltipData");
  },
  setClickTooltipData(val) {
    this.set("clickTooltipData", val);
  },

  getIsHoverTooltipActive() {
    return this.get("isHoverTooltipActive");
  },
  setIsHoverTooltipActive(val) {
    this.set("isHoverTooltipActive", val);
  },

  getHoverTooltipData() {
    return this.get("hoverTooltipData");
  },
  setHoverTooltipData(val) {
    this.set("hoverTooltipData", val);
  },
};
