import { exampleGraphJson } from "./exampleGraphJSON.js";
import gloBISpeciesInteractionsData from "./GloBISpeciesInteractions.json";
import tokyoRailwaySystemData from "./TokyoRailwaySystem.json";
import { defaultExampleGraphName, exampleGraphNames, isExampleGraphName as isKnownExampleGraphName } from "./exampleGraphMetadata.js";

export const exampleGraphs = [
  {
    ...exampleGraphJson,
    label: "Co-phosphorylation Network",
    description: "Default protein phosphorylation example",
  },
  {
    name: "GloBISpeciesInteractions",
    label: "GloBI Species Interactions",
    description: "Species interaction network",
    data: gloBISpeciesInteractionsData,
  },
  {
    name: "TokyoRailwaySystem",
    label: "Tokyo Railway System",
    description: "Railway station network",
    data: tokyoRailwaySystemData,
  },
];

export const defaultExampleGraph = exampleGraphs.find((graph) => graph.name === defaultExampleGraphName) ?? exampleGraphs[0];
const exampleGraphsByName = new Map(exampleGraphs.map((graph) => [graph.name, graph]));

export function getExampleGraphByName(name) {
  return exampleGraphsByName.get(name) ?? null;
}

export function isExampleGraphName(name) {
  return isKnownExampleGraphName(name);
}

export { exampleGraphNames };
