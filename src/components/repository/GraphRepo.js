import { exampleGraphJson } from "../assets/exampleGraphJSON.js";
import log from "../logger.js";
import Dexie from "dexie";

export const db = new Dexie("graphs");

db.version(1).stores({
  uploadedFiles: "++id, name",
});

async function getGraphByNameDB(graphName) {
  try {
    const graph = await db.uploadedFiles.where("name").equals(graphName).first();
    return graph;
  } catch (error) {
    throw new Error(`Failed to retrieve file with name ${graphName}: ${error}`);
  }
}

export async function getGraphDB(filename) {
  const graph = await getGraphByNameDB(filename);
  if (!graph) throw new Error("No file found");
  return graph;
}

export async function createGraphDB(graph) {
  try {
    const existingGraph = await getGraphByNameDB(graph.name);
    if (existingGraph) throw new Error("Graph already exists");

    const id = await db.uploadedFiles.add({
      name: graph.name,
      data: graph.data,
    });
    log.info(`File ${graph.name} successfully added. Got id ${id}`);
    return id;
  } catch (error) {
    throw new Error(`Failed to add ${graph.name}: ${error}`);
  }
}

export async function createGraphIfNotExistsDB(graph) {
  try {
    const existingGraph = await getGraphByNameDB(graph.name);
    if (existingGraph) {
      log.info("Graph already exists");
      return existingGraph.id;
    }

    const id = await db.uploadedFiles.add({
      name: graph.name,
      data: graph.data,
    });
    log.info(`File ${graph.name} successfully added. Got id ${id}`);
    return id;
  } catch (error) {
    throw new Error(`Failed to add file if not exists: ${error}`);
  }
}

export async function deleteGraphDB(graphName) {
  try {
    const graph = await getGraphByNameDB(graphName);
    if (!graph) {
      log.warn(`No file found with the name ${graphName}.`);
      return false;
    }

    await db.uploadedFiles.delete(graph.id);
    log.info(`File with name ${graphName} and id ${graph.id} successfully removed.`);
    return true;
  } catch (error) {
    throw new Error(`Failed to remove file with name ${graphName}: ${error}`);
  }
}

export async function getAllGraphNamesDB() {
  try {
    const graphs = await db.uploadedFiles.toCollection().distinct().toArray();
    const graphNames = graphs.map((graph) => graph.name);
    return graphNames;
  } catch (error) {
    throw new Error(`Failed to retrieve file names: ${error}`);
  }
}
