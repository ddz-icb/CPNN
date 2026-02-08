import { create } from "zustand";
import { defaultCamera } from "../../domain/service/canvas_drawing/render3D";

export const showNodeLabelsInit = true;
export const linkWidthInit = 2;
export const threeDInit = true;
export const threeDShadingInit = true;
export const threeDGridInit = true;
export const cameraRefInit = { ...defaultCamera };

export const appearanceInit = {
  showNodeLabels: true,
  linkWidth: linkWidthInit,
  linkWidthText: linkWidthInit,
  threeD: threeDInit,
  enable3DShading: threeDShadingInit,
  show3DGrid: threeDGridInit,
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
