import log from "../../logger.js";
import { parseMappingFile } from "../other/parseFiles.js";
import { addMappingFileDB, fromAllGetMappingNameDB, getMappingDB, removeMappingFileByNameDB } from "../repository/MappingRepo.js";

export async function loadMappings(setMappingData) {
  const mappings = await fromAllGetMappingNameDB();
  setMappingData("uploadedMappingNames", mappings);
}

export async function selectMapping(mappingName, setMappingData) {
  const { mapping, file } = await getMappingDB(mappingName);

  setMappingData("activeMapping", mapping);
}

export async function createMapping(file, uploadedMappingNames, setMappingData) {
  const mappingFile = await parseMappingFile(file);
  addMappingFileDB(mappingFile);
  setMappingData("uploadedMappingNames", [...(uploadedMappingNames || []), file.name]);
}

export function deleteMapping(uploadedMappingNames, mappingName, setMappingData) {
  const updatedMappingNames = uploadedMappingNames?.filter((name) => name !== mappingName);
  setMappingData("uploadedMappingNames", updatedMappingNames);
  removeMappingFileByNameDB(mappingName);
}
