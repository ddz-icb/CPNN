import log from "../../logger.js";
import Dexie from "dexie";

export const db = new Dexie("mappings");

db.version(1).stores({
  uploadedFiles: "++id, name",
});

async function getMappingByNameDB(mappingName) {
  try {
    const mapping = await db.uploadedFiles.where("name").equals(mappingName).first();
    return mapping;
  } catch (error) {
    throw new Error(`Failed to retrieve file with name ${mappingName}: ${error}`);
  }
}

export async function getMappingDB(filename) {
  const mapping = await getMappingByNameDB(filename);
  if (!mapping) throw new Error("No file found");
  return mapping;
}

export async function createMappingDB(mappingData, mappingName) {
  try {
    const mapping = await getMappingByNameDB(mappingName);
    if (mapping) throw new Error("Mapping already exists");

    const id = await db.uploadedFiles.add({
      name: mappingName,
      data: mappingData,
    });
    log.info(`File ${mappingName} successfully added. Got id ${id}`);
    return id;
  } catch (error) {
    throw new Error(`Failed to add ${mappingName}: ${error}`);
  }
}

export async function createMappingIfNotExistsDB(mappingData, mappingName) {
  try {
    const mapping = await getMappingByNameDB(mappingName);
    if (mapping) {
      log.info("Mapping already exists");
      return mapping.id;
    }

    const id = await db.uploadedFiles.add({
      name: mappingName,
      data: mappingData,
    });
    log.info(`File ${mappingName} successfully added. Got id ${id}`);
    return id;
  } catch (error) {
    throw new Error(`Failed to add mapping if not exists: ${error}`);
  }
}

export async function deleteMappingDB(mappingName) {
  try {
    const mapping = await getMappingByNameDB(mappingName);
    if (!mapping) {
      log.warn(`No file found with the name ${mappingName}.`);
      return false;
    }

    await db.uploadedFiles.delete(mapping.id);
    log.info(`File with name ${mappingName} and id ${mapping.id} successfully removed.`);
    return true;
  } catch (error) {
    throw new Error(`Failed to remove file with name ${mappingName}: ${error}`);
  }
}

export async function getAllMappingNamesDB() {
  try {
    const mappings = await db.uploadedFiles.toCollection().distinct().toArray();
    const mappingNames = mappings.map((mapping) => mapping.name);
    return mappingNames;
  } catch (error) {
    throw new Error(`Failed to retrieve file names: ${error}`);
  }
}
