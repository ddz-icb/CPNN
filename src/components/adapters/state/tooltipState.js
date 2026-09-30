import { create } from "zustand";

export const tooltipInit = {
  isClickTooltipActive: false,
  clickTooltipData: null,
  clickTooltipHistory: [],
  isHoverTooltipActive: false,
  hoverTooltipData: null,
};

export const useTooltipSettings = create((set) => ({
  tooltipSettings: tooltipInit,
  setTooltipSettings: (key, value) =>
    set((state) => ({
      tooltipSettings: { ...state.tooltipSettings, [key]: value },
    })),
  setClickTooltipHistory: (update) =>
    set((state) => ({
      tooltipSettings: {
        ...state.tooltipSettings,
        clickTooltipHistory: typeof update === "function" ? update(state.tooltipSettings.clickTooltipHistory ?? []) : update,
      },
    })),
  setAllTooltipSettings: (value) =>
    set(() => ({
      tooltipSettings: value,
    })),
}));
