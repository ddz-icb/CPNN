import * as d3 from "d3";

const accuracyBarnesHut = 0.1;
const maxDistanceChargeForce = 300;
export const nodeRepulsionMultiplier = -100;
export const borderMultiplier = 10;

export function getSimulation(width, height, linkLength, xStrength, yStrength, nodeRepulsionStrength) {
  const simulation = d3
    .forceSimulation()
    .force(
      "charge",
      d3
        .forceManyBody()
        .theta(accuracyBarnesHut)
        .distanceMax(maxDistanceChargeForce)
        .strength(nodeRepulsionStrength * nodeRepulsionMultiplier)
    )
    .force(
      "link",
      d3
        .forceLink()
        .id((d) => d.id)
        .distance(linkLength)
    )
    .force("x", d3.forceX(width / 2).strength(xStrength))
    .force("y", d3.forceY(height / 2).strength(yStrength))
    .alphaMin(0.05);

  simulation.randomSource();
  return simulation;
}

export function borderCheck(circles, radius, borderHeight, borderWidth, width, height) {
  const strength = 1;

  const centerX = width / 2;
  const centerY = height / 2;

  const leftBorder = centerX - (borderWidth * borderMultiplier) / 2;
  const rightBorder = centerX + (borderWidth * borderMultiplier) / 2;
  const topBorder = centerY - (borderHeight * borderMultiplier) / 2;
  const bottomBorder = centerY + (borderHeight * borderMultiplier) / 2;

  circles.children.forEach((node) => {
    let dx = 0;
    let dy = 0;

    if (node.x < leftBorder + radius) {
      dx += (leftBorder + radius - node.x) * strength;
    } else if (node.x > rightBorder - radius) {
      dx += (rightBorder - radius - node.x) * strength;
    }

    if (node.y < topBorder + radius) {
      dy += (topBorder + radius - node.y) * strength;
    } else if (node.y > bottomBorder - radius) {
      dy += (bottomBorder - radius - node.y) * strength;
    }

    node.vx += dx;
    node.vy += dy;
  });
}

export function componentForce(componentArray, componentSizeArray, centroidThreshold) {
  let nodes;
  let strength = 0.1; // this variable can be changed via user input

  function calculateCentroid(componentNodes) {
    let x = 0,
      y = 0;
    componentNodes.forEach((node) => {
      x += node.x;
      y += node.y;
    });
    return {
      x: x / componentNodes.length,
      y: y / componentNodes.length,
      size: componentNodes.length,
    };
  }

  function force(alpha) {
    const componentNodes = {};
    nodes.forEach((node) => {
      const component = componentArray[node.id];
      if (!componentNodes[component]) {
        componentNodes[component] = [];
      }
      componentNodes[component].push(node);
    });

    const centroids = {};
    for (const component in componentNodes) {
      const componentSize = componentNodes[component].length;
      if (componentSize >= centroidThreshold) {
        centroids[component] = calculateCentroid(componentNodes[component]);
      }
    }

    nodes.forEach((node, i) => {
      const component = componentArray[node.id];

      // the centroidKey is equivalent to the component
      for (const centroidKey in centroids) {
        const centroid = centroids[centroidKey];
        if (centroid !== centroids[component]) {
          const dx = centroid.x - node.x;
          const dy = centroid.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const force = (strength * centroidThreshold * alpha) / distance;

          node.vx -= dx * force;
          node.vy -= dy * force;
        }
      }
    });
  }

  force.initialize = function (_) {
    nodes = _;
  };

  force.strength = function (_) {
    if (typeof _ === "undefined") return strength;
    strength = _;
    return force;
  };

  return force;
}

export function circularLayout(componentArray, adjacentCountMap, minCircleSize) {
  let nodes;
  let strength = 5; // this variable can be changed via user input

  function calculateCentroid(componentNodes) {
    let x = 0,
      y = 0;
    componentNodes.forEach((node) => {
      x += node.x;
      y += node.y;
    });
    return {
      x: x / componentNodes.length,
      y: y / componentNodes.length,
      size: componentNodes.length,
    };
  }

  function force(alpha) {
    const componentNodes = {};
    nodes.forEach((node) => {
      const component = componentArray[node.id];
      if (!componentNodes[component]) {
        componentNodes[component] = [];
      }
      componentNodes[component].push(node);
    });

    const centroids = {};
    for (const component in componentNodes) {
      const componentSize = componentNodes[component].length;
      if (componentSize >= minCircleSize) {
        centroids[component] = calculateCentroid(componentNodes[component]);
      }
    }

    for (const component in componentNodes) {
      const componentSize = componentNodes[component].length;
      if (componentSize >= minCircleSize) {
        const centroid = centroids[component];
        const radius = 50 * Math.sqrt(componentSize);

        // sort by adjacent count descending
        componentNodes[component].sort((x, y) => adjacentCountMap.get(y.id) - adjacentCountMap.get(x.id));

        componentNodes[component].forEach((node, i) => {
          const angle = (2 * Math.PI * i) / componentSize;
          const targetX = centroid.x + radius * Math.cos(angle - Math.PI / 2);
          const targetY = centroid.y + radius * Math.sin(angle - Math.PI / 2);

          const dx = targetX - node.x;
          const dy = targetY - node.y;

          node.vx += dx * alpha * strength;
          node.vy += dy * alpha * strength;
        });
      }
    }
  }

  force.initialize = function (_) {
    nodes = _;
  };

  return force;
}
