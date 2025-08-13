import log from "../../logger.js";
import { defaultColorschemeNames, useColorscheme } from "../adapters/state/colorschemeState.js";
import { createColorscheme, deleteColorscheme, selectLinkColorscheme, selectNodeColorscheme } from "../domain_service/colorschemeManager.js";
import { errorService } from "./errorService.js";

export const colorschemeService = {
  async handleSelectLinkColorscheme(colorschemeName) {
    if (!colorschemeName) {
      errorService.setError("Selected invalid color scheme");
      log.error("Selected invalid color scheme");
      return;
    }
    log.info("Replacing link color scheme");

    try {
      const colorschemeObject = await selectLinkColorscheme(colorschemeName);
      this.setLinkColorscheme(colorschemeObject);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleSelectNodeColorscheme(colorschemeName) {
    if (!colorschemeName) {
      errorService.setError("Selected invalid color scheme");
      log.error("Selected invalid color scheme");
      return;
    }
    log.info("Replacing node color scheme");

    try {
      const colorschemeObject = await selectNodeColorscheme(colorschemeName);
      this.setNodeColorscheme(colorschemeObject);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleCreateColorscheme(event) {
    const file = event?.target?.files?.[0];
    if (!file) {
      errorService.setError("The input is not a valid file");
      log.error("The input is not a valid file");
      return;
    }
    log.info("Adding new color scheme");

    try {
      const colorschemeObject = await createColorscheme(file);
      this.setUploadedColorschemeNames([...(this.getUploadedColorschemeNames() || [defaultColorschemeNames]), colorschemeObject.name]);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleDeleteColorscheme(colorschemeName) {
    if (!colorschemeName) {
      errorService.setError("Selected invalid color scheme");
      log.error("Selected invalid color scheme");
      return;
    }
    if (this.getNodeColorscheme()?.name == colorschemeName || this.getLinkColorscheme()?.name == colorschemeName) {
      log.error("Cannot remove selected color scheme as it's still active");
      errorService.setError("Cannot remove selected color scheme as it's still active");
      return;
    }
    log.info("Deleting color scheme");

    try {
      const remainingColorschemeNames = await deleteColorscheme(this.getUploadedColorschemeNames(), colorschemeName);
      this.setUploadedColorschemeNames(remainingColorschemeNames);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },

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
