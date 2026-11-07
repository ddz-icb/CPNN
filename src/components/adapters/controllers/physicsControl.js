import { useEffect } from "react";
import log from "../logging/logger.js";
import * as d3 from "d3";
import * as d3Force3d from "d3-force-3d";

import { radius } from "../../domain/service/canvas_drawing/nodes.js";
import { getAdjacentData, getComponentData, getLinkWeightMagnitudeExtent, getNodeDegreeData } from "../../domain/service/graph_calculations/graphUtils.js";
import {
  accuracyBarnesHut,
  borderCheck,
  circularForce,
  degreeElevationForce,
  groupRepulsionForce,
  gravityForce,
  maxDistanceChargeForce,
  nodeRepulsionMultiplier,
  getLinkDistance,
} from "../../domain/service/physics_calculations/physicsGraph.js";
import { usePhysics } from "../state/physicsState.js";
import { useContainer } from "../state/containerState.js";
import { useGraphState } from "../state/graphState.js";
import { useRenderState } from "../state/canvasState.js";
import { errorService } from "../../application/services/errorService.js";
import { useGraphFlags } from "../state/graphFlagsState.js";
import { useAppearance } from "../state/appearanceState.js";
import { useCommunityState } from "../state/communityState.js";

function restartSimulation(simulation, frozen) {
  if (frozen) {
    simulation.alpha(0).alphaTarget(0).stop();
    return;
  }
  simulation.alpha(1).restart();
}

export function PhysicsControl() {
  const { physics } = usePhysics();
  const { communityState } = useCommunityState();
  const { container } = useContainer();
  const { graphState } = useGraphState();
  const { graphFlags } = useGraphFlags();
  const { renderState } = useRenderState();
  const { appearance } = useAppearance();
  const graphNodes = graphState.graph?.data?.nodes;
  const graphLinks = graphState.graph?.data?.links;

  const planarElevation = appearance.threeD && physics.elevationForce;
  const forceLinkFactory = appearance.threeD && !planarElevation ? d3Force3d.forceLink : d3.forceLink;
  const forceManyBodyFactory = appearance.threeD && !planarElevation ? d3Force3d.forceManyBody : d3.forceManyBody;

  useEffect(() => {
    const simulation = renderState.simulation;
    if (!simulation) return;

    const wasFrozen = simulation.__isFrozen === true;
    simulation.__isFrozen = renderState.simulationFrozen;
    if (renderState.simulationFrozen) {
      simulation.alpha(0).alphaTarget(0).stop();
      renderState.app?.__redrawGraph?.();
    } else if (wasFrozen) {
      simulation.alpha(1).restart();
    }
  }, [renderState.simulationFrozen, renderState.simulation, renderState.app]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph) return;
    log.info("Changing link force", physics.linkForce);

    try {
      if (physics.linkForce == false) {
        renderState.simulation.force("link").strength(0);
      } else {
        const weightExtent = getLinkWeightMagnitudeExtent(graphState.graph.data);
        renderState.simulation.force(
          "link",
          forceLinkFactory(graphState.graph.data.links)
            .id((d) => d.id)
            .distance((link) => getLinkDistance(physics.linkLength, link, weightExtent)),
        );
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating link force:", error);
    }
  }, [physics.linkForce, renderState.simulation, appearance.threeD, planarElevation]); // shouldn't be called on filteredAfterStart since all nodes of the graph are needed

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph || physics.linkForce == false) return;
    log.info("Changing link length", physics.linkLength);

    try {
      const weightExtent = getLinkWeightMagnitudeExtent(graphState.graph.data);
      renderState.simulation.force("link").distance((link) => getLinkDistance(physics.linkLength, link, weightExtent));
      restartSimulation(renderState.simulation, renderState.simulationFrozen);
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating link length:", error);
    }
  }, [physics.linkLength, graphFlags.filteredAfterStart, graphNodes, graphLinks, renderState.simulation, appearance.threeD]);

  // Viewport resizing moves the view, so the forces keep their graph-space center.
  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart) return;
    log.info("Changing gravity", physics.gravityStrength);

    try {
      if (physics.gravityStrength == 0) {
        renderState.simulation.force("gravity", null);
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
      } else {
        renderState.simulation.force("gravity", gravityForce(container.width / 2, container.height / 2, planarElevation ? null : 0).strength(physics.gravityStrength));
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating gravity:", error);
    }
  }, [
    physics.gravityStrength,
    graphFlags.filteredAfterStart,
    graphNodes,
    graphLinks,
    renderState.simulation,
    appearance.threeD,
    planarElevation,
  ]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph) return;
    try {
      if (!planarElevation) {
        renderState.simulation.force("elevationForce", null);
      } else {
        const linkCounts = getNodeDegreeData(graphState.graph.data);
        renderState.simulation.force(
          "elevationForce",
          degreeElevationForce(linkCounts).strength(physics.elevationStrength),
        );
      }
      restartSimulation(renderState.simulation, renderState.simulationFrozen);
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating elevation force:", error);
    }
  }, [
    planarElevation,
    physics.elevationStrength,
    graphFlags.filteredAfterStart,
    graphNodes,
    graphLinks,
    renderState.simulation,
  ]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph) return;
    log.info("Changing component strength", physics.componentStrength);

    try {
      if (physics.componentStrength == 0) {
        renderState.simulation.force("component", null);
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
      } else {
        const [IdToComp] = getComponentData(graphState.graph.data);

        renderState.simulation.force("component", groupRepulsionForce(IdToComp, 3, !planarElevation).strength(physics.componentStrength));
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating component force:", error);
    }
  }, [physics.componentStrength, graphFlags.filteredAfterStart, graphNodes, graphLinks, renderState.simulation, appearance.threeD, planarElevation]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart) return;
    log.info("Changing node repulsion strength", physics.nodeRepulsionStrength);

    try {
      if (physics.nodeRepulsionStrength == 0) {
        renderState.simulation.force("charge", null);
      } else {
        renderState.simulation.force(
          "charge",
          forceManyBodyFactory()
            .theta(accuracyBarnesHut)
            .distanceMax(maxDistanceChargeForce)
            .strength(physics.nodeRepulsionStrength * nodeRepulsionMultiplier),
        );
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating node repulsion:", error);
    }
  }, [physics.nodeRepulsionStrength, graphFlags.filteredAfterStart, graphNodes, graphLinks, renderState.simulation, appearance.threeD, planarElevation]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.isPreprocessed || !container.width || !container.height) return;
    log.info("Changing graph border", physics.checkBorder, "\nwidth: ", physics.borderWidth, "\nheight: ", physics.borderHeight);

    try {
      if (!physics.checkBorder) {
        renderState.simulation.force("border", null);
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
      } else {
        const center = { x: container.width / 2, y: container.height / 2, z: 0 };
        renderState.simulation.force("border", borderCheck(radius, physics.borderHeight, physics.borderWidth, center, physics.borderDepth, !planarElevation));
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating border force:", error);
    }
  }, [
    physics.checkBorder,
    physics.borderHeight,
    physics.borderWidth,
    physics.borderDepth,
    graphFlags.filteredAfterStart,
    graphNodes,
    graphLinks,
    renderState.simulation,
    appearance.threeD,
    planarElevation,
  ]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph) return;
    log.info("Changing circular force force", physics.circleForce);

    try {
      if (!physics.circleForce) {
        renderState.simulation.force("circleForce", null);
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
      } else {
        const [IdToComp] = getComponentData(graphState.graph.data);
        const adjacentCountMap = getAdjacentData(graphState.graph.data);
        const minCircleSize = 6;

        renderState.simulation.force("circleForce", circularForce(IdToComp, adjacentCountMap, minCircleSize, appearance.threeD && !planarElevation));
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating circular force:", error);
    }
  }, [physics.circleForce, graphFlags.filteredAfterStart, graphNodes, graphLinks, renderState.simulation, appearance.threeD, planarElevation]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph) return;
    log.info("Changing community strength", physics.communityForceStrength);

    try {
      if (physics.communityForceStrength == 0) {
        renderState.simulation.force("community", null);
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
        return;
      }

      if (!communityState.idToCommunity) {
        renderState.simulation.force("community", null);
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
        return;
      } else {
        renderState.simulation.force("community", groupRepulsionForce(communityState.idToCommunity, 3, !planarElevation).strength(physics.communityForceStrength));
        restartSimulation(renderState.simulation, renderState.simulationFrozen);
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating community force:", error);
    }
  }, [
    physics.communityForceStrength,
    communityState.idToCommunity,
    graphFlags.filteredAfterStart,
    graphNodes,
    graphLinks,
    renderState.simulation,
    appearance.threeD,
    planarElevation,
  ]);
}
