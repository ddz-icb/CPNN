import { create } from "zustand";
import { tooltipInit } from "./tooltipInit.js";

export const useTooltipSettings = create((set) => ({
  tooltipSettings: tooltipInit,
  setTooltipSettings: (key, value) =>
    set((state) => ({
      tooltipSettings: { ...state.tooltipSettings, [key]: value },
    })),
  setAllTooltipSettings: (value) =>
    set(() => ({
      tooltipSettings: value,
    })),
}));
