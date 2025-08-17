import log from "../../logger.js";
import { lightTheme } from "../adapters/state/themeState.js";

// the theme is stored in the local storage of the browser, not the database

export function loadTheme() {
  let storedTheme = localStorage.getItem("theme");

  if (storedTheme) {
    storedTheme = JSON.parse(storedTheme);
  } else {
    storedTheme = lightTheme;
    storeTheme(lightTheme);
  }
  return storedTheme;
}

export function storeTheme(theme) {
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
