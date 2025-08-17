import { create } from "zustand";

export const nodeMapInit = null;
export const circlesInit = null;
export const linesInit = null;
export const nodeLabelsInit = null;

export const pixiStateInit = {
  nodeMap: nodeMapInit,
  circles: circlesInit,
  lines: linesInit,
  nodeLabels: nodeLabelsInit,
};

export const usePixiState = create((set) => ({
  pixiState: pixiStateInit,
  setPixiState: (key, value) =>
    set((state) => ({
      pixiState: { ...state.pixiState, [key]: value },
    })),
  setAllPixiState: (value) =>
    set(() => ({
      pixiState: value,
    })),
}));
