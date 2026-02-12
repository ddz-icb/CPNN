export function filterThreshold(graphData, linkThreshold) {
  if (linkThreshold === 0) return graphData;

  graphData = {
    ...graphData,
    links: graphData.links
      .map((link) => {
        const keep = link.weights.map((weight) => Math.abs(weight) >= linkThreshold);
        const filteredAttribs = link.attribs.filter((_, i) => keep[i]);
        const filteredWeights = link.weights.filter((_, i) => keep[i]);

        return {
          ...link,
          attribs: filteredAttribs,
          weights: filteredWeights,
        };
      })
      .filter((link) => link.attribs.length > 0),
  };
  return graphData;
}

export function filterLinkAttribs(graphData, filterRequest) {
  // linkAttribs is true if the filterRequest was empty
  if (filterRequest === true) return graphData;

  graphData = {
    ...graphData,
    links: graphData.links
      .map((link) => {
        for (const andTerm of filterRequest) {
          let meetsTerm = false;

          for (let i = 0; i < andTerm.length; i++) {
            const element = andTerm[i];

            if (element === "=") {
              const nextElement = andTerm[i + 1];

              if (link.attribs.length == nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "<") {
              const nextElement = andTerm[i + 1];

              if (link.attribs.length < nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "<=") {
              const nextElement = andTerm[i + 1];

              if (link.attribs.length <= nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === ">=") {
              const nextElement = andTerm[i + 1];

              if (link.attribs.length >= nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === ">") {
              const nextElement = andTerm[i + 1];

              if (link.attribs.length > nextElement) {
                meetsTerm = true;
              }
              i++;
            } else if (element === "not") {
              const nextElement = andTerm[i + 1];

              if (nextElement instanceof Set) {
                for (const e of nextElement) {
                  if (!link.attribs.some((attrib) => attrib.toString().toLowerCase().includes(e.toString().toLowerCase()))) {
                    meetsTerm = true;
                  }
                }
              } else if (!link.attribs.some((attrib) => attrib.toString().toLowerCase().includes(nextElement.toString().toLowerCase()))) {
                meetsTerm = true;
              }
              i++;
            } else {
              if (element instanceof Set) {
                let allTrue = true;
                for (const e of element) {
                  if (!link.attribs.some((attrib) => attrib.toString().toLowerCase().includes(e.toString().toLowerCase()))) {
                    allTrue = false;
                  }
                }
                if (allTrue) meetsTerm = true;
              } else {
                link.attribs.forEach((attrib, i) => {
                  if (attrib.toString().toLowerCase().includes(element.toString().toLowerCase())) {
                    meetsTerm = true;
                  }
                });
              }
            }
          }

          if (meetsTerm === false) {
            // doensn't meet all terms
            return {
              ...link,
              attribs: [],
            };
          }
        }

        return {
          ...link,
        };
      })
      .filter((link) => link.attribs.length > 0),
  };

  return graphData;
}

export function filterNodesExist(graphData) {
  const nodeSet = new Set(graphData.nodes.map((node) => node.id));

  return {
    ...graphData,
    links: graphData.links.filter((link) => nodeSet.has(link.source.id || link.source) && nodeSet.has(link.target.id || link.target)),
  };
}

export function filterIgnoreNegatives(graphData, ignoreNegatives) {
  if (!ignoreNegatives) return graphData;

  graphData.links = graphData.links.map((link) => {
    const keep = link.weights.map((weight) => weight >= 0);
    const filteredAttribs = link.attribs.filter((_, i) => keep[i]);
    const filteredWeights = link.weights.filter((_, i) => keep[i]);

    return {
      ...link,
      attribs: filteredAttribs,
      weights: filteredWeights,
    };
  });
  return graphData;
}

export function filterLasso(graphData, selectedNodeIds) {
  if (!Array.isArray(selectedNodeIds) || selectedNodeIds.length === 0) {
    return graphData;
  }
  const selectedNodesSet = new Set(selectedNodeIds);
  graphData.nodes = graphData.nodes.filter((node) => selectedNodesSet.has(node.id));
  graphData.links = graphData.links.filter((link) => selectedNodesSet.has(link.source) && selectedNodesSet.has(link.target));
  return graphData;
}
