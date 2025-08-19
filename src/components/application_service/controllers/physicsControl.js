import { useEffect } from "react";
import log from "../../adapters/logging/logger.js";
import * as d3 from "d3";

import { radius } from "../../domain_service/canvas_drawing/draw.js";
import { getAdjacentData, getComponentData, getCommunityData } from "../../domain_service/graph_calculations/graphUtils.js";
import {
  accuracyBarnesHut,
  borderCheck,
  circularForce,
  groupRepulsionForce,
  gravityForce,
  maxDistanceChargeForce,
  nodeRepulsionMultiplier,
} from "../../domain_service/physics_calculations/physicsGraph.js";
import { usePhysics } from "../../adapters/state/physicsState.js";
import { useContainer } from "../../adapters/state/containerState.js";
import { useGraphState } from "../../adapters/state/graphState.js";
import { useRenderState } from "../../adapters/state/canvasState.js";
import { errorService } from "../services/errorService.js";
import { useGraphFlags } from "../../adapters/state/graphFlagsState.js";

export function PhysicsControl() {
  const { physics, setPhysics } = usePhysics();
  const { container } = useContainer();
  const { graphState } = useGraphState();
  const { graphFlags } = useGraphFlags();
  const { renderState } = useRenderState();

  useEffect(() => {
    if (!renderState.simulation) return;
    log.info("Chaning link force", physics.linkForce);

    try {
      if (physics.linkForce == false) {
        renderState.simulation.force("link").strength(0);
      } else {
        renderState.simulation.force(
          "link",
          d3
            .forceLink(graphState.graph.data.links)
            .id((d) => d.id)
            .distance(physics.linkLength)
        );
        setPhysics("circleLayout", false);
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating link force:", error);
    }
  }, [physics.linkForce]);

  useEffect(() => {
    if (!renderState.simulation || physics.linkForce == false) return;
    log.info("Changing link length", physics.linkLength);

    try {
      renderState.simulation.force("link").distance(physics.linkLength);
      renderState.simulation.alpha(1).restart();
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating link length:", error);
    }
  }, [physics.linkLength]);

  useEffect(() => {
    if (!renderState.simulation) return;
    log.info("Changing gravity", physics.gravityStrength);

    try {
      if (physics.gravityStrength == 0) {
        renderState.simulation.force("gravity", null);
        renderState.simulation.alpha(1).restart();
      } else {
        renderState.simulation.force("gravity", gravityForce(container.width / 2, container.height / 2).strength(physics.gravityStrength));
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating gravity:", error);
    }
  }, [physics.gravityStrength, container.width, container.height]);

  useEffect(() => {
    if (!renderState.simulation || !graphState.graph || !graphFlags.filteredAfterStart) return;
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
  }, [physics.componentStrength, graphState.graph]);

  useEffect(() => {
    if (!renderState.simulation) return;
    log.info("Changing node repulsion strength", physics.nodeRepulsionStrength);

    try {
      if (physics.nodeRepulsionStrength == 0) {
        renderState.simulation.force("charge", null);
      } else {
        renderState.simulation.force(
          "charge",
          d3
            .forceManyBody()
            .theta(accuracyBarnesHut)
            .distanceMax(maxDistanceChargeForce)
            .strength(physics.nodeRepulsionStrength * nodeRepulsionMultiplier)
        );
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating node repulsion:", error);
    }
  }, [physics.nodeRepulsionStrength]);

  useEffect(() => {
    if (!renderState.simulation || physics.nodeCollision == null) return;
    log.info("Changing node collision strength", physics.nodeCollision);

    try {
      if (physics.nodeCollision == false) {
        renderState.simulation.force("collision", null);
      } else {
        renderState.simulation.force(
          "collision",
          d3.forceCollide((d) => radius + 1)
        );
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating node collision:", error);
    }
  }, [physics.nodeCollision]);

  useEffect(() => {
    if (!renderState.simulation || !container.width || !container.height) return;
    log.info("Changing graph border", physics.checkBorder, "\nwidth: ", physics.borderWidth, "\nheight: ", physics.borderHeight);

    try {
      if (!physics.checkBorder) {
        renderState.simulation.force("border", null);
        renderState.simulation.alpha(1).restart();
      } else {
        const center = { x: container.width / 2, y: container.height / 2 };
        renderState.simulation.force("border", borderCheck(radius, physics.borderHeight, physics.borderWidth, center));
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating border force:", error);
    }
  }, [physics.checkBorder, physics.borderHeight, physics.borderWidth, container.width, container.height]);

  useEffect(() => {
    if (!renderState.simulation || !graphState.graph || !graphFlags.filteredAfterStart) return;
    log.info("Changing circular layout force", physics.circleLayout);

    try {
      if (physics.circleLayout == false) {
        // enabling link force by default
        setPhysics("linkForce", true);
        renderState.simulation.force("circleLayout", null);
        renderState.simulation.alpha(1).restart();
      } else {
        // have to disable link force for this
        setPhysics("linkForce", false);

        const [IdToComp] = getComponentData(graphState.graph.data);
        const adjacentCountMap = getAdjacentData(graphState.graph.data);
        const minCircleSize = 6;

        renderState.simulation.force("circleLayout", circularForce(IdToComp, adjacentCountMap, minCircleSize));
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating circular layout:", error);
    }
  }, [physics.circleLayout, graphState.graph]);

  useEffect(() => {
    if (!renderState.simulation || !graphState.graph || !graphFlags.filteredAfterStart) return;
    log.info("Changing community strength", physics.communityForceStrength);

    try {
      if (physics.communityForceStrength == 0) {
        renderState.simulation.force("community", null);
        renderState.simulation.alpha(1).restart();
      } else {
        const [idToComm] = getCommunityData(graphState.graph.data);
        const threshold = 3;

        renderState.simulation.force("community", groupRepulsionForce(idToComm, threshold).strength(physics.communityForceStrength));
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating community force:", error);
    }
  }, [physics.communityForceStrength, graphState.graph]);
}
