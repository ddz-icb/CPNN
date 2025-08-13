import log from "../../logger.js";
import { parseMappingFile } from "../other/parseFiles.js";
import { addMappingDB, fromAllGetMappingNameDB, getMappingDB, removeMappingByNameDB } from "../repository/mappingRepo.js";

export async function loadMappingNames() {
  const mappings = await fromAllGetMappingNameDB();
  return mappings;
}

export async function selectMapping(mappingName) {
  const mapping = await getMappingDB(mappingName);
  return mapping;
}

export async function createMapping(file) {
  const mappingObject = await parseMappingFile(file);
  await addMappingDB(mappingObject);
  return mappingObject;
}

export async function deleteMapping(mappingName) {
  await removeMappingByNameDB(mappingName);
}
