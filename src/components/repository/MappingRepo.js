import log from "../../logger.js";
import Dexie from "dexie";

export const db = new Dexie("mappings");

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

export async function getMappingDB(filename) {
  const file = await getFileByNameDB(filename);

  const mappingObject = JSON.parse(file.content);
  if (!mappingObject) throw new Error("File format not recognized");
  return mappingObject;
}

export async function addMappingFileDB(file) {
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

export async function addMappingFileIfNotExistsDB(file) {
  try {
    const existingFile = await getFileByNameDB(file.name);
    if (existingFile) {
      log.warn("Mapping already exists. Skipping addition.");
      return existingFile.id;
    }
    const newId = await addMappingFileDB(file);
    return newId;
  } catch (error) {
    throw new Error(`Failed to add mapping if not exists: ${error}`);
  }
}

export async function removeMappingFileDB(id) {
  try {
    await db.uploadedFiles.delete(id);
    log.info(`File with id ${id} successfully removed.`);
    return true;
  } catch (error) {
    throw new Error(`Failed to remove file with id ${id}: ${error}`);
  }
}

export async function removeMappingFileByNameDB(name) {
  try {
    const file = await getFileByNameDB(name);
    if (!file) {
      log.info(`No file found with the name ${name}.`);
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

export async function getByMappingNameDB(name) {
  try {
    const file = await getFileByNameDB(name);
    return file;
  } catch (error) {
    throw new Error(`Failed to retrieve file with name ${name}: ${error}`);
  }
}
