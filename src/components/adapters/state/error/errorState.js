import { create } from "zustand";
import { erorrInit } from "./errorInit.js";

export const useError = create((set) => ({
  error: erorrInit,
  setError: (value) =>
    set(() => ({
      error: value,
    })),
  clearError: () => set({ error: erorrInit }),
}));
