import { useCallback } from "react";

import { useAppearance } from "../../state/appearanceState.js";
import { useContainer } from "../../state/containerState.js";
import { useGraphState } from "../../state/graphState.js";
import { usePixiState } from "../../state/pixiState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useVideography } from "../../state/videographyState.js";
import {
  captureCurrentView,
  createCameraKeyframe,
  getRouteMode,
  getViewMode,
} from "../../../domain/service/videography/videography.js";
import { createCapturedKeyframeScene } from "../sidebar/videographyScene.js";

export function useAddKeyframe() {
  const { appearance } = useAppearance();
  const { container } = useContainer();
  const { graphState } = useGraphState();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();
  const { videography, setVideography, setKeyframes } = useVideography();

  const keyframes = videography.keyframes ?? [];
  const currentMode = getViewMode(appearance);
  const routeMode = getRouteMode(keyframes);
  const hasModeMismatch = Boolean(routeMode && routeMode !== currentMode);
  const hasReadyCanvas = Boolean(renderState.app && container.width && container.height && graphState.graph);
  const canAddKeyframe = hasReadyCanvas && !videography.isRendering && !hasModeMismatch;

  const addKeyframe = useCallback(() => {
    if (!canAddKeyframe) return false;

    const captured = captureCurrentView({ app: renderState.app, appearance, container });
    if (!captured) {
      setVideography("status", "Canvas is not ready.");
      setVideography("progress", 0);
      return false;
    }

    let nextKeyframe;
    setKeyframes((currentKeyframes) => {
      nextKeyframe = {
        ...createCameraKeyframe({
          captured,
          index: currentKeyframes.length,
          transitionSeconds: videography.defaultTransitionSeconds,
          holdSeconds: videography.holdSeconds,
        }),
        scene: createCapturedKeyframeScene({
          graphData: graphState.graph?.data,
          nodeMap: pixiState.nodeMap,
          mode: captured.mode,
        }),
      };
      return [...currentKeyframes, nextKeyframe];
    });

    setVideography("selectedKeyframeId", nextKeyframe.id);
    setVideography("status", `Added ${nextKeyframe.label}.`);
    setVideography("progress", 0);
    return true;
  }, [
    appearance,
    canAddKeyframe,
    container,
    graphState.graph?.data,
    pixiState.nodeMap,
    renderState.app,
    setKeyframes,
    setVideography,
    videography.defaultTransitionSeconds,
    videography.holdSeconds,
  ]);

  return { addKeyframe, canAddKeyframe };
}
