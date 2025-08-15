export function joinGraphs(graphData, newGraphData) {
  const nodeMap = new Map(graphData.nodes.map((node) => [node.id, { ...node }]));

  newGraphData.nodes.forEach((node) => {
    if (nodeMap.has(node.id)) {
      const baseNode = nodeMap.get(node.id);
      nodeMap.set(node.id, {
        ...baseNode,
        groups: [...new Set([...baseNode.groups, ...node.groups])],
      });
    } else {
      nodeMap.set(node.id, { ...node });
    }
  });

  const joinedNodes = Array.from(nodeMap.values());

  const linkMap = new Map(graphData.links.map((link) => [`${link.source}-${link.target}`, { ...link }]));

  newGraphData.links.forEach((link) => {
    const key1 = `${link.source}-${link.target}`;
    const key2 = `${link.target}-${link.source}`;
    const baseLink = linkMap.get(key1) || linkMap.get(key2);

    if (baseLink) {
      const newAttribs = [];
      const newWeights = [];
      for (let i = 0; i < link.attribs.length; i++) {
        if (!baseLink.attribs.includes(link.attribs[i])) {
          newAttribs.push(link.attribs[i]);
          newWeights.push(link.weights[i]);
        }
      }
      baseLink.attribs.push(...newAttribs);
      baseLink.weights.push(...newWeights);

      if (linkMap.has(key1)) {
        linkMap.set(key1, baseLink);
      } else {
        linkMap.set(key2, baseLink);
      }
    } else {
      linkMap.set(key1, { ...link });
    }
  });

  const joinedLinks = Array.from(linkMap.values());

  const joinedGraphData = {
    nodes: joinedNodes,
    links: joinedLinks,
  };

  return joinedGraphData;
}

export function joinGraphNames(graphNames) {
  return graphNames.join("-");
}
