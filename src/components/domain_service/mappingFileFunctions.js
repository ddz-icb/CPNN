import log from "../../logger.js";
import { addMappingFileDB, fromAllGetMappingNameDB, getMappingDB, removeMappingFileByNameDB } from "../repository/repoMappings.js";

export async function loadAnnotationMappings(setGraphData) {
  const mappings = await fromAllGetMappingNameDB();
  setGraphData("uploadedAnnotationMappingNames", mappings);
}

export async function selectMapping(mappingName, setGraphData) {
  const { mapping, file } = await getMappingDB(mappingName);

  setGraphData("activeAnnotationMapping", mapping);
  log.info("Mapping Loaded Successfully:", mapping);
}

export async function addNewAnnotationMappingFile(file, uploadedAnnotationMappingNames, setGraphData) {
  const mappingFile = await parseAnnotationMappingFile(file);
  addMappingFileDB(mappingFile);
  setGraphData("uploadedAnnotationMappingNames", [...(uploadedAnnotationMappingNames || []), file.name]);
}

export function deleteAnnotationMapping(uploadedAnnotationMappingNames, mappingName, setGraphData) {
  const updatedMappingNames = uploadedAnnotationMappingNames?.filter((name) => name !== mappingName);
  setGraphData("uploadedAnnotationMappingNames", updatedMappingNames);
  removeMappingFileByNameDB(mappingName);
}
