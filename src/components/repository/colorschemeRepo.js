import log from "../adapters/logging/logger.js";
import Dexie from "dexie";
import { defaultColorschemeNames } from "../adapters/state/colorschemeState.js";

export const db = new Dexie("colorschemes");

db.version(1).stores({
  uploadedFiles: "++id, name",
});

async function getColorschemeByNameDB(colorschemeName) {
  try {
    const colorscheme = await db.uploadedFiles.where("name").equals(colorschemeName).first();
    return colorscheme;
  } catch (error) {
    throw new Error(`Failed to retrieve file with name ${colorschemeName}: ${error}`);
  }
}

export async function getColorschemeDB(colorschemeName) {
  const colorscheme = await getColorschemeByNameDB(colorschemeName);
  if (!colorscheme) throw new Error("No file found");
  return colorscheme;
}

export async function createColorschemeDB(colorscheme) {
  try {
    const existingColorscheme = await getColorschemeByNameDB(colorscheme.name);
    if (existingColorscheme) throw new Error("Colorscheme already exists");

    const id = await db.uploadedFiles.add({
      name: colorscheme.name,
      data: colorscheme.data,
    });
    log.info(`File ${colorscheme.name} successfully added. Got id ${id}`);
    return id;
  } catch (error) {
    throw new Error(`Failed to add ${colorscheme.name}: ${error}`);
  }
}

export async function createColorschemeIfNotExistsDB(colorscheme) {
  try {
    const existingColorscheme = await getColorschemeByNameDB(colorscheme.name);
    if (existingColorscheme) {
      log.info("Colorscheme already exists");
      return existingColorscheme.id;
    }

    const id = await db.uploadedFiles.add({
      name: colorscheme.name,
      data: colorscheme.data,
    });
    log.info(`File ${colorscheme.name} successfully added. Got id ${id}`);
    return id;
  } catch (error) {
    throw new Error(`Failed to add file if not exists: ${error}`);
  }
}

export async function deleteColorschemeDB(colorschemeName) {
  try {
    const colorscheme = await getColorschemeByNameDB(colorschemeName);
    if (!colorscheme) {
      log.warn(`No file found with the name ${colorschemeName}.`);
      return false;
    }

    await db.uploadedFiles.delete(colorscheme.id);
    log.info(`File with name ${colorschemeName} and id ${colorscheme.id} successfully deleted.`);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete file with name ${colorschemeName}: ${error}`);
  }
}

export async function getAllColorschemeNamesDB() {
  try {
    const colorschemes = await db.uploadedFiles.toCollection().distinct().toArray();
    const colorschemeNames = colorschemes.map((colorscheme) => colorscheme.name);
    return colorschemeNames;
  } catch (error) {
    throw new Error(`Failed to retrieve file names: ${error}`);
  }
}
