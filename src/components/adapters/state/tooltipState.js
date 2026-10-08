import { create } from "zustand";

export const tooltipInit = {
  isClickTooltipActive: false,
  isNodeFocusOnly: false,
  clickTooltipData: null,
  clickTooltipHistory: [],
  isHoverTooltipActive: false,
  hoverTooltipData: null,
};

export const useTooltipSettings = create((set) => ({
  tooltipSettings: tooltipInit,
  setTooltipSettings: (key, value) => set((state) => {
    const settings = { ...state.tooltipSettings, [key]: value };
    if (key === "clickTooltipData" && value) {
      const history = state.tooltipSettings.clickTooltipHistory ?? [];
      settings.clickTooltipHistory = history.at(-1)?.node === value.node
        ? [...history.slice(0, -1), value]
        : [...history, value];
    }
    if (key === "isClickTooltipActive") {
      settings.isNodeFocusOnly = value ? false : Boolean(settings.isNodeFocusOnly || state.tooltipSettings.isClickTooltipActive);
    }
    return { tooltipSettings: settings };
  }),
  goBackTooltip: () => set((state) => {
    const history = state.tooltipSettings.clickTooltipHistory ?? [];
    if (history.length < 2) return state;
    const remaining = history.slice(0, -1);
    return { tooltipSettings: {
      ...state.tooltipSettings,
      clickTooltipData: remaining.at(-1),
      clickTooltipHistory: remaining,
    } };
  }),
  hideTooltipKeepFocus: () => set((state) => ({
    tooltipSettings: { ...state.tooltipSettings, isClickTooltipActive: false, isNodeFocusOnly: true, isHoverTooltipActive: false },
  })),
  clearNodeFocus: () => set((state) => ({
    tooltipSettings: {
      ...state.tooltipSettings,
      isClickTooltipActive: false,
      isNodeFocusOnly: false,
      clickTooltipData: null,
      clickTooltipHistory: [],
    },
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
