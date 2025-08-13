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

export async function setInitColorschemes(colorscheme, setColorscheme) {
  addColorschemeIfNotExistsDB(ibmAntiBlindnessJson);
  addColorschemeIfNotExistsDB(okabe_ItoAntiBlindnessJson);
  addColorschemeIfNotExistsDB(manyColorsJson);

  setColorscheme("linkColorscheme", ibmAntiBlindness);
  setColorscheme("nodeColorscheme", manyColors);
  setColorscheme("uploadedColorschemeNames", [...new Set([...(colorscheme.uploadedColorschemeNames || []), ...defaultColorschemeNames])]);

  if (!colorscheme.uploadedColorschemeNames) {
    setColorscheme("uploadedColorschemeNames", defaultColorschemeNames);
  }
}

export async function loadColorschemeNames(setColorscheme) {
  const filenames = await fromAllGetColorschemeNameDB();
  if (filenames.length === 0) return;

  setColorscheme("uploadedColorschemeNames", filenames);
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

export async function deleteColorscheme(uploadedColorschemeNames, colorschemeName, setColorscheme) {
  const updatedColorschemes = uploadedColorschemeNames?.filter((name) => name !== colorschemeName);
  await setColorscheme("uploadedColorschemeNames", updatedColorschemes);
  removeColorschemeByNameDB(colorschemeName);
}
