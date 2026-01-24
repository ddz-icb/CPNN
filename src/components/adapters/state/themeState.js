import { create } from "zustand";

const indigo = "#073d7fff";
const lightGrey = "#b2becd";
const deepNavy = "#0f172a";
const brightYellow = "rgba(255, 212, 0, 0.75)";
const coolBlue = "#006aff";

export const lightTheme = {
  name: "light",
  circleBorderColor: indigo,
  textColor: deepNavy,
  highlightColor: coolBlue,
};

export const darkTheme = {
  name: "dark",
  circleBorderColor: lightGrey,
  textColor: lightGrey,
  highlightColor: brightYellow,
};

export const themeInit = lightTheme;

export const useTheme = create((set) => ({
  theme: themeInit,
  setTheme: (value) =>
    set(() => ({
      theme: value,
    })),
}));
