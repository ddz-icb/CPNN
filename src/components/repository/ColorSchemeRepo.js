import log from "../../logger.js";
import Dexie from "dexie";
import { defaultColorSchemeNames } from "../adapters/state/appearanceState.js";

export const db = new Dexie("colorSchemes");

db.version(1).stores({
  uploadedFiles: "++id, name",
});

export async function addColorSchemeFileDB(file) {
  try {
    const id = await db.uploadedFiles.add({
      name: file.name,
      content: file.content,
    });

    log.info(`File ${file.name} successfully added. Got id ${id}`);
  } catch (error) {
    log.error(`Failed to add ${file.name}: ${error}`);
  }
}

export async function addColorSchemeIfNotExistsDB(file) {
  try {
    const colorScheme = await getByColorSchemeNameDB(file.name);
    if (colorScheme) {
      log.info("Color scheme already exists");
      return;
    }

    const id = await db.uploadedFiles.add({
      name: file.name,
      content: file.content,
    });

    log.info(`File ${file.name} successfully added. Got id ${id}`);
  } catch (error) {
    log.error(`Failed to add ${file.name}: ${error}`);
  }
}

export async function removeColorSchemeDB(id) {
  try {
    await db.uploadedFiles.delete(id);
    log.info(`File with id ${id} successfully removed.`);
  } catch (error) {
    log.error(`Failed to remove file with id ${id}: ${error}`);
  }
}

export async function removeColorSchemeByNameDB(name) {
  if (defaultColorSchemeNames.includes(name)) {
    log.warn("Example color schemes cannot be removed");
    return;
  }

  try {
    const file = await db.uploadedFiles.where("name").equals(name).first();
    if (file) {
      await db.uploadedFiles.delete(file.id);
      log.info(`File with name ${name} and id ${file.id} successfully removed.`);
    } else {
      log.info(`No file found with the name ${name}.`);
    }
  } catch (error) {
    log.error(`Failed to remove file with name ${name}: ${error}`);
  }
}

export async function fromAllGetColorSchemeNameDB() {
  try {
    const names = [];
    await db.uploadedFiles.toCollection().each((file) => {
      if (file.name) {
        names.push(file.name);
      }
    });
    return names;
  } catch (error) {
    log.error(`Failed to retrieve file names: ${error}`);
    return [];
  }
}

export async function getByColorSchemeNameDB(name) {
  try {
    const file = await db.uploadedFiles.where("name").equals(name).first();
    if (file) {
      return file;
    } else {
      log.info(`No file found with the name ${name}.`);
      return null;
    }
  } catch (error) {
    log.error(`Failed to retrieve file with name ${name}: ${error}`);
    return null;
  }
}

export async function getColorSchemeDB(filename) {
  const file = await getByColorSchemeNameDB(filename);
  if (!file || !file.content) throw new Error(`No file found with the name ${filename}.`);

  const colorScheme = JSON.parse(file.content);
  if (!colorScheme) throw new Error("File format not recognized");
  return { colorScheme, file };
}
