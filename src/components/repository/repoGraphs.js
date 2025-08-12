import { exampleGraphJson } from "../assets/exampleGraphJSON.js";
import log from "../../logger.js";
import Dexie from "dexie";

export const db = new Dexie("graphs");

db.version(1).stores({
  uploadedFiles: "++id, name",
});

export async function addGraphFileDB(file) {
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

export async function addGraphFileIfNotExistsDB(file) {
  try {
    const graphObject = await getByGraphNameDB(file.name);
    if (graphObject) {
      log.info("Graph already exists");
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

export async function removeGraphFileDB(id) {
  try {
    await db.uploadedFiles.delete(id);
    log.info(`File with id ${id} successfully removed.`);
  } catch (error) {
    log.error(`Failed to remove file with id ${id}: ${error}`);
  }
}

export async function removeGraphFileByNameDB(name) {
  if (name == exampleGraphJson.name) {
    log.warn("The example graph cannot be removed");
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

export async function fromAllGetGraphNameDB() {
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

export async function getByGraphNameDB(name) {
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

export async function getGraphDB(filename) {
  const file = await getByGraphNameDB(filename);
  if (!file || !file.content) throw new Error(`No file found with the name ${filename}.`);

  const graphObject = JSON.parse(file.content);
  if (!graphObject) throw new Error("File format not recognized");
  return graphObject;
}
