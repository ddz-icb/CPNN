import { exampleGraphJson } from "./exampleGraphJSON.js";
import gloBISpeciesInteractionsData from "./GloBISpeciesInteractions.json" with { type: "json" };
import palmerPenguinsSimilarityData from "./PalmerPenguinsSimilarityGraph.json" with { type: "json" };
import tokyoRailwaySystemData from "./TokyoRailwaySystem.json" with { type: "json" };

export const exampleGraphs = [
  {
    ...exampleGraphJson,
    label: "Co-phosphorylation Network",
    description: "Default protein phosphorylation example",
  },
  {
    name: "GloBISpeciesInteractions",
    label: "GloBI Species Interactions",
    description: "Feeding, hosting, pollination, and flower visits across species",
    data: gloBISpeciesInteractionsData,
  },
  {
    name: "TokyoRailwaySystem",
    label: "Tokyo Railway System",
    description: "Railway station network",
    data: tokyoRailwaySystemData,
  },
  {
    name: "PalmerPenguinsSimilarityGraph",
    label: "Palmer Penguins Similarity",
    description: "342 penguins linked by bill, flipper, and body mass similarity",
    data: palmerPenguinsSimilarityData,
  },
];

export const defaultExampleGraphName = exampleGraphJson.name;
export const defaultExampleGraph = exampleGraphs.find((graph) => graph.name === defaultExampleGraphName) ?? exampleGraphs[0];
const exampleGraphsByName = new Map(exampleGraphs.map((graph) => [graph.name, graph]));

export function getExampleGraphByName(name) {
  return exampleGraphsByName.get(name) ?? null;
}

export function isExampleGraphName(name) {
  return exampleGraphsByName.has(name);
}
