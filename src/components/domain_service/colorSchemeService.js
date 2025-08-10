import log from "../../logger.js";
import {
  addColorSchemeFileDB,
  addColorSchemeIfNotExistsDB,
  fromAllGetColorSchemeNameDB,
  getColorSchemeDB,
  removeColorSchemeByNameDB,
} from "../repository/repoColorScheme.js";
import {
  defaultColorSchemeNames,
  ibmAntiBlindness,
  ibmAntiBlindnessJson,
  manyColors,
  manyColorsJson,
  okabe_ItoAntiBlindnessJson,
} from "../config/appearanceInitValues.js";
import { getFileNameWithoutExtension, parseColorSchemeFile } from "../other/parseFiles.js";

export async function setInitColorSchemes(appearance, setAppearance) {
  addColorSchemeIfNotExistsDB(ibmAntiBlindnessJson);
  addColorSchemeIfNotExistsDB(okabe_ItoAntiBlindnessJson);
  addColorSchemeIfNotExistsDB(manyColorsJson);

  setAppearance("linkColorScheme", ibmAntiBlindness);
  setAppearance("nodeColorScheme", manyColors);
  setAppearance("uploadedColorSchemeNames", [...new Set([...(appearance.uploadedColorSchemeNames || []), ...defaultColorSchemeNames])]);

  if (!appearance.uploadedColorSchemeNames) {
    setAppearance("uploadedColorSchemeNames", defaultColorSchemeNames);
  }
}

export async function loadColorSchemeNames(setAppearance) {
  const filenames = await fromAllGetColorSchemeNameDB();
  if (filenames.length === 0) return;

  setAppearance("uploadedColorSchemeNames", filenames);
}

export async function selectLinkColorScheme(colorSchemeName, setAppearance) {
  const { colorScheme, file } = await getColorSchemeDB(colorSchemeName);

  setAppearance("linkColorScheme", colorScheme);
  log.info("Link color scheme Loaded Successfully:", colorSchemeName);
}

export async function selectNodeColorScheme(colorSchemeName, setAppearance) {
  const { colorScheme, file } = await getColorSchemeDB(colorSchemeName);

  setAppearance("nodeColorScheme", colorScheme);
  log.info("Node color scheme Loaded Successfully:", colorScheme);
}

export async function addNewColorScheme(file, uploadedColorSchemeNames, setAppearance) {
  if (uploadedColorSchemeNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
    log.warn("Color scheme with this name already exists");
    throw new Error("Color scheme with this name already exists");
  }
  const colorSchemeFile = await parseColorSchemeFile(file);
  addColorSchemeFileDB(colorSchemeFile);
  setAppearance("uploadedColorSchemeNames", [...(uploadedColorSchemeNames || [defaultColorSchemeNames]), file.name]);
}

export function deleteColorScheme(uploadedColorSchemeNames, colorSchemeName, setAppearance) {
  const updatedColorSchemes = uploadedColorSchemeNames?.filter((name) => name !== colorSchemeName);
  setAppearance("uploadedColorSchemeNames", updatedColorSchemes);
  removeColorSchemeByNameDB(colorSchemeName);
}
