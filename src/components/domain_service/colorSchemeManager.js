import log from "../../logger.js";
import {
  addColorschemeFileDB,
  addColorschemeIfNotExistsDB,
  fromAllGetColorschemeNameDB,
  getColorschemeDB,
  removeColorschemeByNameDB,
} from "../repository/ColorschemeRepo.js";
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

export async function selectLinkColorscheme(colorschemeName, setColorscheme) {
  const { colorscheme, file } = await getColorschemeDB(colorschemeName);

  setColorscheme("linkColorscheme", colorscheme);
  log.info("Link color scheme Loaded Successfully:", colorschemeName);
}

export async function selectNodeColorscheme(colorschemeName, setColorscheme) {
  const { colorscheme, file } = await getColorschemeDB(colorschemeName);

  setColorscheme("nodeColorscheme", colorscheme);
  log.info("Node color scheme Loaded Successfully:", colorscheme);
}

export async function createColorscheme(file, uploadedColorschemeNames, setColorscheme) {
  if (uploadedColorschemeNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
    log.warn("Color scheme with this name already exists");
    throw new Error("Color scheme with this name already exists");
  }
  const colorschemeFile = await parseColorschemeFile(file);
  addColorschemeFileDB(colorschemeFile);
  setColorscheme("uploadedColorschemeNames", [...(uploadedColorschemeNames || [defaultColorschemeNames]), file.name]);
}

export function deleteColorscheme(uploadedColorschemeNames, colorschemeName, setColorscheme) {
  const updatedColorschemes = uploadedColorschemeNames?.filter((name) => name !== colorschemeName);
  setColorscheme("uploadedColorschemeNames", updatedColorschemes);
  removeColorschemeByNameDB(colorschemeName);
}
