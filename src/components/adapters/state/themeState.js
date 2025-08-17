import { create } from "zustand";

const darkBlue = "#0d3b66";
const lightGrey = "#b2becd";
const black = "#000000";

export const lightTheme = {
  name: "light",
  circleBorderColor: darkBlue,
  textColor: black,
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
