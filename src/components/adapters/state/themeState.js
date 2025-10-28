import { create } from "zustand";

const indigo = "#5561e8";
const lightGrey = "#b2becd";
const deepNavy = "#0f172a";

export const lightTheme = {
  name: "light",
  circleBorderColor: indigo,
  textColor: deepNavy,
};

export const darkTheme = {
  name: "dark",
  circleBorderColor: lightGrey,
  textColor: lightGrey,
};

export const themeInit = lightTheme;

export const useTheme = create((set) => ({
  theme: themeInit,
  setTheme: (value) =>
    set(() => ({
      theme: value,
    })),
}));
