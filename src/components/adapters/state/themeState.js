import { create } from "zustand";

const indigo = "#073d7fff";
const lightGrey = "#b2becd";
const deepNavy = "#0f172a";
const brightYellow = "rgba(255, 212, 0, 0.75)";
const coolBlue = "rgb(0, 106, 255)";
const deepRed = "rgb(255, 17, 17)";
const lightBlue = "rgb(181, 0, 191)";

export const lightTheme = {
  name: "light",
  circleBorderColor: indigo,
  textColor: deepNavy,
  highlightColor: deepRed,
  communityHighlightColor: coolBlue,
};

export const darkTheme = {
  name: "dark",
  circleBorderColor: lightGrey,
  textColor: lightGrey,
  highlightColor: brightYellow,
  communityHighlightColor: lightBlue,
};

export const themeInit = lightTheme;

export const useTheme = create((set) => ({
  theme: themeInit,
  setTheme: (value) =>
    set(() => ({
      theme: value,
    })),
}));
