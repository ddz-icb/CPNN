import { create } from "zustand";

// on state change: indicates graph should be downloaded
export const downloadInit = {
  json: null,
  jsonCoordsPhysics: null,
  svg: null,
  pdf: null,
  legendPdf: null,
  nodeIds: null,
  nodeColorscheme: null,
  linkColorscheme: null,
};

export const useDownload = create((set) => ({
  download: downloadInit,
  setDownload: (key, value) =>
    set((state) => ({
      download: { ...state.download, [key]: value },
    })),
  setAllDownload: (value) =>
    set(() => ({
      download: value,
    })),
}));
