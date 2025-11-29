import { create } from "zustand";

export const nodeMapInit = null;
export const circlesInit = null;
export const linesInit = null;

export const pixiStateInit = {
  nodeMap: nodeMapInit,
  circles: circlesInit,
  lines: linesInit,
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
