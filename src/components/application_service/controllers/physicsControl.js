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
import { useFilter } from "../../adapters/state/filterState.js";
import { useContainer } from "../../adapters/state/containerState.js";
import { useGraphState } from "../../adapters/state/graphState.js";
import { useRenderState } from "../../adapters/state/canvasState.js";

export function PhysicsControl() {
  const { physics, setPhysics } = usePhysics();
  const { filter } = useFilter();
  const { container } = useContainer();
  const { graphState } = useGraphState();
  const { renderState } = useRenderState();

  useEffect(() => {
    if (!renderState.simulation) return;
    if (physics.linkForce == false) {
      log.info("Disabling link force");

      renderState.simulation.force("link").strength(0);
      return;
    }
    log.info("Enabling link force", physics.linkLength);

    renderState.simulation.force(
      "link",
      d3
        .forceLink(graphState.graph.data.links)
        .id((d) => d.id)
        .distance(physics.linkLength)
    );

    setPhysics("circleLayout", false);

    renderState.simulation.alpha(1).restart();
  }, [physics.linkForce]);

  useEffect(() => {
    if (!renderState.simulation || physics.linkForce == false) return;
    log.info("changing link length", physics.linkLength);

    renderState.simulation.force("link").distance(physics.linkLength);
    renderState.simulation.alpha(1).restart();
  }, [physics.linkLength]);

  useEffect(() => {
    if (!renderState.simulation) return;
    if (physics.gravityStrength == 0) {
      renderState.simulation.force("gravity", null);
      renderState.simulation.alpha(1).restart();
      return;
    }
    log.info("Changing gravity", physics.gravityStrength);

    renderState.simulation.force("gravity", gravityForce(container.width / 2, container.height / 2).strength(physics.gravityStrength));
    renderState.simulation.alpha(1).restart();
  }, [physics.gravityStrength, container.width, container.height]);

  useEffect(() => {
    if (!renderState.simulation) return;
    if (physics.componentStrength == 0) {
      renderState.simulation.force("component", null);
      renderState.simulation.alpha(1).restart();
      return;
    }
    log.info("Changing component strength", physics.componentStrength);

    const [IdToComp, compToCompSize] = getComponentData(graphState.graph.data);

    const threshold = 3;

    renderState.simulation.force("component", groupRepulsionForce(IdToComp, threshold).strength(physics.componentStrength));
    renderState.simulation.alpha(1).restart();
  }, [physics.componentStrength, graphState.graph]);

  useEffect(() => {
    if (!renderState.simulation) return;
    if (physics.nodeRepulsionStrength == 0) {
      renderState.simulation.force("charge", null);
      return;
    }
    log.info("Changing node repulsion strength", physics.nodeRepulsionStrength);

    renderState.simulation.force(
      "charge",
      d3
        .forceManyBody()
        .theta(accuracyBarnesHut)
        .distanceMax(maxDistanceChargeForce)
        .strength(physics.nodeRepulsionStrength * nodeRepulsionMultiplier)
    );
    renderState.simulation.alpha(1).restart();
  }, [physics.nodeRepulsionStrength]);

  useEffect(() => {
    if (!renderState.simulation || physics.nodeCollision == null) return;
    log.info("Changing node collision strength", physics.nodeCollision);

    if (physics.nodeCollision == false) {
      renderState.simulation.force("collision", null);
      return;
    }

    renderState.simulation.force(
      "collision",
      d3.forceCollide((d) => radius + 1)
    );
    renderState.simulation.alpha(1).restart();
  }, [physics.nodeCollision]);

  useEffect(() => {
    if (!renderState.simulation || !container.width || !container.height) return;

    if (!physics.checkBorder) {
      log.info("Disabling graph border");
      renderState.simulation.force("border", null);
    } else {
      log.info("Setting graph border");
      const center = { x: container.width / 2, y: container.height / 2 };
      renderState.simulation.force("border", borderCheck(radius, physics.borderHeight, physics.borderWidth, center));
    }
    renderState.simulation.alpha(1).restart();
  }, [physics.checkBorder, physics.borderHeight, physics.borderWidth, container.width, container.height]);

  useEffect(() => {
    if (!renderState.simulation) return;
    if (physics.circleLayout == false) {
      log.info("Disabling circular layout");

      // enabling link force by default
      setPhysics("linkForce", true);

      renderState.simulation.force("circleLayout", null);
      renderState.simulation.alpha(1).restart();
      return;
    }

    log.info("Enabling circular layout");

    // have to disable link force for this
    setPhysics("linkForce", false);

    const [IdToComp, compToCompSize] = getComponentData(graphState.graph.data);
    const adjacentCountMap = getAdjacentData(graphState.graph.data);
    const minCircleSize = 6;

    renderState.simulation.force("circleLayout", circularForce(IdToComp, adjacentCountMap, minCircleSize));
    renderState.simulation.alpha(1).restart();
  }, [physics.circleLayout]);

  useEffect(() => {
    if (!renderState.simulation) return;

    if (physics.communityForceStrength == 0) {
      log.info("Disabling community force");
      renderState.simulation.force("community", null);
      renderState.simulation.alpha(1).restart();
      return;
    }
    log.info("Changing community strength", physics.communityForceStrength);

    const [idToComm, commToSize] = getCommunityData(graphState.graph.data);
    const threshold = 3;

    renderState.simulation.force("community", groupRepulsionForce(idToComm, threshold).strength(physics.communityForceStrength));
    renderState.simulation.alpha(1).restart();
  }, [physics.communityForceStrength]);
}
