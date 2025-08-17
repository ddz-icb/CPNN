import log from "../../logger.js";
import { darkTheme, lightTheme, useTheme } from "../../adapters/state/themeState.js";
import { loadTheme, storeTheme } from "../../domain_model/themeManager.js";
import { errorService } from "./errorService.js";

export const themeService = {
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
    try {
      const theme = loadTheme();
      this.setTheme(theme);
    } catch (error) {
      errorService.setError("Error loading theme");
      log.error("Error loading theme");
    }
  },
  // ===== Generic getter/setter =====
  getTheme() {
    return useTheme.getState().theme;
  },
  setTheme(value) {
    useTheme.getState().setTheme(value);
  },
};
