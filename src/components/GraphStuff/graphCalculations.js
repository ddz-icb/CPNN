export function joinGraphs(graph, newGraph) {
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, { ...node }]));

  newGraph.nodes.forEach((node) => {
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

  const combinedNodes = Array.from(nodeMap.values());

  const linkMap = new Map(
    graph.links.map((link) => [`${link.source}-${link.target}`, { ...link }])
  );

  newGraph.links.forEach((link) => {
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

  const combinedLinks = Array.from(linkMap.values());

  const reformattedGraph = {
    nodes: combinedNodes,
    links: combinedLinks,
  };

  return reformattedGraph;
}

export function returnComponentData(graph) {
  const idToIndexMap = {};
  graph.nodes.forEach((node, index) => {
    idToIndexMap[node.id] = index;
  });

  const UnionFind = require("union-find");
  const uf = new UnionFind(graph.nodes.length);
  graph.links.forEach((link) => {
    // checking link.source.id and link.source for safety as d3 replaces the id in source with a graphics objects
    const sourceIndex = idToIndexMap[link.source.id || link.source];
    const targetIndex = idToIndexMap[link.target.id || link.target];
    uf.link(sourceIndex, targetIndex);
  });

  const componentArray = [];
  const componentSizeArray = [];
  graph.nodes.forEach((node) => {
    const component = uf.find(idToIndexMap[node.id]);
    componentSizeArray[component] = componentSizeArray[component]
      ? componentSizeArray[component] + 1
      : 1;

    componentArray[node.id] = component;
  });
  return [componentArray, componentSizeArray];
}

export function returnAdjacentData(graph) {
  const adjacentData = {};

  graph.links.forEach((link) => {
    adjacentData[link.source.id] = (adjacentData[link.source.id] || 0) + 1;
    adjacentData[link.target.id] = (adjacentData[link.target.id] || 0) + 1;
  });

  const adjacentMap = new Map();
  Object.keys(adjacentData).forEach((key) => {
    adjacentMap.set(key, adjacentData[key]);
  });

  return adjacentMap;
}

export function filterByThreshold(graph, linkThreshold) {
  if (linkThreshold === 0) return graph;

  graph = {
    ...graph,
    links: graph.links
      .map((link) => {
        const filteredAttribs = link.attribs.filter(
          (_, i) => link.weights[i] >= linkThreshold
        );
        const filteredWeights = link.weights.filter(
          (weight) => weight >= linkThreshold
        );

        return {
          ...link,
          attribs: filteredAttribs,
          weights: filteredWeights,
        };
      })
      .filter((link) => link.attribs.length > 0),
  };
  return graph;
}

export function filterNodesExist(graph) {
  const nodeSet = new Set(graph.nodes.map((node) => node.id));

  return {
    ...graph,
    links: graph.links.filter(
      (link) =>
        nodeSet.has(link.source.id || link.source) &&
        nodeSet.has(link.target.id || link.target)
    ),
  };
}

export function filterMinComponentSize(graph, minComponentSize) {
  if (minComponentSize === 1) return graph;

  const [componentArray, componentSizeArray] = returnComponentData(
    graph,
    graph.nodes
  );

  graph = {
    ...graph,
    nodes: graph.nodes.filter(
      (node) => componentSizeArray[componentArray[node.id]] >= minComponentSize
    ),
    links: graph.links.filter((link) => {
      const sourceExists =
        componentSizeArray[componentArray[link.source.id || link.source]] >=
        minComponentSize;
      const targetExists =
        componentSizeArray[componentArray[link.target.id || link.target]] >=
        minComponentSize;

      return sourceExists && targetExists;
    }),
  };

  return graph;
}

export function filterByAttribs(graph, filterRequest) {
  // linkAttribs is true if the filterRequest was empty
  if (filterRequest === true) return graph;

  graph = {
    ...graph,
    links: graph.links
      .map((link) => {
        // if value at position = 1, the link will be drawn if meetsAll = true
        let newLinks = new Array(link.attribs.length).fill(0);

        for (const andTerm of filterRequest) {
          let meetsTerm = false;

          for (const element of andTerm) {
            link.attribs.forEach((attrib, i) => {
              if (
                attrib
                  .toString()
                  .toLowerCase()
                  .includes(element.toString().toLowerCase())
              ) {
                newLinks[i] = 1;
                meetsTerm = true;
              }
            });
          }

          if (meetsTerm === false) {
            // doens't meet all terms
            return {
              ...link,
              attribs: [],
            };
          }
        }

        // meets all Terms
        // const filteredAttribs = link.attribs.filter(
        //   (attrib, i) => newLinks[i] === 1
        // );
        // const filteredWeights = link.weights.filter(
        //   (weights, i) => newLinks[i] === 1
        // );

        return {
          ...link,
          // attribs: filteredAttribs,
          // weight: filteredWeights,
        };
      })
      .filter((link) => link.attribs.length > 0),
  };

  return graph;
}

export function filterNodeGroups(graph, filterRequest) {
  // nodeGroups is true if the filterRequest was empty
  if (filterRequest === true) return graph;

  graph = {
    ...graph,
    nodes: graph.nodes
      .map((node) => {
        for (const andTerm of filterRequest) {
          let meetsTerm = false;

          for (const element of andTerm) {
            node.groups.forEach((group, i) => {
              if (
                group
                  .toString()
                  .toLowerCase()
                  .includes(element.toString().toLowerCase())
              ) {
                meetsTerm = true;
              }
            });
          }

          if (meetsTerm === false) {
            // doens't meet all terms
            return {
              ...node,
              groups: [],
            };
          }
        }

        // meets all terms
        return {
          ...node,
          groups: node.groups,
        };
      })
      .filter((node) => node.groups.length > 0),
  };

  return graph;
}

export function deleteNode(graph, circles, nodeToDelete) {
  let filteredGraph = {
    ...graph,
    nodes: graph.nodes.filter((node) => node.id !== nodeToDelete),
  };

  return filteredGraph;
}

export function filterActiveCircles(circles, graph, circleNodeMap) {
  circles.children.forEach((circle) => (circle.visible = false));
  graph.nodes.forEach((node) => {
    circleNodeMap[node.id].circle.visible = true;
  });
}

export function applyNodeMapping(graph, mapping) {
  if (mapping === null) {
    return graph;
  }

  const nodeMapping = mapping.nodeMapping;

  graph.nodes.forEach((node) => {
    const entries = node.id.split(";");
    const protIdsForLookup = new Set(
      entries.map((entry) => entry.split("_")[0])
    );

    protIdsForLookup.forEach((protId) => {
      const isIsoform = protId.includes("-");
      if (isIsoform) {
        const protIdNoIsoform = protId.split("-")[0];
        protIdsForLookup.add(protIdNoIsoform);
      }
    });

    let groupsSet = new Set();
    protIdsForLookup.forEach((protId) => {
      if (nodeMapping[protId]) {
        groupsSet = new Set([
          ...groupsSet,
          ...nodeMapping[protId].pathwayNames,
        ]);
      }
    });
    node.groups = Array.from(groupsSet);
  });

  return graph;
}

export function getGroupToColorIndex(graph) {
  const groupToColorIndex = [];
  let i = 0;

  graph.nodes.forEach((node) => {
    node.groups.forEach((group) => {
      if (!groupToColorIndex.hasOwnProperty(group)) {
        groupToColorIndex[group] = i;
        i += 1;
      }
    });
  });

  return groupToColorIndex;
}

export function getAttribToColorIndex(graph) {
  const attribToColorIndex = [];
  let i = 0;

  graph.links.forEach((link) => {
    link.attribs.forEach((attrib) => {
      if (!attribToColorIndex.hasOwnProperty(attrib)) {
        attribToColorIndex[attrib] = i;
        i += 1;
      }
    });
  });

  return attribToColorIndex;
}
