import log from "../../logger.js";
import { getByNameDB } from "./db.js";

export async function selectGraph(filename, setGraph, setActiveFiles) {
  const file = await getByNameDB(filename);
  if (!file || !file.content) throw new Error(`No file found with the name ${filename}.`);

  const graph = JSON.parse(file.content);
  if (!graph) throw new Error("File format not recognized");

  setGraph(graph);
  setActiveFiles([file]);
  log.info("Graph Loaded Successfully:", graph);
}
