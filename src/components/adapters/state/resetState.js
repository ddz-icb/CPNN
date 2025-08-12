import { create } from "zustand";

export const resetInit = {
  reset: false,
};

export const useReset = create((set) => ({
  reset: resetInit,
  setReset: (value) =>
    set(() => ({
      reset: value,
    })),
}));
