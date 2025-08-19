import { expectedPhysicTypes } from "../../adapters/state/physicsState.js";

export function verifyGraph(graph) {
  if (!graph.data || typeof graph.data !== "object") {
    throw new Error("Error while parsing the graph file. It does not have the right format.");
  }

  const { nodes, links } = graph.data;
  if (!Array.isArray(nodes) || !Array.isArray(links)) {
    throw new Error("Graph file must contain 'nodes' and 'links' arrays.");
  }

  nodes.forEach((node, i) => {
    if (node.id === undefined) {
      throw new Error(`Node at index ${i} is missing the 'id' property.`);
    }
    if (node.groups === undefined) {
      throw new Error(`Node at index ${i} is missing the 'groups' property.`);
    }
  });

  links.forEach((link, i) => {
    if (link.source === undefined) {
      throw new Error(`Link at index ${i} is missing the 'source' property.`);
    }
    if (link.target === undefined) {
      throw new Error(`Link at index ${i} is missing the 'target' property.`);
    }
    if (link.weights === undefined) {
      throw new Error(`Link at index ${i} is missing the 'weights' property.`);
    }
    if (link.attribs === undefined) {
      throw new Error(`Link at index ${i} is missing the 'attribs' property.`);
    }
  });

  if (graph.data.physics !== undefined) {
    const physics = graph.data.physics;
    if (typeof physics !== "object" || Array.isArray(physics)) {
      throw new Error("The 'physics' property must be an object.");
    }
    const expectedTypes = expectedPhysicTypes;

    for (const key in physics) {
      if (expectedTypes.hasOwnProperty(key)) {
        if (typeof physics[key] !== expectedTypes[key]) {
          throw new Error(`Invalid type for physics.${key}: expected ${expectedTypes[key]}, got ${typeof physics[key]}.`);
        }
      }
    }
  }
}
