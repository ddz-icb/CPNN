import { create } from "zustand";

export const tooltipInit = {
  isClickTooltipActive: false,
  clickTooltipData: null,
  isHoverTooltipActive: false,
  hoverTooltipData: null,
};

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
