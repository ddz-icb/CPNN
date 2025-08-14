import log from "../../logger.js";
import {
  defaultColorschemeNames,
  ibmAntiBlindness,
  manyColors,
  okabe_ItoAntiBlindness,
  useColorschemeState,
} from "../adapters/state/colorschemeState.js";
import {
  createColorscheme,
  deleteColorscheme,
  getColorscheme,
  loadColorschemeNames,
  createColorschemeIfNotExists,
} from "../domain_service/colorschemeManager.js";
import { errorService } from "./errorService.js";

export const colorschemeService = {
  async handleLoadColorschemeNames() {
    log.info("Loading color scheme names");
    try {
      const colorschemeNames = await loadColorschemeNames();
      this.setUploadedColorschemeNames(colorschemeNames);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleSelectLinkColorscheme(colorschemeName) {
    if (!colorschemeName) {
      errorService.setError("Selected invalid color scheme");
      log.error("Selected invalid color scheme");
      return;
    }
    log.info("Replacing link color scheme");

    try {
      const colorscheme = await getColorscheme(colorschemeName);
      this.setLinkColorscheme(colorscheme);
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
      const colorscheme = await getColorscheme(colorschemeName);
      this.setNodeColorscheme(colorscheme);
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
      const colorscheme = await createColorscheme(file);
      this.setUploadedColorschemeNames([...(this.getUploadedColorschemeNames() || [defaultColorschemeNames]), colorscheme.name]);
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
      log.error("Cannot delete selected color scheme as it's still active");
      errorService.setError("Cannot delete selected color scheme as it's still active");
      return;
    }
    if (defaultColorschemeNames.some((name) => name === colorschemeName)) {
      log.error("Cannot delete default color schemes");
      errorService.setError("Cannot delete default color schemes");
      return;
    }
    log.info("Deleting color scheme");

    try {
      await deleteColorscheme(colorschemeName);
      const remainingColorschemeNames = this.getUploadedColorschemeNames()?.filter((name) => name !== colorschemeName);
      this.setUploadedColorschemeNames(remainingColorschemeNames);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  async handleSetInitColorschemes() {
    try {
      await createColorschemeIfNotExists(ibmAntiBlindness);
      await createColorschemeIfNotExists(okabe_ItoAntiBlindness);
      await createColorschemeIfNotExists(manyColors);

      this.setLinkColorscheme(ibmAntiBlindness);
      this.setNodeColorscheme(manyColors);
      this.setUploadedColorschemeNames([...new Set([...(this.getUploadedColorschemeNames() || []), ...defaultColorschemeNames])]);
    } catch (error) {
      errorService.setError(error.message);
      log.error(error);
    }
  },
  // ===== Generic getter/setter =====
  get(key) {
    return useColorschemeState.getState().colorschemeState[key];
  },
  set(key, value) {
    useColorschemeState.getState().setColorschemeState(key, value);
  },
  getAll() {
    return useColorschemeState.getState().colorschemeState;
  },
  setAll(value) {
    useColorschemeState.getState().setAllColorschemeState(value);
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
