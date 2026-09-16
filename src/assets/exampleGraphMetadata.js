export const defaultExampleGraphName = "ExampleGraph";

export const exampleGraphNames = [defaultExampleGraphName, "GloBISpeciesInteractions", "TokyoRailwaySystem"];

export function isExampleGraphName(name) {
  return exampleGraphNames.includes(name);
}
