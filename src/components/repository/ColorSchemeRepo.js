import log from "../../logger.js";
import Dexie from "dexie";
import { defaultColorschemeNames } from "../adapters/state/colorschemeState.js";

export const db = new Dexie("colorschemes");

db.version(1).stores({
  uploadedFiles: "++id, name",
});

async function getFileByNameDB(name) {
  try {
    const file = await db.uploadedFiles.where("name").equals(name).first();
    return file;
  } catch (error) {
    throw new Error(`Failed to retrieve file with name ${name}: ${error}`);
  }
}

export async function getColorschemeDB(filename) {
  const file = await getFileByNameDB(filename);
  if (!file) throw new Error("No file found");

  const colorschemeObject = JSON.parse(file.data);
  if (!colorschemeObject) throw new Error("File format not recognized");
  return colorschemeObject;
}

export async function addColorschemeDB(file) {
  try {
    const existingFile = await getFileByNameDB(file.name);
    if (existingFile) throw new Error("Colorscheme already exists");

    const id = await db.uploadedFiles.add({
      name: file.name,
      data: file.data,
    });
    log.info(`File ${file.name} successfully added. Got id ${id}`);
    return id;
  } catch (error) {
    throw new Error(`Failed to add ${file.name}: ${error}`);
  }
}

export async function addColorschemeIfNotExistsDB(file) {
  try {
    const existingFile = await getFileByNameDB(file.name);
    if (existingFile) {
      log.info("Colorscheme already exists");
      return existingFile.id;
    }

    const id = await db.uploadedFiles.add({
      name: file.name,
      data: file.data,
    });
    log.info(`File ${file.name} successfully added. Got id ${id}`);
    return id;
  } catch (error) {
    throw new Error(`Failed to add graph if not exists: ${error}`);
  }
}

export async function removeColorschemeDB(id) {
  try {
    await db.uploadedFiles.delete(id);
    log.info(`File with id ${id} successfully removed.`);
    return true;
  } catch (error) {
    throw new Error(`Failed to remove file with id ${id}: ${error}`);
  }
}

export async function removeColorschemeByNameDB(name) {
  if (defaultColorschemeNames.some((colorschemeName) => colorschemeName === name)) {
    throw new Error("Default color schemes cannot be removed");
  }

  try {
    const file = await getFileByNameDB(name);
    if (!file) {
      log.warn(`No file found with the name ${name}.`);
      return false;
    }

    await db.uploadedFiles.delete(file.id);
    log.info(`File with name ${name} and id ${file.id} successfully removed.`);
    return true;
  } catch (error) {
    throw new Error(`Failed to remove file with name ${name}: ${error}`);
  }
}

export async function fromAllGetColorschemeNameDB() {
  try {
    const files = await db.uploadedFiles.toCollection().distinct().toArray();
    const names = files.map((file) => file.name);
    return names;
  } catch (error) {
    throw new Error(`Failed to retrieve file names: ${error}`);
  }
}
