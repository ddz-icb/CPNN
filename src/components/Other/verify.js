export function isMapping(obj) {
  if (typeof obj !== "object" || obj === null || !Array.isArray(obj.links) || !Array.isArray(obj.nodes)) {
    log.info("right here officer. this one 1");
    return false;
  }

  for (let node of obj.nodes) {
    if (typeof node !== "object" || typeof node.group !== "number" || typeof node.name !== "string") {
      log.info("right here officer. this one 2");
      return false;
    }
  }

  for (let link of obj.links) {
    if (typeof link !== "object" || typeof link.attrib !== "number" || typeof link.name !== "string") {
      log.info("right here officer. this one 3");
      return false;
    }
  }

  return true;
}
