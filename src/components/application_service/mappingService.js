import log from "../../logger.js";
import { activeMappingInit, useMappingData } from "../adapters/state/mappingState.js";
import { createMapping, selectMapping } from "../domain_service/mappingManager.js";
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
      log.error(error);
    }
  },

  async handleCreateMapping(event) {
    const file = event?.target?.files?.[0];
    if (!file) {
      errorService.setError("The input is not a valid file");
      log.error("The input is not a valid file");
      return;
    }
    log.info("Adding new mapping file");

    try {
      const mappingObject = await createMapping(file);
      this.setUploadedMappingNames([...(this.getUploadedMappingNames() || []), file.name]);
    } catch (error) {
      errorService.setError("Error adding mapping file");
      log.error(error);
    }
  },

  async handleRemoveActiveMapping() {
    log.info("Removing currently active annotation mapping");

    this.setActiveMapping(activeMappingInit);
    graphService.setGraphIsPreprocessed(false);
    resetService.simulationReset();
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
