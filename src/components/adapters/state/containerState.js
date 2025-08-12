import { create } from "zustand";

export const containerInit = {
  height: null,
  width: null,
};

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
