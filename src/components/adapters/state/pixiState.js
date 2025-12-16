import { create } from "zustand";

export const nodeMapInit = null;
export const nodeContainersInit = null;
export const linesInit = null;
export const lines2DInit = null;
export const lines3DInit = null;
export const grid3DInit = null;

export const pixiStateInit = {
  nodeMap: nodeMapInit,
  nodeContainers: nodeContainersInit,
  lines: linesInit,
  lines2D: lines2DInit,
  lines3D: lines3DInit,
  grid3D: grid3DInit,
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
