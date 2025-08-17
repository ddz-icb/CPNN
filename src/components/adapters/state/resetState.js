import { create } from "zustand";

export const resetInit = false;

export const useReset = create((set) => ({
  reset: resetInit,
  setReset: (value) =>
    set(() => ({
      reset: value,
    })),
}));
