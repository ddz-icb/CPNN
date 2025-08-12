import log from "../../logger.js";
import { useMappingData } from "../adapters/state/mappingState.js";
import { selectMapping } from "../domain_service/mappingManager.js";
import { errorService } from "./errorService.js";
import { graphService } from "./graphService.js";
import { resetService } from "./resetService.js";

export const mappingService = {
  async handleSelectMapping(mappingName) {
    if (!mappingName) {
      errorService.setError("Selected invalid mapping");
      log.error("Selected invalid mapping");
      return;
    }
    log.info("Replacing mapping");

    try {
      const mappingObject = await selectMapping(mappingName);
      this.setActiveMapping(mappingObject);
      graphService.setGraphIsPreprocessed(false);
      resetService.simulationReset();
    } catch (error) {
      errorService.setError("Mapping is already the current mapping");
      log.error("Mapping is already the current mapping");
    }
  },

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
