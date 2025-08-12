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
} from "../adapters/state/appearanceState.js";
import { getFileNameWithoutExtension, parseColorschemeFile } from "../other/parseFiles.js";

export async function setInitColorschemes(appearance, setAppearance) {
  addColorschemeIfNotExistsDB(ibmAntiBlindnessJson);
  addColorschemeIfNotExistsDB(okabe_ItoAntiBlindnessJson);
  addColorschemeIfNotExistsDB(manyColorsJson);

  setAppearance("linkColorscheme", ibmAntiBlindness);
  setAppearance("nodeColorscheme", manyColors);
  setAppearance("uploadedColorschemeNames", [...new Set([...(appearance.uploadedColorschemeNames || []), ...defaultColorschemeNames])]);

  if (!appearance.uploadedColorschemeNames) {
    setAppearance("uploadedColorschemeNames", defaultColorschemeNames);
  }
}

export async function loadColorschemeNames(setAppearance) {
  const filenames = await fromAllGetColorschemeNameDB();
  if (filenames.length === 0) return;

  setAppearance("uploadedColorschemeNames", filenames);
}

export async function selectLinkColorscheme(colorschemeName, setAppearance) {
  const { colorscheme, file } = await getColorschemeDB(colorschemeName);

  setAppearance("linkColorscheme", colorscheme);
  log.info("Link color scheme Loaded Successfully:", colorschemeName);
}

export async function selectNodeColorscheme(colorschemeName, setAppearance) {
  const { colorscheme, file } = await getColorschemeDB(colorschemeName);

  setAppearance("nodeColorscheme", colorscheme);
  log.info("Node color scheme Loaded Successfully:", colorscheme);
}

export async function createColorscheme(file, uploadedColorschemeNames, setAppearance) {
  if (uploadedColorschemeNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
    log.warn("Color scheme with this name already exists");
    throw new Error("Color scheme with this name already exists");
  }
  const colorschemeFile = await parseColorschemeFile(file);
  addColorschemeFileDB(colorschemeFile);
  setAppearance("uploadedColorschemeNames", [...(uploadedColorschemeNames || [defaultColorschemeNames]), file.name]);
}

export function deleteColorscheme(uploadedColorschemeNames, colorschemeName, setAppearance) {
  const updatedColorschemes = uploadedColorschemeNames?.filter((name) => name !== colorschemeName);
  setAppearance("uploadedColorschemeNames", updatedColorschemes);
  removeColorschemeByNameDB(colorschemeName);
}
