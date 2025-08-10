import log from "../../logger.js";
import { applyTheme, lightTheme } from "../config/appearanceInitValues.js";

// the theme is stored in the local storage of the browser, not the database

export function loadTheme(setAppearance) {
  let storedTheme = localStorage.getItem("theme");

  log.info("Stored Theme:", storedTheme);

  if (storedTheme) {
    try {
      storedTheme = JSON.parse(storedTheme);
    } catch (error) {
      log.error("Fehler beim Parsen des gespeicherten Themes:", error);
      storedTheme = lightTheme;
      localStorage.setItem("theme", JSON.stringify(lightTheme));
    }
  } else {
    storedTheme = lightTheme;
    localStorage.setItem("theme", JSON.stringify(lightTheme));
  }
  applyTheme(document, storedTheme);
  setAppearance("theme", storedTheme);
}

export function storeTheme(theme) {
  let storedTheme = localStorage.getItem("theme");

  if (storedTheme) {
    try {
      storedTheme = JSON.parse(storedTheme);
      if (theme.name === storedTheme.name) return;
    } catch (error) {
      log.error("Error parsing stored theme:", error);
    }
  }

  log.info("Storing theme:", theme);
  localStorage.setItem("theme", JSON.stringify(theme));
}
