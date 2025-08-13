import log from "../../logger.js";
import {
  addColorschemeDB,
  addColorschemeIfNotExistsDB,
  fromAllGetColorschemeNameDB,
  getColorschemeDB,
  removeColorschemeByNameDB,
} from "../repository/colorSchemeRepo.js";
import {
  defaultColorschemeNames,
  ibmAntiBlindness,
  ibmAntiBlindnessJson,
  manyColors,
  manyColorsJson,
  okabe_ItoAntiBlindnessJson,
} from "../adapters/state/colorschemeState.js";
import { getFileNameWithoutExtension, parseColorschemeFile } from "../other/parseFiles.js";

export async function createInitColorschemes() {
  await addColorschemeIfNotExistsDB(ibmAntiBlindnessJson);
  await addColorschemeIfNotExistsDB(okabe_ItoAntiBlindnessJson);
  await addColorschemeIfNotExistsDB(manyColorsJson);
}

export async function loadColorschemeNames() {
  const colorschemeNames = await fromAllGetColorschemeNameDB();
  return colorschemeNames;
}

export async function selectLinkColorscheme(colorschemeName) {
  const colorschemeObject = await getColorschemeDB(colorschemeName);
  return colorschemeObject;
}

export async function selectNodeColorscheme(colorschemeName) {
  const colorschemeObject = await getColorschemeDB(colorschemeName);
  return colorschemeObject;
}

export async function createColorscheme(file) {
  const colorschemeObject = await parseColorschemeFile(file);
  await addColorschemeDB(colorschemeObject);
  return colorschemeObject;
}

export async function deleteColorscheme(uploadedColorschemeNames, colorschemeName) {
  const updatedColorschemeNames = uploadedColorschemeNames?.filter((name) => name !== colorschemeName);
  await removeColorschemeByNameDB(colorschemeName);
  return updatedColorschemeNames;
}
