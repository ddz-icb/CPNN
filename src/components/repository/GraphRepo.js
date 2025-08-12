import { exampleGraphJson } from "../assets/exampleGraphJSON.js";
import log from "../../logger.js";
import Dexie from "dexie";

export const db = new Dexie("graphs");

db.version(1).stores({
  uploadedFiles: "++id, name",
});

async function getFileByNameDB(name) {
  try {
    const file = await db.uploadedFiles.where("name").equals(name).first();
    if (!file) throw new Error(`No file found with the name ${name}.`);

    return file;
  } catch (error) {
    throw new Error(`Failed to retrieve file with name ${name}: ${error}`);
  }
}

export async function getGraphDB(filename) {
  const file = await getFileByNameDB(filename);

  const graphObject = JSON.parse(file.content);
  if (!graphObject) throw new Error("File format not recognized");
  return graphObject;
}

export async function addGraphDB(file) {
  try {
    const id = await db.uploadedFiles.add({
      name: file.name,
      content: file.content,
    });
    log.info(`File ${file.name} successfully added. Got id ${id}`);
    return id;
  } catch (error) {
    throw new Error(`Failed to add ${file.name}: ${error}`);
  }
}

export async function addGraphIfNotExistsDB(file) {
  try {
    const existingFile = await getFileByNameDB(file.name);
    if (existingFile) {
      log.warn("Graph already exists. Skipping addition.");
      return existingFile.id;
    }
    const newId = await addGraphDB(file);
    return newId;
  } catch (error) {
    throw new Error(`Failed to add graph if not exists: ${error}`);
  }
}

export async function removeGraphDB(id) {
  try {
    await db.uploadedFiles.delete(id);
    log.info(`File with id ${id} successfully removed.`);
    return true;
  } catch (error) {
    throw new Error(`Failed to remove file with id ${id}: ${error}`);
  }
}

export async function removeGraphByNameDB(name) {
  if (name === exampleGraphJson.name) {
    throw new Error(`The example graph cannot be removed`);
  }

  try {
    const file = await getFileByNameDB(name);
    if (!file) {
      log.info(`No file found with the name ${name}.`);
      return false; // Indicate failure
    }

    await db.uploadedFiles.delete(file.id);
    log.info(`File with name ${name} and id ${file.id} successfully removed.`);
    return true;
  } catch (error) {
    throw new Error(`Failed to remove file with name ${name}: ${error}`);
  }
}

export async function fromAllGetGraphNameDB() {
  try {
    const files = await db.uploadedFiles.toCollection().distinct().toArray();
    const names = files.map((file) => file.name);
    return names;
  } catch (error) {
    throw new Error(`Failed to retrieve file names: ${error}`);
  }
}
