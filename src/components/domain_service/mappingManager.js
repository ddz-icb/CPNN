import log from "../../logger.js";
import { parseMappingFile } from "../other/parseFiles.js";
import { addMappingDB, fromAllGetMappingNameDB, getMappingDB, removeMappingByNameDB } from "../repository/mappingRepo.js";

export async function loadMappings(setMappingData) {
  const mappings = await fromAllGetMappingNameDB();
  setMappingData("uploadedMappingNames", mappings);
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

export async function deleteMapping(uploadedMappingNames, mappingName) {
  const updatedMappingNames = uploadedMappingNames?.filter((name) => name !== mappingName);
  await removeMappingByNameDB(mappingName);
  return updatedMappingNames;
}
