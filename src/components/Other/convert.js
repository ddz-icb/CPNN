export function convertMappingToArray(mappingObj) {
  const mappingArray = [[], []];

  for (let node of mappingObj.nodes) {
    mappingArray[0][node.group] = node.name;
  }

  for (let link of mappingObj.links) {
    mappingArray[1][link.attrib] = link.name;
  }

  return mappingArray;
}
