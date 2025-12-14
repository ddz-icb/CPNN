function getNodeVisual(node, nodeMapEntry, threeD) {
  const circle = nodeMapEntry?.circle;
  const nodeLabel = nodeMapEntry?.nodeLabel;

  if (!circle) return null;

  if (threeD && circle && circle.visible === false) {
    return null;
  }

  const scale = circle?.scale?.x ?? 1;
  const depth = circle?.zIndex != null ? -circle.zIndex : 0;
  const x = circle?.x ?? node.x ?? 0;
  const y = circle?.y ?? node.y ?? 0;

  return {
    ...node,
    x,
    y,
    scale,
    depth,
    labelVisible: nodeLabel?.visible ?? false,
    labelX: nodeLabel?.x ?? x,
    labelY: nodeLabel?.y ?? y,
    labelText: nodeLabel?.text ?? node.id,
  };
}

function getGridLines(camera) {
  const gridLines = camera?.current?.gridLines2D ?? camera?.gridLines2D;
  if (!Array.isArray(gridLines)) return [];

  return gridLines.map((line) => ({
    x1: line.x1 ?? 0,
    y1: line.y1 ?? 0,
    x2: line.x2 ?? 0,
    y2: line.y2 ?? 0,
    depth: line.depth ?? 0,
    edge: !!line.edge,
    width: line.width ?? 1,
  }));
}

export function buildExportGraphData(graphData, nodeMap, { threeD, camera } = {}) {
  if (!graphData?.nodes || !graphData?.links) return null;

  const nodes = [];
  const nodeLookup = new Map();

  for (const node of graphData.nodes) {
    const visual = getNodeVisual(node, nodeMap?.[node.id], threeD);
    if (!visual) continue;
    nodes.push(visual);
    nodeLookup.set(node.id, visual);
  }

  const links = graphData.links
    .map((link) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source;
      const targetId = typeof link.target === "object" ? link.target.id : link.target;

      const source = nodeLookup.get(sourceId);
      const target = nodeLookup.get(targetId);
      if (!source || !target) return null;

      const depth = Math.max(source.depth ?? 0, target.depth ?? 0);

      return {
        ...link,
        depth,
        source: { x: source.x, y: source.y, scale: source.scale, depth: source.depth },
        target: { x: target.x, y: target.y, scale: target.scale, depth: target.depth },
      };
    })
    .filter(Boolean);

  const gridLines = threeD ? getGridLines(camera) : [];

  return { nodes, links, gridLines };
}
