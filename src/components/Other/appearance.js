import { IBMAntiBlindness, manyColors } from "./colors.js";

export const circleBorderColorLight = "#0d3b66";
export const circleBorderColorDark = "#b2becd";

export const lightTheme = {
  theme: "light",
  circleBorderColor: circleBorderColorLight,
};

export const darkTheme = {
  theme: "dark",
  circleBorderColor: circleBorderColorDark,
};

export const themeInit = lightTheme;
export const nodeColorSchemeInit = ["Many Colors (18 colors)", manyColors];
export const linkColorSchemeInit = ["IBM (5 colors)", IBMAntiBlindness];

export function applyTheme(document, theme) {
  document.body.className = theme;

  const rootStyles = getComputedStyle(document.body);
}
