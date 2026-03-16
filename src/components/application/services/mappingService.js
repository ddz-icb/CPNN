import log from "../../adapters/logging/logger.js";
import { mappingInit, useMappingState } from "../../adapters/state/mappingState.js";
import { createMapping, deleteMapping, loadMappingNames, getMapping } from "../../domain/models/mapping.js";
import { errorService } from "./errorService.js";
import { processNamedFileUpload } from "./fileUploadService.js";

export const mappingService = {
  async handleLoadMappingNames() {
    log.info("Loading mapping names");
    try {
      const mappingNames = await loadMappingNames();
      this.setUploadedMappingNames(mappingNames);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleSelectMapping(mappingName) {
    if (!mappingName) {
      errorService.setError("Selected invalid mapping");
      log.error("Selected invalid mapping");
      return;
    }
    log.info("Replacing mapping");
    try {
      const mapping = await getMapping(mappingName);
      this.setMapping(mapping);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleCreateMapping(files) {
    try {
      await processNamedFileUpload({
        files,
        entityLabel: "mapping",
        uploadSingleFile: (file) => createMapping(file),
        getExistingNames: () => this.getUploadedMappingNames(),
        setMergedNames: (names) => this.setUploadedMappingNames(names),
        log,
        setError: (message) => errorService.setError(message),
      });
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleRemoveMapping() {
    log.info("Removing currently active mapping");

    try {
      this.setMapping(mappingInit);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleDeleteMapping(mappingName) {
    if (!mappingName) {
      errorService.setError("Selected invalid mapping");
      log.error("Selected invalid mapping");
      return;
    }
    if (this.getMapping()?.name == mappingName) {
      this.handleRemoveMapping();
    }
    log.info("Deleting mapping with name", mappingName);

    try {
      await deleteMapping(mappingName);
      const remainingMappingNames = this.getUploadedMappingNames()?.filter((name) => name !== mappingName);
      this.setUploadedMappingNames(remainingMappingNames);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  // ===== Generic getter/setter =====
  get(key) {
    return useMappingState.getState().mappingState[key];
  },
  set(key, value) {
    useMappingState.getState().setMappingState(key, value);
  },
  getAll() {
    return useMappingState.getState().mappingState;
  },
  setAll(value) {
    useMappingState.getState().setAllMappingState(value);
  },

  // ===== Specific getters/setters =====
  getMapping() {
    return this.get("mapping");
  },
  setMapping(val) {
    this.set("mapping", val);
  },

  getUploadedMappingNames() {
    return this.get("uploadedMappingNames");
  },
  setUploadedMappingNames(val) {
    this.set("uploadedMappingNames", val);
  },
};
