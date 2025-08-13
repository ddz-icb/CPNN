import log from "../../logger.js";
import { lightTheme } from "../adapters/state/appearanceState.js";

// the theme is stored in the local storage of the browser, not the database since

export function loadTheme() {
  let storedTheme = localStorage.getItem("theme");

  try {
    if (storedTheme) {
      storedTheme = JSON.parse(storedTheme);
    } else {
      storedTheme = lightTheme;
      localStorage.setItem("theme", JSON.stringify(lightTheme));
    }
    applyTheme(document, storedTheme);
    return storedTheme;
  } catch (error) {
    log.error("Error loading stored theme:", error);
    storedTheme = lightTheme;
    localStorage.setItem("theme", JSON.stringify(lightTheme));
    return storedTheme;
  }
}

export function storeTheme(theme) {
  if (!theme) {
    // throw error
  }
  log.info("Storing theme:", theme);
  try {
    let storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      storedTheme = JSON.parse(storedTheme);
      if (theme.name === storedTheme.name) return;
    }

    localStorage.setItem("theme", JSON.stringify(theme));
  } catch (error) {
    log.error("Error parsing stored theme:", error);
  }
}

function applyTheme(document, theme) {
  document.body.className = theme;

  getComputedStyle(document.body);
}
