import { useEffect } from "react";
import { useTooltipSettings } from "../../state/tooltipState.js";
import { usePixiState } from "../../state/pixiState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useGraphState } from "../../state/graphState.js";
import { useAppearance } from "../../state/appearanceState.js";
import { useContainer } from "../../state/containerState.js";
import { centerOnNodes, clearViewOrbitCenter, captureViewState, restoreViewState } from "../../../domain/service/canvas_interaction/centerView.js";
import { useNodeDetails } from "../hooks/useNodeDetails.js";
import { SidebarFooterActions, SidebarFooterButton } from "../reusable_components/sidebarFooterActions.jsx";
import { isPopupOpen } from "../hooks/keyboardUtils.js";

export function NodeFocus() {
  const { tooltipSettings, setTooltipSettings, clearNodeFocus, goBackTooltip } = useTooltipSettings();
  const graph = useGraphState((state) => state.graphState.graph);
  const threeD = useAppearance((state) => state.appearance.threeD);
  const cameraRef = useAppearance((state) => state.appearance.cameraRef);
  const app = useRenderState((state) => state.renderState.app);
  const nodeId = tooltipSettings.clickTooltipData?.node;
  const exists = graph?.data?.nodes?.some((node) => node.id === nodeId);
  const { displayName } = useNodeDetails(nodeId);
  const detailsOpen = tooltipSettings.isClickTooltipActive;
  const selected = tooltipSettings.isNodeFocusOnly || detailsOpen;
  const viewFocusActive = tooltipSettings.isViewFocusActive;
  const viewTarget = threeD ? cameraRef : app;
  const viewFocusReady = selected && exists && viewFocusActive;
  const canGoBack = (tooltipSettings.clickTooltipHistory?.length ?? 0) > 1;

  const toggleDetails = () => {
    if (!detailsOpen) {
      // Refresh the anchor after panning or zooming while the tooltip was hidden.
      const circle = usePixiState.getState().pixiState.nodeMap?.[nodeId]?.circle;
      const canvas = useRenderState.getState().renderState.app?.renderer?.canvas;
      if (circle && canvas) {
        const rect = canvas.getBoundingClientRect();
        setTooltipSettings("clickTooltipData", {
          ...tooltipSettings.clickTooltipData,
          x: rect.left + circle.worldTransform.tx,
          y: rect.top + circle.worldTransform.ty,
        });
      }
    }
    setTooltipSettings("isClickTooltipActive", !detailsOpen);
  };

  useEffect(() => {
    if (graph && !exists && selected) clearNodeFocus();
  }, [graph, exists, selected, clearNodeFocus]);

  useEffect(() => {
    if (!viewFocusReady) return;
    const appearance = useAppearance.getState().appearance;
    const previousView = captureViewState({ appearance, renderState: useRenderState.getState().renderState });
    return () => {
      clearViewOrbitCenter({ appearance, owner: "node" });
      restoreViewState(previousView);
    };
  }, [viewFocusReady, threeD, viewTarget]);

  useEffect(() => {
    if (!viewFocusReady) return;
    const node = useGraphState.getState().graphState.graph?.data?.nodes?.find(({ id }) => id === nodeId);
    if (node) centerOnNodes([node], {
      appearance: useAppearance.getState().appearance,
      renderState: useRenderState.getState().renderState,
      container: useContainer.getState().container,
      orbitOwner: "node",
    });
  }, [viewFocusReady, nodeId, threeD, viewTarget]);

  useEffect(() => {
    if (!selected || detailsOpen) return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || isPopupOpen()) return;
      event.stopImmediatePropagation();
      clearNodeFocus();
    };
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [selected, detailsOpen, clearNodeFocus]);

  if (!selected || !exists) return null;
  return (
    <div className="node-focus-bar" role="region" aria-label="Selected node">
      <span className="node-focus-name" title={nodeId}>
        {displayName}
      </span>
      <SidebarFooterActions>
        <SidebarFooterButton
          text={viewFocusActive ? "Focus: on" : "Focus view"}
          aria-pressed={Boolean(viewFocusActive)}
          onClick={() => setTooltipSettings("isViewFocusActive", !viewFocusActive)}
          title={viewFocusActive ? "Stop centering selected nodes" : "Center this node and follow node selections"}
        />
        <SidebarFooterButton text={detailsOpen ? "Hide details" : "Details"} aria-expanded={detailsOpen} onClick={toggleDetails} />
        {canGoBack && <SidebarFooterButton text="Previous" onClick={goBackTooltip} />}
        <SidebarFooterButton text="Clear" onClick={clearNodeFocus} title="Clear selection (Escape)" />
      </SidebarFooterActions>
    </div>
  );
}
