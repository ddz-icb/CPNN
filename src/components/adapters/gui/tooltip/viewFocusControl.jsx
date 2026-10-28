import { useEffect, useRef } from "react";
import { useAppearance } from "../../state/appearanceState.js";
import { useCommunityState } from "../../state/communityState.js";
import { useContainer } from "../../state/containerState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useGraphState } from "../../state/graphState.js";
import { useSearchState } from "../../state/searchState.js";
import { useTooltipSettings } from "../../state/tooltipState.js";
import { captureViewState, centerOnLink, centerOnNodes, clearViewOrbitCenter, restoreViewState } from "../../../domain/service/canvas_interaction/centerView.js";
import { getEndpointIdText } from "../../../domain/service/graph_calculations/graphUtils.js";
import { getNodeIdName } from "../../../domain/service/parsing/nodeIdParsing.js";
import { formatSearchLinkLabel } from "../../../domain/service/search/search.js";
import { SidebarFooterActions, SidebarFooterButton } from "../reusable_components/sidebarFooterActions.jsx";
import { isPopupOpen } from "../hooks/keyboardUtils.js";

const ORBIT_OWNERS = { node: "node", link: "searchLink", community: "community" };

function getEndpointName(nodeId, nodeById) {
  const node = nodeById.get(String(nodeId));
  return node?.name || node?.label || getNodeIdName(nodeId) || nodeId || "Unknown";
}

export function ViewFocusControl() {
  const { tooltipSettings } = useTooltipSettings();
  const { searchState, setSearchState, setAllSearchState } = useSearchState();
  const { communityState, setCommunityState } = useCommunityState();
  const graph = useGraphState((state) => state.graphState.graph);
  const threeD = useAppearance((state) => state.appearance.threeD);
  const cameraRef = useAppearance((state) => state.appearance.cameraRef);
  const app = useRenderState((state) => state.renderState.app);
  const viewTarget = threeD ? cameraRef : app;

  const nodeId = (tooltipSettings.isClickTooltipActive || tooltipSettings.isNodeFocusOnly)
    ? tooltipSettings.clickTooltipData?.node : null;
  const selectedLink = (searchState.matchingLinks ?? []).find((entry) => entry.linkId === searchState.selectedLinkId);
  const selectedCommunity = (communityState.communities ?? []).find(({ id }) => id?.toString() === communityState.selectedCommunityId?.toString());
  const validNodeId = nodeId && graph?.data?.nodes?.some((node) => node.id === nodeId) ? nodeId : null;
  const kind = validNodeId ? "node" : selectedLink ? "link" : selectedCommunity ? "community" : null;
  const targetId = kind === "node" ? validNodeId : kind === "link" ? selectedLink.linkId : kind === "community" ? selectedCommunity.id.toString() : null;
  const active = Boolean(kind)
    && (kind !== "node" || tooltipSettings.isViewFocusActive)
    && (kind !== "community" || communityState.isViewFocusActive !== false)
    && (kind !== "link" || searchState.isLinkViewFocusActive !== false);
  const activeRef = useRef(active);
  const viewSessionRef = useRef(null);
  const restoreFramesRef = useRef([]);
  activeRef.current = active;

  const cancelPendingRestore = () => {
    for (const frame of restoreFramesRef.current) cancelAnimationFrame(frame);
    restoreFramesRef.current = [];
  };

  const restoreSession = () => {
    const session = viewSessionRef.current;
    if (!session) return;
    for (const owner of Object.values(ORBIT_OWNERS)) clearViewOrbitCenter({ appearance: session.appearance, owner });
    const { width, height } = useContainer.getState().container;
    const canAdjust2DView = session.view && !session.view.camera && session.container
      && Number.isFinite(session.view.x) && Number.isFinite(session.view.y)
      && Number.isFinite(width) && Number.isFinite(height)
      && Number.isFinite(session.container.width) && Number.isFinite(session.container.height);
    const view = canAdjust2DView
      ? {
        ...session.view,
        x: session.view.x + (width - session.container.width) / 2,
        y: session.view.y + (height - session.container.height) / 2,
      }
      : session.view;
    restoreViewState(view);
    viewSessionRef.current = null;
  };

  const focusTarget = () => {
    const appearance = useAppearance.getState().appearance;
    const renderState = useRenderState.getState().renderState;
    const container = useContainer.getState().container;
    const nodes = useGraphState.getState().graphState.graph?.data?.nodes ?? [];
    const viewState = { appearance, renderState, container, orbitOwner: ORBIT_OWNERS[kind] };

    if (kind === "node") {
      centerOnNodes(nodes.filter((node) => node.id === targetId), viewState);
    } else if (kind === "link") {
      const entry = (useSearchState.getState().searchState.matchingLinks ?? []).find((item) => item.linkId === targetId);
      centerOnLink(entry?.link, { ...viewState, nodeById: new Map(nodes.map((node) => [node.id, node])) });
    } else if (kind === "community") {
      const nodeIds = useCommunityState.getState().communityState.communityToNodeIds?.[targetId] ?? [];
      const nodeIdSet = new Set(nodeIds);
      centerOnNodes(nodes.filter((node) => nodeIdSet.has(node.id)), viewState);
    }
  };

  useEffect(() => {
    if (active) {
      cancelPendingRestore();
      const previousSession = viewSessionRef.current;
      if (!previousSession || previousSession.threeD !== threeD || previousSession.viewTarget !== viewTarget) {
        restoreSession();
        const appearance = useAppearance.getState().appearance;
        viewSessionRef.current = {
          appearance,
          view: captureViewState({ appearance, renderState: useRenderState.getState().renderState }),
          container: { ...useContainer.getState().container },
          threeD,
          viewTarget,
        };
      }
      return;
    }
    if (!viewSessionRef.current) return;
    const firstFrame = requestAnimationFrame(() => {
      const secondFrame = requestAnimationFrame(() => {
        restoreFramesRef.current = [];
        if (!activeRef.current) restoreSession();
      });
      restoreFramesRef.current = [secondFrame];
    });
    restoreFramesRef.current = [firstFrame];
    return cancelPendingRestore;
  }, [active, threeD, viewTarget]);

  useEffect(() => () => {
    cancelPendingRestore();
    restoreSession();
  }, []);

  useEffect(() => {
    if (!active) return;
    focusTarget();
    return () => clearViewOrbitCenter({ appearance: useAppearance.getState().appearance, owner: ORBIT_OWNERS[kind] });
  }, [active, kind, targetId, threeD, viewTarget]);

  const clearSelection = () => {
    if (kind === "link") {
      const current = useSearchState.getState().searchState;
      setAllSearchState({ ...current, selectedLinkId: null, highlightedLinkIds: [] });
    } else if (kind === "community") {
      setCommunityState("selectedCommunityId", null);
    }
  };

  useEffect(() => {
    if (kind !== "link" && kind !== "community") return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || isPopupOpen()) return;
      event.stopImmediatePropagation();
      clearSelection();
    };
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [kind]);

  if (kind !== "link" && kind !== "community") return null;
  const nodeById = new Map((graph?.data?.nodes ?? []).map((node) => [String(node.id), node]));
  const label = kind === "link"
    ? `${getEndpointName(selectedLink.sourceId ?? getEndpointIdText(selectedLink.link?.source), nodeById)} ↔ ${getEndpointName(selectedLink.targetId ?? getEndpointIdText(selectedLink.link?.target), nodeById)}`
    : selectedCommunity.label;
  const fullLabel = kind === "link" ? formatSearchLinkLabel(selectedLink) : label;
  return (
    <div className="node-focus-bar" role="region" aria-label={kind === "link" ? "Focused link" : "Focused community"}>
      <span className="node-focus-name" title={fullLabel}>{label}</span>
      <SidebarFooterActions>
        <SidebarFooterButton
          text={active ? "Focus: on" : "Focus: off"}
          aria-pressed={active}
          onClick={() => kind === "link"
            ? setSearchState("isLinkViewFocusActive", !active)
            : setCommunityState("isViewFocusActive", !active)}
          title={active ? "Restore the previous view" : `Center this ${kind}`}
        />
        <SidebarFooterButton
          text="Clear"
          onClick={clearSelection}
          title="Clear selection and restore the previous view (Escape)"
        />
      </SidebarFooterActions>
    </div>
  );
}
