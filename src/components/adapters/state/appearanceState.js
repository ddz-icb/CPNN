import { create } from "zustand";

const darkBlue = "#0d3b66";
const lightGrey = "#b2becd";
const black = "#000000";

export const lightTheme = {
  name: "light",
  circleBorderColor: darkBlue,
  textColor: black,
};

export const darkTheme = {
  name: "dark",
  circleBorderColor: lightGrey,
  textColor: lightGrey,
};

export const themeInit = lightTheme;

export const ibmAntiBlindness = {
  name: "IBM (5 colors, barrier-free)",
  content: ["#648fff", "#ffb000", "#dc267f", "#fe6100", "#785ef0"],
};

export const okabe_ItoAntiBlindness = {
  name: "Okabe (7 colors, barrier-free)",
  content: ["#e69f00", "#56b4e9", "#009e73", "#f0e442", "#0072b2", "#d55e00", "#cc79a7"],
};

export const manyColors = {
  name: "Many Colors (18 colors)",
  content: [
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

export const ibmAntiBlindnessJson = { name: "IBM (5 colors, barrier-free)", content: JSON.stringify(ibmAntiBlindness) };
export const okabe_ItoAntiBlindnessJson = { name: "Okabe (7 colors, barrier-free)", content: JSON.stringify(okabe_ItoAntiBlindness) };
export const manyColorsJson = { name: "Many Colors (18 colors)", content: JSON.stringify(manyColors) };

export const linkAttribsToColorIndicesInit = null;
export const nodeAttribsToColorIndices = null;
export const showNodeLabelsInit = true;
export const linkWidthInit = 2;

export const defaultColorschemes = [ibmAntiBlindness, okabe_ItoAntiBlindness, manyColors];
export const defaultColorschemeNames = defaultColorschemes.map((c) => c.name);

export const appearanceInit = {
  theme: themeInit,
  showNodeLabels: true,
  linkAttribsToColorIndices: null,
  nodeAttribsToColorIndices: null,
  linkWidth: linkWidthInit,
  linkWidthText: linkWidthInit,
  uploadedColorschemeNames: defaultColorschemeNames,
  nodeColorscheme: null,
  linkColorscheme: null,
};

export const useAppearance = create((set) => ({
  appearance: appearanceInit,
  setAppearance: (key, value) =>
    set((state) => ({
      appearance: { ...state.appearance, [key]: value },
    })),
  setAllAppearance: (value) =>
    set(() => ({
      appearance: value,
    })),
}));
