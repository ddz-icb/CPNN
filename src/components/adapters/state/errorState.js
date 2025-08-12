import { create } from "zustand";
import { erorrInit } from "../../config/errorInitValues.js";

export const useError = create((set) => ({
  error: erorrInit,
  setError: (value) =>
    set(() => ({
      error: value,
    })),
}));
