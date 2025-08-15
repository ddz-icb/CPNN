import { create } from "zustand";

export const ibmAntiBlindness = {
  name: "IBM (5 colors, barrier-free)",
  data: ["#648fff", "#ffb000", "#dc267f", "#fe6100", "#785ef0"],
};

export const okabe_ItoAntiBlindness = {
  name: "Okabe (7 colors, barrier-free)",
  data: ["#e69f00", "#56b4e9", "#009e73", "#f0e442", "#0072b2", "#d55e00", "#cc79a7"],
};

export const manyColors = {
  name: "Many Colors (18 colors)",
  data: [
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

export const defaultColorschemes = [ibmAntiBlindness, okabe_ItoAntiBlindness, manyColors];
export const defaultColorschemeNames = defaultColorschemes.map((c) => c.name);

export const linkAttribsToColorIndicesInit = null;
export const nodeAttribsToColorIndicesInit = null;

export const colorschemeStateInit = {
  uploadedColorschemeNames: defaultColorschemeNames,
  nodeColorscheme: null,
  linkColorscheme: null,
  linkAttribsToColorIndices: linkAttribsToColorIndicesInit,
  nodeAttribsToColorIndices: nodeAttribsToColorIndicesInit,
};

export const useColorschemeState = create((set) => ({
  colorschemeState: colorschemeStateInit,
  setColorschemeState: (key, value) =>
    set((state) => ({
      colorschemeState: { ...state.colorschemeState, [key]: value },
    })),
  setAllColorschemeState: (value) =>
    set(() => ({
      colorschemeState: value,
    })),
}));
