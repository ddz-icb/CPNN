import { getCentroid, getLinkWeight } from "../graph_calculations/graphUtils.js";

export const accuracyBarnesHut = 0.1;
export const maxDistanceChargeForce = 300;
export const nodeRepulsionMultiplier = -300;
export const borderMultiplier = 10;

const minLinkLengthFactor = 0.15;

export function borderCheck(radius, borderHeight, borderWidth, center, borderDepth = Math.min(borderHeight, borderWidth)) {
  let nodes;
  let strength = 1;

  const leftBorder = center.x - (borderWidth * strength) / 2;
  const rightBorder = center.x + (borderWidth * strength) / 2;
  const topBorder = center.y - (borderHeight * strength) / 2;
  const bottomBorder = center.y + (borderHeight * strength) / 2;
  const centerZ = center?.z ?? 0;
  const nearBorder = centerZ - (borderDepth * strength) / 2;
  const farBorder = centerZ + (borderDepth * strength) / 2;

  function force(alpha) {
    for (const node of nodes) {
      let dx = 0,
        dy = 0;
      if (node.x < leftBorder + radius) dx += (leftBorder + radius - node.x) * strength;
      else if (node.x > rightBorder - radius) dx += (rightBorder - radius - node.x) * strength;

      if (node.y < topBorder + radius) dy += (topBorder + radius - node.y) * strength;
      else if (node.y > bottomBorder - radius) dy += (bottomBorder - radius - node.y) * strength;

      node.vx += dx * alpha;
      node.vy += dy * alpha;

      if (node.z != null) {
        let dz = 0;
        if (node.z < nearBorder + radius) dz += (nearBorder + radius - node.z) * strength;
        else if (node.z > farBorder - radius) dz += (farBorder - radius - node.z) * strength;

        node.vz = (node.vz ?? 0) + dz * alpha;
      }
    }
  }

  force.initialize = (_) => {
    nodes = _;
  };
  force.strength = (_) => (_ === undefined ? strength : ((strength = _), force));
  return force;
}

export function groupRepulsionForce(IdToGroup, centroidThreshold) {
  let nodes;
  let strength = 0.1;

  let groupIds = [];
  let nodeToGroup = new Map();

  function initialize(n) {
    nodes = n;

    const idSet = new Set(Object.values(IdToGroup));
    groupIds = [...idSet];

    nodeToGroup.clear();
    for (const node of nodes) {
      nodeToGroup.set(node, IdToGroup[node.id]);
    }
  }

  function force(alpha) {
    if (!nodes) return;

    const groupSums = new Map();
    for (const compId of groupIds) {
      groupSums.set(compId, { x: 0, y: 0, z: 0, count: 0 });
    }

    for (const node of nodes) {
      const compId = nodeToGroup.get(node);
      const acc = groupSums.get(compId);
      acc.x += node.x;
      acc.y += node.y;
      acc.z += node.z ?? 0;
      acc.count++;
    }

    const centroids = [];
    for (const [compId, { x, y, z, count }] of groupSums) {
      if (count >= centroidThreshold) {
        centroids.push({
          compId,
          x: x / count,
          y: y / count,
          z: z / count,
        });
      }
    }

    const strengthFactor = strength * centroidThreshold * alpha;

    for (const node of nodes) {
      const compId = nodeToGroup.get(node);

      for (const centroid of centroids) {
        if (centroid.compId === compId) continue;

        const dx = centroid.x - node.x;
        const dy = centroid.y - node.y;
        const dz = (centroid.z ?? 0) - (node.z ?? 0);
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < 1e-4) continue;
        const inverseDist = 1 / Math.sqrt(distSq);
        const f = strengthFactor * inverseDist;

        node.vx -= dx * f;
        node.vy -= dy * f;
        if (node.vz != null) {
          node.vz -= dz * f;
        }
      }
    }
  }

  force.initialize = initialize;
  force.strength = (s) => (s === undefined ? strength : ((strength = s), force));
  return force;
}

export function circularForce(IdToComp, adjacentCountMap, minCircleSize) {
  let nodes;
  let strength = 1;
  let groupIdToNodes = new Map();
  let groupIdToNodesSorted = new Map();
  let groupIdToRadius = new Map();

  function recomputeGroups() {
    groupIdToNodes.clear();
    for (const n of nodes) {
      const gId = IdToComp[n.id];
      if (!groupIdToNodes.has(gId)) groupIdToNodes.set(gId, []);
      groupIdToNodes.get(gId).push(n);
    }
    groupIdToNodesSorted.clear();
    groupIdToRadius.clear();
    for (const [id, group] of groupIdToNodes) {
      groupIdToNodesSorted.set(
        id,
        group.slice().sort((a, b) => adjacentCountMap.get(b.id) - adjacentCountMap.get(a.id))
      );
      groupIdToRadius.set(id, 50 * Math.sqrt(group.length));
    }
  }

  function force(alpha) {
    const centroids = new Map();

    for (const [id, group] of groupIdToNodes) {
      centroids.set(id, getCentroid(group));
    }

    // circular layout
    for (const [id, centroid] of centroids) {
      const group = groupIdToNodesSorted.get(id);
      if (group.length < minCircleSize) continue;
      const radius = groupIdToRadius.get(id);
      const len = group.length;
      for (let i = 0; i < len; i++) {
        const angle = (2 * Math.PI * i) / len - Math.PI / 2;
        const targetX = centroid.x + radius * Math.cos(angle);
        const targetY = centroid.y + radius * Math.sin(angle);
        const dx = targetX - group[i].x;
        const dy = targetY - group[i].y;
        const targetZ = centroid.z ?? 0;
        const dz = targetZ - (group[i].z ?? 0);
        group[i].vx += dx * alpha * strength;
        group[i].vy += dy * alpha * strength;
        group[i].vz = (group[i].vz ?? 0) + dz * alpha * strength;
      }
    }

    const centroidIds = [...centroids.keys()];
    for (let i = 0; i < centroidIds.length; i++) {
      const id1 = centroidIds[i];
      const c1 = centroids.get(id1);
      const radius1 = groupIdToRadius.get(id1);
      const nodes1 = groupIdToNodes.get(id1);

      for (let j = i + 1; j < centroidIds.length; j++) {
        const id2 = centroidIds[j];
        const c2 = centroids.get(id2);
        const radius2 = groupIdToRadius.get(id2);

        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dz = (c2.z ?? 0) - (c1.z ?? 0);
        const distSq = dx * dx + dy * dy + dz * dz;

        const minDist = radius1 + radius2 + 10;
        const minDistSq = minDist * minDist;

        if (distSq < minDistSq && distSq > 0) {
          const dist = Math.sqrt(distSq);

          const overlap = minDist - dist;
          const force = (overlap / dist) * alpha * strength;

          const forceX = dx * force;
          const forceY = dy * force;
          const forceZ = dz * force;

          const nodes2 = groupIdToNodes.get(id2);

          for (const n of nodes1) {
            n.vx -= forceX;
            n.vy -= forceY;
            n.vz = (n.vz ?? 0) - forceZ;
          }
          for (const n of nodes2) {
            n.vx += forceX;
            n.vy += forceY;
            n.vz = (n.vz ?? 0) + forceZ;
          }
        }
      }
    }
  }

  force.initialize = (_) => {
    nodes = _;
    recomputeGroups();
  };

  return force;
}

export function gravityForce(x, y, z) {
  let nodes;
  let strength = 0.1;

  function force(alpha) {
    for (const node of nodes) {
      node.vx += (x - node.x) * strength * alpha;
      node.vy += (y - node.y) * strength * alpha;

      if (node.z != null) {
        node.vz = (node.vz ?? 0) + (z - node.z) * strength * alpha;
      }
    }
  }

  force.initialize = (_) => {
    nodes = _;
  };
  force.strength = (_) => (_ === undefined ? strength : ((strength = _), force));
  return force;
}

export function getLinkDistance(baseLength, link) {
  const weight = getLinkWeight(link);
  if (!Number.isFinite(weight)) {
    return baseLength;
  }

  const normalized = Math.min(Math.max(weight, 0), 1);
  const scaledLength = baseLength * (1 - normalized);
  return Math.max(scaledLength, baseLength * minLinkLengthFactor);
}

function getEndpointId(endpoint) {
  if (endpoint == null) return null;
  if (typeof endpoint === "object") {
    if (endpoint.id != null) return endpoint.id;
    if (endpoint.data?.id != null) return endpoint.data.id;
  }
  return endpoint;
}

export function getAdjacentNodes(graphData, nodeId) {
  if (!graphData || !nodeId) return [];
  const { nodes = [], links = [] } = graphData;
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const adjacencyMap = new Map();

  links.forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    if (sourceId !== nodeId && targetId !== nodeId) return;

    const neighborId = sourceId === nodeId ? targetId : sourceId;
    if (!neighborId || neighborId === nodeId) return;

    const neighborNode = nodeMap.get(neighborId);
    if (!neighborNode) return;

    const entry = adjacencyMap.get(neighborId) ?? {
      node: neighborNode,
      connections: [],
      maxWeight: 0,
    };

    const attribs = Array.isArray(link.attribs) ? link.attribs : [];
    const weights = Array.isArray(link.weights) ? link.weights : [];
    attribs.forEach((attrib, index) => {
      entry.connections.push({
        type: attrib,
        weight: weights[index],
      });
    });

    entry.maxWeight = Math.max(entry.maxWeight, getLinkWeight(link) ?? 0);
    adjacencyMap.set(neighborId, entry);
  });

  return Array.from(adjacencyMap.values()).sort((a, b) => {
    if (b.maxWeight !== a.maxWeight) {
      return (b.maxWeight ?? 0) - (a.maxWeight ?? 0);
    }
    const labelA = a.node?.id ?? "";
    const labelB = b.node?.id ?? "";
    return labelA.localeCompare(labelB);
  });
}
