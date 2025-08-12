import { create } from "zustand";
import { resetInit } from "../../config/resetInitValues.js";

export const useReset = create((set) => ({
  reset: resetInit,
  setReset: (value) =>
    set(() => ({
      reset: value,
    })),
}));
