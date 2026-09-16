import { create } from "zustand";

export const mergeByNameInit = false;
export const filteredAfterStartInit = false;
export const isPreprocessedInit = false;

export const graphFlagsStateInit = {
  mergeByName: mergeByNameInit,
  filteredAfterStart: filteredAfterStartInit,
  isPreprocessed: isPreprocessedInit,
};

export const useGraphFlags = create((set) => ({
  graphFlags: graphFlagsStateInit,
  setGraphFlags: (key, value) =>
    set((state) => ({
      graphFlags: { ...state.graphFlags, [key]: value },
    })),
  setAllGraphFlags: (value) =>
    set(() => ({
      graphFlags: value,
    })),
}));
