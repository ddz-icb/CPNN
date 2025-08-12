import { create } from "zustand";
import { containerInit } from "../../config/containerInitValues.js";

export const useContainer = create((set) => ({
  container: containerInit,
  setContainer: (key, value) =>
    set((state) => ({
      container: { ...state.container, [key]: value },
    })),
  setAllContainer: (value) =>
    set(() => ({
      container: value,
    })),
}));
