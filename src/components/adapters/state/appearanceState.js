import { create } from "zustand";
import { defaultCamera } from "../../domain/service/canvas_drawing/render3D";

export const showNodeLabelsInit = true;
export const linkWidthInit = 2;
export const threeDInit = false;
export const cameraRefInit = { ...defaultCamera };

export const appearanceInit = {
  showNodeLabels: true,
  linkWidth: linkWidthInit,
  linkWidthText: linkWidthInit,
  threeD: threeDInit,
  cameraRef: cameraRefInit,
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
