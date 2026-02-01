import { useEffect } from "react";
import log from "../logging/logger.js";
import * as d3 from "d3";
import * as d3Force3d from "d3-force-3d";

import { radius } from "../../domain/service/canvas_drawing/nodes.js";
import { getAdjacentData, getComponentData } from "../../domain/service/graph_calculations/graphUtils.js";
import {
  accuracyBarnesHut,
  borderCheck,
  circularForce,
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

export function PhysicsControl() {
  const { physics, setPhysics } = usePhysics();
  const { communityState } = useCommunityState();
  const { container } = useContainer();
  const { graphState } = useGraphState();
  const { graphFlags } = useGraphFlags();
  const { renderState } = useRenderState();
  const { appearance } = useAppearance();

  const forceLinkFactory = appearance?.threeD ? d3Force3d.forceLink : d3.forceLink;
  const forceManyBodyFactory = appearance?.threeD ? d3Force3d.forceManyBody : d3.forceManyBody;

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph) return;
    log.info("Changing link force", physics.linkForce);

    try {
      if (physics.linkForce == false) {
        renderState.simulation.force("link").strength(0);
      } else {
        renderState.simulation.force(
          "link",
          forceLinkFactory(graphState.graph.data.links)
            .id((d) => d.id)
            .distance((link) => getLinkDistance(physics.linkLength, link)),
        );
        setPhysics("circleForce", false);
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating link force:", error);
    }
  }, [physics.linkForce, renderState.simulation, appearance.threeD]); // shouldn't be called on filteredAfterStart since all nodes of the graph are needed

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || physics.linkForce == false) return;
    log.info("Changing link length", physics.linkLength);

    try {
      renderState.simulation.force("link").distance((link) => getLinkDistance(physics.linkLength, link));
      renderState.simulation.alpha(1).restart();
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating link length:", error);
    }
  }, [physics.linkLength, graphFlags.filteredAfterStart, graphState.graph, renderState.simulation, appearance.threeD]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart) return;
    log.info("Changing gravity", physics.gravityStrength);

    try {
      if (physics.gravityStrength == 0) {
        renderState.simulation.force("gravity", null);
        renderState.simulation.alpha(1).restart();
      } else {
        renderState.simulation.force("gravity", gravityForce(container.width / 2, container.height / 2, 0).strength(physics.gravityStrength));
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating gravity:", error);
    }
  }, [
    physics.gravityStrength,
    container.width,
    container.height,
    graphFlags.filteredAfterStart,
    graphState.graph,
    renderState.simulation,
    appearance.threeD,
  ]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph) return;
    log.info("Changing component strength", physics.componentStrength);

    try {
      if (physics.componentStrength == 0) {
        renderState.simulation.force("component", null);
        renderState.simulation.alpha(1).restart();
      } else {
        const [IdToComp] = getComponentData(graphState.graph.data);
        const threshold = 3;

        renderState.simulation.force("component", groupRepulsionForce(IdToComp, threshold).strength(physics.componentStrength));
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating component force:", error);
    }
  }, [physics.componentStrength, graphFlags.filteredAfterStart, graphState.graph, renderState.simulation, appearance.threeD]);

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
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating node repulsion:", error);
    }
  }, [physics.nodeRepulsionStrength, graphFlags.filteredAfterStart, graphState.graph, renderState.simulation, appearance.threeD]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.isPreprocessed || !container.width || !container.height) return;
    log.info("Changing graph border", physics.checkBorder, "\nwidth: ", physics.borderWidth, "\nheight: ", physics.borderHeight);

    try {
      if (!physics.checkBorder) {
        renderState.simulation.force("border", null);
        renderState.simulation.alpha(1).restart();
      } else {
        const center = { x: container.width / 2, y: container.height / 2, z: 0 };
        renderState.simulation.force("border", borderCheck(radius, physics.borderHeight, physics.borderWidth, center, physics.borderDepth));
        renderState.simulation.alpha(1).restart();
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
    container.width,
    container.height,
    graphFlags.filteredAfterStart,
    graphState.graph,
    renderState.simulation,
    appearance.threeD,
  ]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph) return;
    log.info("Changing circular force force", physics.circleForce);

    try {
      if (physics.circleForce == false) {
        // enabling link force by default
        if (physics.linkForce === false) {
          setPhysics("linkForce", true);
        }
        renderState.simulation.force("circleForce", null);
        renderState.simulation.alpha(1).restart();
      } else {
        // have to disable link force for this
        if (physics.linkForce === true) {
          setPhysics("linkForce", false);
        }

        const [IdToComp] = getComponentData(graphState.graph.data);
        const adjacentCountMap = getAdjacentData(graphState.graph.data);
        const minCircleSize = 6;

        renderState.simulation.force("circleForce", circularForce(IdToComp, adjacentCountMap, minCircleSize, appearance.threeD));
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating circular force:", error);
    }
  }, [physics.circleForce, graphFlags.filteredAfterStart, graphState.graph, renderState.simulation, appearance.threeD]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph) return;
    log.info("Changing community strength", physics.communityForceStrength);

    try {
      if (physics.communityForceStrength == 0) {
        renderState.simulation.force("community", null);
        renderState.simulation.alpha(1).restart();
        return;
      }

      if (!communityState.idToCommunity) {
        renderState.simulation.force("community", null);
        renderState.simulation.alpha(1).restart();
        return;
      } else {
        const threshold = 3;

        renderState.simulation
          .force("community", groupRepulsionForce(communityState.idToCommunity, threshold).strength(physics.communityForceStrength));
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating community force:", error);
    }
  }, [
    physics.communityForceStrength,
    communityState.idToCommunity,
    graphFlags.filteredAfterStart,
    graphState.graph,
    renderState.simulation,
    appearance.threeD,
  ]);
}
