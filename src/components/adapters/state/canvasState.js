import { create } from "zustand";

export const appInit = null;
export const simulationInit = null;

export const renderStateInit = {
  app: appInit,
  simulation: simulationInit,
};

export const useRenderState = create((set) => ({
  renderState: renderStateInit,
  setRenderState: (key, value) =>
    set((state) => ({
      renderState: { ...state.renderState, [key]: value },
    })),
  setAllRenderState: (value) =>
    set(() => ({
      renderState: value,
    })),
}));
