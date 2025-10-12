import { useEffect } from "react";
import log from "../logging/logger.js";
import * as d3 from "d3";

import { radius } from "../../domain/service/canvas_drawing/draw.js";
import { getAdjacentData, getComponentData, getCommunityData } from "../../domain/service/graph_calculations/graphUtils.js";
import {
  accuracyBarnesHut,
  borderCheck,
  circularForce,
  groupRepulsionForce,
  gravityForce,
  maxDistanceChargeForce,
  nodeRepulsionMultiplier,
} from "../../domain/service/physics_calculations/physicsGraph.js";
import { usePhysics } from "../state/physicsState.js";
import { useContainer } from "../state/containerState.js";
import { useGraphState } from "../state/graphState.js";
import { useRenderState } from "../state/canvasState.js";
import { errorService } from "../../application/services/errorService.js";
import { useGraphFlags } from "../state/graphFlagsState.js";

export function PhysicsControl() {
  const { physics, setPhysics } = usePhysics();
  const { container } = useContainer();
  const { graphState } = useGraphState();
  const { graphFlags } = useGraphFlags();
  const { renderState } = useRenderState();

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart) return;
    log.info("Changing link force", physics.linkForce);

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
  }, [physics.linkForce]); // shouldn't be called on filteredAfterStart since all nodes of the graph are needed

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || physics.linkForce == false) return;
    log.info("Changing link length", physics.linkLength);

    try {
      renderState.simulation.force("link").distance(physics.linkLength);
      renderState.simulation.alpha(1).restart();
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating link length:", error);
    }
  }, [physics.linkLength, graphFlags.filteredAfterStart, graphState.graph]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart) return;
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
  }, [physics.gravityStrength, container.width, container.height, graphFlags.filteredAfterStart, graphState.graph]);

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
  }, [physics.componentStrength, graphFlags.filteredAfterStart, graphState.graph]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart) return;
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
  }, [physics.nodeRepulsionStrength, graphFlags.filteredAfterStart, graphState.graph]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || physics.nodeCollision == null) return;
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
  }, [physics.nodeCollision, graphFlags.filteredAfterStart, graphState.graph]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.isPreprocessed || !container.width || !container.height) return;
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
  }, [
    physics.checkBorder,
    physics.borderHeight,
    physics.borderWidth,
    container.width,
    container.height,
    graphFlags.filteredAfterStart,
    graphState.graph,
  ]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph) return;
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
  }, [physics.circleLayout, graphFlags.filteredAfterStart, graphState.graph]);

  useEffect(() => {
    if (!renderState.simulation || !graphFlags.filteredAfterStart || !graphState.graph) return;
    log.info("Changing community strength", physics.communityForceStrength);

    try {
      if (physics.communityForceStrength == 0) {
        renderState.simulation.force("community", null);
        renderState.simulation.alpha(1).restart();
      } else {
        const [idToComm] = getCommunityData(graphState.graph.data);
        if (!idToComm) return;
        const threshold = 3;

        renderState.simulation.force("community", groupRepulsionForce(idToComm, threshold).strength(physics.communityForceStrength));
        renderState.simulation.alpha(1).restart();
      }
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error updating community force:", error);
    }
  }, [physics.communityForceStrength, graphFlags.filteredAfterStart, graphState.graph]);
}
