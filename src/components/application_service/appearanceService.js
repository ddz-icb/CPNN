import log from "../../logger.js";
import { darkTheme, lightTheme, useAppearance } from "../adapters/state/appearanceState.js";
import { loadTheme, storeTheme } from "../domain_service/themeManager.js";
import { errorService } from "./errorService.js";

export const appearanceService = {
  handleChangeTheme() {
    log.info("Changing theme");
    try {
      const newTheme = this.getTheme().name === lightTheme.name ? darkTheme : lightTheme;
      storeTheme(newTheme);
      this.setTheme(newTheme);
    } catch (error) {
      errorService.setError("Error changing theme");
      log.error("Error changing theme");
    }
  },
  handleInitTheme() {
    log.info("Loading theme");
    try {
      const theme = loadTheme();
      this.setTheme(theme);
    } catch (error) {
      errorService.setError("Error loading theme");
      log.error("Error loading theme");
    }
  },
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
