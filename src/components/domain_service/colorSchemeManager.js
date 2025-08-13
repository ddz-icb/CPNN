import log from "../../logger.js";
import {
  createColorschemeDB,
  createColorschemeIfNotExistsDB,
  getAllColorschemeNamesDB,
  getColorschemeDB,
  deleteColorschemeDB,
} from "../repository/colorschemeRepo.js";
import { parseColorschemeFile } from "../other/parseFiles.js";

export async function loadColorschemeNames() {
  const colorschemeNames = await getAllColorschemeNamesDB();
  return colorschemeNames;
}

export async function getColorscheme(colorschemeName) {
  const colorscheme = await getColorschemeDB(colorschemeName);
  return colorscheme;
}

export async function createColorscheme(file) {
  const colorscheme = await parseColorschemeFile(file);
  await createColorschemeDB(colorscheme.data, colorscheme.name);
  return colorscheme;
}

export async function createColorschemeIfNotExists(colorscheme) {
  await createColorschemeIfNotExistsDB(colorscheme.data, colorscheme.name);
}

export async function deleteColorscheme(colorschemeName) {
  await deleteColorschemeDB(colorschemeName);
}
