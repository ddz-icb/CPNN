import { parseMappingFile } from "../domain_service/parsing/mappingParsing.js";
import { createMappingDB, deleteMappingDB, getAllMappingNamesDB, getMappingDB } from "../repository/mappingRepo.js";

export async function loadMappingNames() {
  const mappings = await getAllMappingNamesDB();
  return mappings;
}

export async function getMapping(mappingName) {
  const mapping = await getMappingDB(mappingName);
  return mapping;
}

export async function createMapping(file) {
  const mapping = await parseMappingFile(file);
  await createMappingDB(mapping);
  return mapping;
}

export async function deleteMapping(mappingName) {
  await deleteMappingDB(mappingName);
}
