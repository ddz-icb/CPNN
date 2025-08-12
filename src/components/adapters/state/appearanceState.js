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

export const linkAttribsToColorIndicesInit = null;
export const nodeAttribsToColorIndices = null;
export const showNodeLabelsInit = true;
export const linkWidthInit = 2;

export const appearanceInit = {
  theme: themeInit,
  showNodeLabels: true,
  linkAttribsToColorIndices: null,
  nodeAttribsToColorIndices: null,
  linkWidth: linkWidthInit,
  linkWidthText: linkWidthInit,
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
