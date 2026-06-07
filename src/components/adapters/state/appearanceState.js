import { create } from "zustand";
import { defaultCamera } from "../../domain/service/canvas_drawing/render3D";

export const showNodeLabelsInit = true;
export const linkWidthInit = 2;
export const linkWidthManuallySetInit = false;
export const threeDInit = false;
export const threeDShadingInit = true;
export const threeDGridInit = true;
export const threeDOrbitSensitivityInit = 1;
export const threeDPanSensitivityInit = 1;
export const threeDZoomSensitivityInit = 1;
export const threeDInertiaInit = true;
export const threeDInertiaDampingInit = 0.9;
export const threeDInvertVerticalInit = false;
export const threeDFovInit = defaultCamera.fov;
export const cameraRefInit = { ...defaultCamera };

export const appearanceInit = {
  showNodeLabels: true,
  linkWidth: linkWidthInit,
  linkWidthText: linkWidthInit,
  linkWidthManuallySet: linkWidthManuallySetInit,
  threeD: threeDInit,
  enable3DShading: threeDShadingInit,
  show3DGrid: threeDGridInit,
  threeDOrbitSensitivity: threeDOrbitSensitivityInit,
  threeDOrbitSensitivityText: threeDOrbitSensitivityInit,
  threeDPanSensitivity: threeDPanSensitivityInit,
  threeDPanSensitivityText: threeDPanSensitivityInit,
  threeDZoomSensitivity: threeDZoomSensitivityInit,
  threeDZoomSensitivityText: threeDZoomSensitivityInit,
  threeDInertia: threeDInertiaInit,
  threeDInertiaDamping: threeDInertiaDampingInit,
  threeDInertiaDampingText: threeDInertiaDampingInit,
  threeDInvertVertical: threeDInvertVerticalInit,
  threeDFov: threeDFovInit,
  threeDFovText: threeDFovInit,
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
