import { create } from "zustand";
import { tooltipInit } from "../../config/tooltipInitValues.js";

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
