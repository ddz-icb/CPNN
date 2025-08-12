import { useMappingData } from "../adapters/state/mappingState.js";

export const mappingService = {
  // ===== Generic getter/setter =====
  get(key) {
    return useMappingData.getState().mappingData[key];
  },
  set(key, value) {
    useMappingData.getState().setMappingData(key, value);
  },
  getAll() {
    return useMappingData.getState().mappingData;
  },
  setAll(value) {
    useMappingData.getState().setAllMappingData(value);
  },

  // ===== Specific getters/setters =====
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
