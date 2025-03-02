export const darkBlue = "#0d3b66";
export const lightGrey = "#b2becd";

export const lightTheme = {
  name: "light",
  circleBorderColor: darkBlue,
  textColor: darkBlue,
};

export const darkTheme = {
  name: "dark",
  circleBorderColor: lightGrey,
  textColor: lightGrey,
};

export const themeInit = lightTheme;

export function applyTheme(document, theme) {
  document.body.className = theme;

  const rootStyles = getComputedStyle(document.body);
}

export const ibmAntiBlindness = {
  name: "IBM (5 colors, barrier-free)",
  colorScheme: ["#648fff", "#ffb000", "#dc267f", "#fe6100", "#785ef0"],
};

export const okabe_ItoAntiBlindness = {
  name: "Okabe (7 colors, barrier-free)",
  colorScheme: ["#e69f00", "#56b4e9", "#009e73", "#f0e442", "#0072b2", "#d55e00", "#cc79a7"],
};

export const manyColors = {
  name: "Many Colors (18 colors)",
  colorScheme: [
    "#e6194b",
    "#3cb44b",
    "#ffdd03",
    "#0082c8",
    "#f58231",
    "#008080",
    "#ff00ff",
    "#46f0f0",
    "#911eb4",
    "#fffac8",
    "#0000ff",
    "#e6beff",
    "#8a9c02",
    "#c4a07c",
    "#7af26f",
    "#805525",
    "#c24202",
    "#5c0000",
  ],
};

export const nodeColorSchemeInit = manyColors;
export const linkColorSchemeInit = ibmAntiBlindness;

export const defaultColorSchemes = [ibmAntiBlindness, okabe_ItoAntiBlindness, manyColors];
