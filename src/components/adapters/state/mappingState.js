import { create } from "zustand";

export const activeMappingInit = null;
export const uploadedMappingNamesInit = null;

export const mappingDataInit = {
  activeMapping: null,
  uploadedMappingNames: null,
};

export const useMappingData = create((set) => ({
  mappingData: mappingDataInit,
  setMappingData: (key, value) =>
    set((state) => {
      if (typeof value === "function") {
        return { mappingData: value(state.mappingData) };
      }
      return { mappingData: { ...state.mappingData, [key]: value } };
    }),
  setAllMappingData: (value) =>
    set(() => ({
      mappingData: value,
    })),
}));
