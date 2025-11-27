export function getMatchingNodes(nodes, query) {
  if (!query) {
    return [];
  }

  return nodes.filter((node) => nodeMatchesQuery(node, query));
}

function nodeMatchesQuery(node, query) {
  return matchesQuery([node?.label, node?.id, node?.group, node?.type], query);
}

function matchesQuery(values, query) {
  return values.some((value) => {
    if (value === undefined || value === null) return false;
    return value.toString().toLowerCase().includes(query);
  });
}

export function applySearch(query, nodes) {
  if (!query) return;

  const matches = getMatchingNodes(nodes ?? [], query);

  return matches
}
