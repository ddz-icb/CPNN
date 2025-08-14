import { create } from "zustand";

export const activeMappingInit = null;
export const uploadedMappingNamesInit = null;

export const mappingDataInit = {
  activeMapping: null,
  uploadedMappingNames: null,
};

export const useMappingState = create((set) => ({
  mappingState: mappingDataInit,
  setMappingState: (key, value) =>
    set((state) => {
      if (typeof value === "function") {
        return { mappingState: value(state.mappingState) };
      }
      return { mappingState: { ...state.mappingState, [key]: value } };
    }),
  setAllMappingState: (value) =>
    set(() => ({
      mappingState: value,
    })),
}));
