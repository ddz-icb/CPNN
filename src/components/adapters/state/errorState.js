import { create } from "zustand";

export const erorrInit = null;

export const useError = create((set) => ({
  error: erorrInit,
  setError: (value) =>
    set(() => ({
      error: value,
    })),
  clearError: () => set({ error: erorrInit }),
}));
