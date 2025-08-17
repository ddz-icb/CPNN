import { create } from "zustand";

export const graphInit = null;
export const originGraphInit = null;
export const activeGraphNamesInit = null;
export const uploadedGraphNamesInit = null;

export const graphStateInit = {
  graph: graphInit,
  originGraph: originGraphInit,
  activeGraphNames: activeGraphNamesInit,
  uploadedGraphNames: uploadedGraphNamesInit,
};

export const useGraphState = create((set) => ({
  graphState: graphStateInit,
  setGraphState: (key, value) =>
    set((state) => ({
      graphState: { ...state.graphState, [key]: value },
    })),
  setAllGraphState: (value) =>
    set(() => ({
      graphState: value,
    })),
}));
