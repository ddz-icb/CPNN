import { useEffect } from "react";
import log from "../../adapters/logging/logger.js";
import * as d3 from "d3";

import { radius } from "../../domain_service/canvas_drawing/draw.js";
import { getAdjacentData, getComponentData, getCommunityMap } from "../../domain_service/graph_calculations/graphUtils.js";
import {
  accuracyBarnesHut,
  borderCheck,
  circularForce,
  communityForce,
  componentForce,
  gravityForce,
  maxDistanceChargeForce,
  nodeRepulsionMultiplier,
} from "../../domain_service/physics_calculations/physicsGraph.js";
import { usePhysics } from "../../adapters/state/physicsState.js";
import { useFilter } from "../../adapters/state/filterState.js";
import { useContainer } from "../../adapters/state/containerState.js";
import { useGraphState } from "../../adapters/state/graphState.js";

export function PhysicsStateControl({ simulation }) {
  const { physics, setPhysics } = usePhysics();
  const { filter, setFilter } = useFilter();
  const { container, setContainer } = useContainer();
  const { graphState, setGraphState } = useGraphState();

  useEffect(() => {
    if (!simulation) return;
    if (physics.linkForce == false) {
      log.info("Disabling link force");

      simulation.force("link").strength(0);
      return;
    }
    log.info("Enabling link force", physics.linkLength);

    simulation.force(
      "link",
      d3
        .forceLink(graphState.graph.data.links)
        .id((d) => d.id)
        .distance(physics.linkLength)
    );

    setPhysics("circleLayout", false);

    simulation.alpha(1).restart();
  }, [physics.linkForce]);

  useEffect(() => {
    if (!simulation || physics.linkForce == false) return;
    log.info("changing link length", physics.linkLength);

    simulation.force("link").distance(physics.linkLength);
    simulation.alpha(1).restart();
  }, [physics.linkLength]);

  useEffect(() => {
    if (!simulation) return;
    if (physics.gravityStrength == 0) {
      simulation.force("gravity", null);
      simulation.alpha(1).restart();
      return;
    }
    log.info("Changing gravity", physics.gravityStrength);

    simulation.force("gravity", gravityForce(container.width / 2, container.height / 2).strength(physics.gravityStrength));
    simulation.alpha(1).restart();
  }, [physics.gravityStrength, container.width, container.height]);

  useEffect(() => {
    if (!simulation) return;
    if (physics.componentStrength == 0) {
      simulation.force("component", null);
      simulation.alpha(1).restart();
      return;
    }
    log.info("Changing component strength", physics.componentStrength);

    const [componentArray, componentSizeArray] = getComponentData(graphState.graph.data);

    // this value can be increased to slightly increase performance
    const threshold = filter.minCompSize > 2 ? filter.minCompSize : 2;

    simulation.force("component", componentForce(componentArray, threshold).strength(physics.componentStrength));
    simulation.alpha(1).restart();
  }, [physics.componentStrength, graphState.graph]);

  useEffect(() => {
    if (!simulation) return;
    if (physics.nodeRepulsionStrength == 0) {
      simulation.force("charge", null);
      return;
    }
    log.info("Changing node repulsion strength", physics.nodeRepulsionStrength);

    simulation.force(
      "charge",
      d3
        .forceManyBody()
        .theta(accuracyBarnesHut)
        .distanceMax(maxDistanceChargeForce)
        .strength(physics.nodeRepulsionStrength * nodeRepulsionMultiplier)
    );
    simulation.alpha(1).restart();
  }, [physics.nodeRepulsionStrength]);

  useEffect(() => {
    if (!simulation || physics.nodeCollision == null) return;
    log.info("Changing node collision strength", physics.nodeCollision);

    if (physics.nodeCollision == false) {
      simulation.force("collision", null);
      return;
    }

    simulation.force(
      "collision",
      d3.forceCollide((d) => radius + 1)
    );
    simulation.alpha(1).restart();
  }, [physics.nodeCollision]);

  useEffect(() => {
    if (!simulation || !container.width || !container.height) return;

    if (!physics.checkBorder) {
      log.info("Disabling graph border");
      simulation.force("border", null);
    } else {
      log.info("Setting graph border");
      simulation.force("border", borderCheck(radius, physics.borderHeight, physics.borderWidth, container.width, container.height));
    }
    simulation.alpha(1).restart();
  }, [physics.checkBorder, physics.borderHeight, physics.borderWidth, container.width, container.height]);

  useEffect(() => {
    if (!simulation) return;
    if (physics.circleLayout == false) {
      log.info("Disabling circular layout");

      // enabling link force by default
      setPhysics("linkForce", true);

      simulation.force("circleLayout", null);
      simulation.alpha(1).restart();
      return;
    }

    log.info("Enabling circular layout");

    // have to disable link force for this
    setPhysics("linkForce", false);

    const [componentArray, componentSizeArray] = getComponentData(graphState.graph.data);
    const adjacentCountMap = getAdjacentData(graphState.graph.data);
    const minCircleSize = 6;

    simulation.force("circleLayout", circularForce(componentArray, adjacentCountMap, minCircleSize));
    simulation.alpha(1).restart();
  }, [physics.circleLayout]);

  useEffect(() => {
    if (!simulation) return;

    if (physics.communityForceStrength == 0) {
      log.info("Disabling community force");
      simulation.force("communityForce", null);
      simulation.alpha(1).restart();
      return;
    }
    log.info("Changing community strength", physics.communityForceStrength);

    const communityMap = getCommunityMap(graphState.graph.data);

    simulation.force("communityForce", communityForce(communityMap).strength(physics.communityForceStrength));
    simulation.alpha(1).restart();
  }, [physics.communityForceStrength]);
}
