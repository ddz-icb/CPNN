import { useEffect } from "react";
import { useTooltipSettings } from "../../state/tooltipState.js";
import { usePixiState } from "../../state/pixiState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useGraphState } from "../../state/graphState.js";
import { useNodeDetails } from "../hooks/useNodeDetails.js";
import { Button } from "../reusable_components/sidebarComponents.jsx";
import { isPopupOpen } from "../hooks/keyboardUtils.js";

export function NodeFocus() {
  const { tooltipSettings, setTooltipSettings, clearNodeFocus, goBackTooltip } = useTooltipSettings();
  const graph = useGraphState((state) => state.graphState.graph);
  const nodeId = tooltipSettings.clickTooltipData?.node;
  const exists = graph?.data?.nodes?.some((node) => node.id === nodeId);
  const { displayName } = useNodeDetails(nodeId);
  const detailsOpen = tooltipSettings.isClickTooltipActive;
  const focused = tooltipSettings.isNodeFocusOnly || detailsOpen;
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
    if (graph && !exists && (focused || tooltipSettings.isClickTooltipActive)) clearNodeFocus();
  }, [graph, exists, focused, tooltipSettings.isClickTooltipActive, clearNodeFocus]);

  useEffect(() => {
    if (!focused || detailsOpen) return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || isPopupOpen()) return;
      event.stopImmediatePropagation();
      clearNodeFocus();
    };
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [focused, detailsOpen, clearNodeFocus]);

  if (!focused || !exists) return null;
  return (
    <div className="node-focus-bar" role="region" aria-label="Focused node">
      <span className="node-focus-name" title={nodeId}>
        Focused: {displayName}
      </span>
      <div className="tooltip-popup-footer-actions">
        <Button
          className="tooltip-popup-action"
          text={detailsOpen ? "Hide details" : "Details"}
          aria-expanded={detailsOpen}
          onClick={toggleDetails}
        />
        <Button className="tooltip-popup-action" text="Clear" onClick={clearNodeFocus} title="Clear focus (Escape)" />
        {canGoBack && <Button className="tooltip-popup-action" text="Previous" onClick={goBackTooltip} />}
      </div>
    </div>
  );
}
