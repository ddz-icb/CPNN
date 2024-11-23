import log from "../../logger.js";
import { getByNameDB } from "./db.js";

export async function selectGraph(filename, setGraph, setActiveFiles) {
  const file = getByNameDB(filename);
  if (!file) throw new Error(`No file found with the name ${filename}.`);
  setActiveFiles([file]);

  const graph = JSON.parse(file.content);
  if (!graph) throw new Error("File format not recognized");

  setGraph(graph);
  log.info("Graph Loaded Successfully:", graph);
}
