import { create } from "zustand";

export const defaultTransitionSecondsInit = 3;
export const holdSecondsInit = 0.35;

export const videographyInit = {
  keyframes: [],
  selectedKeyframeId: null,
  defaultTransitionSeconds: defaultTransitionSecondsInit,
  defaultTransitionSecondsText: defaultTransitionSecondsInit,
  holdSeconds: holdSecondsInit,
  holdSecondsText: holdSecondsInit,
  isRendering: false,
  progress: 0,
  status: "",
  error: null,
};

export const useVideography = create((set) => ({
  videography: videographyInit,
  setVideography: (key, value) =>
    set((state) => ({
      videography: { ...state.videography, [key]: value },
    })),
  setKeyframes: (valueOrUpdater) =>
    set((state) => {
      const nextKeyframes = typeof valueOrUpdater === "function" ? valueOrUpdater(state.videography.keyframes) : valueOrUpdater;
      return {
        videography: {
          ...state.videography,
          keyframes: Array.isArray(nextKeyframes) ? nextKeyframes : [],
        },
      };
    }),
  setAllVideography: (value) =>
    set(() => ({
      videography: value,
    })),
}));
