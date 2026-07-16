export function createGraph({ nodes = defaultNodes(), links = [] } = {}) {
  return { nodes, links };
}

export function defaultNodes() {
  return [{ id: "A" }, { id: "B" }, { id: "C" }];
}

export function linkIds(graphData) {
  return graphData.links.map((link) => link.id);
}

export function nodeIds(graphData) {
  return graphData.nodes.map((node) => node.id);
}
