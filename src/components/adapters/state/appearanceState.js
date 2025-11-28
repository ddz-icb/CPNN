import { create } from "zustand";

export const showNodeLabelsInit = true;
export const linkWidthInit = 2;
export const threeDInit = false;

export const appearanceInit = {
  showNodeLabels: true,
  linkWidth: linkWidthInit,
  linkWidthText: linkWidthInit,
  threeD: threeDInit
};

export const useAppearance = create((set) => ({
  appearance: appearanceInit,
  setAppearance: (key, value) =>
    set((state) => ({
      appearance: { ...state.appearance, [key]: value },
    })),
  setAllAppearance: (value) =>
    set(() => ({
      appearance: value,
    })),
}));
