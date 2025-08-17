import { create } from "zustand";

export const mergeProteinsInit = false;
export const filteredAfterStartInit = false;
export const isPreprocessedInit = false;

const graphFlagsInit = {
  mergeProteins: mergeProteinsInit,
  filteredAfterStart: filteredAfterStartInit,
  isPreprocessed: isPreprocessedInit,
};

export const useGraphFlags = create((set) => ({
  graphFlags: graphFlagsInit,
  setGraphFlags: (key, value) =>
    set((state) => ({
      graphFlags: { ...state.graphFlags, [key]: value },
    })),
  setAllGraphFlags: (value) =>
    set(() => ({
      graphFlags: value,
    })),
}));
