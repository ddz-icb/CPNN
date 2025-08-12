import log from "../../logger.js";
import Dexie from "dexie";

export const db = new Dexie("mappings");

db.version(1).stores({
  uploadedFiles: "++id, name",
});

async function getByNameDB(name) {
  try {
    const file = await db.uploadedFiles.where("name").equals(name).first();
    return file;
  } catch (error) {
    throw new Error(`Failed to retrieve file with name ${name}: ${error}`);
  }
}

export async function getMappingDB(filename) {
  const file = await getByNameDB(filename);
  if (!file) throw new Error("No file found");

  const mappingObject = JSON.parse(file);
  if (!mappingObject) throw new Error("File format not recognized");
  return mappingObject;
}

export async function addMappingDB(file) {
  try {
    const existingFile = await getByNameDB(file.name);
    if (existingFile) throw new Error("Mapping already exists");

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

export async function addMappingIfNotExistsDB(file) {
  try {
    const existingFile = await getByNameDB(file.name);
    if (existingFile) {
      log.info("Mapping already exists");
      return existingFile.id;
    }

    const id = await db.uploadedFiles.add({
      name: file.name,
      content: file.content,
    });
    log.info(`File ${file.name} successfully added. Got id ${id}`);
    return id;
  } catch (error) {
    throw new Error(`Failed to add mapping if not exists: ${error}`);
  }
}

export async function removeMappingDB(id) {
  try {
    await db.uploadedFiles.delete(id);
    log.info(`File with id ${id} successfully removed.`);
    return true;
  } catch (error) {
    throw new Error(`Failed to remove file with id ${id}: ${error}`);
  }
}

export async function removeMappingByNameDB(name) {
  try {
    const file = await getByNameDB(name);
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

export async function fromAllGetMappingNameDB() {
  try {
    const files = await db.uploadedFiles.toCollection().distinct().toArray();
    const names = files.map((file) => file.name);
    return names;
  } catch (error) {
    throw new Error(`Failed to retrieve file names: ${error}`);
  }
}
