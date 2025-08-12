import { create } from "zustand";
import { downloadInit } from "./downloadInit.js";

export const useDownload = create((set) => ({
  download: downloadInit,
  setDownload: (key, value) =>
    set((state) => ({
      download: { ...state.download, [key]: value },
    })),
  setAllDownload: (value) =>
    set(() => ({
      download: value,
    })),
}));
