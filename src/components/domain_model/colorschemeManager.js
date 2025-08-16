import { parseColorschemeFile } from "../domain_service/parsing/colorschemeParsing.js";
import {
  createColorschemeDB,
  createColorschemeIfNotExistsDB,
  getAllColorschemeNamesDB,
  getColorschemeDB,
  deleteColorschemeDB,
} from "../repository/colorschemeRepo.js";

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
  await createColorschemeDB(colorscheme);
  return colorscheme;
}

export async function createColorschemeIfNotExists(colorscheme) {
  await createColorschemeIfNotExistsDB(colorscheme);
}

export async function deleteColorscheme(colorschemeName) {
  await deleteColorschemeDB(colorschemeName);
}
