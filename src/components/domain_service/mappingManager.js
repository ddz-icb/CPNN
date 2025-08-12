import log from "../../logger.js";
import { parseMappingFile } from "../other/parseFiles.js";
import { addMappingFileDB, fromAllGetMappingNameDB, getMappingDB, removeMappingFileByNameDB } from "../repository/MappingRepo.js";

export async function loadMappings(setGraphData) {
  const mappings = await fromAllGetMappingNameDB();
  setGraphData("uploadedMappingNames", mappings);
}

export async function selectMapping(mappingName, setGraphData) {
  const { mapping, file } = await getMappingDB(mappingName);

  setGraphData("activeMapping", mapping);
  log.info("Mapping Loaded Successfully:", mapping);
}

export async function addNewMappingFile(file, uploadedMappingNames, setGraphData) {
  const mappingFile = await parseMappingFile(file);
  addMappingFileDB(mappingFile);
  setGraphData("uploadedMappingNames", [...(uploadedMappingNames || []), file.name]);
}

export function deleteMapping(uploadedMappingNames, mappingName, setGraphData) {
  const updatedMappingNames = uploadedMappingNames?.filter((name) => name !== mappingName);
  setGraphData("uploadedMappingNames", updatedMappingNames);
  removeMappingFileByNameDB(mappingName);
}
