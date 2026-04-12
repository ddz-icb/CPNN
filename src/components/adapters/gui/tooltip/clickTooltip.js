import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import * as $3Dmol from "3dmol/build/3Dmol.js";

import log from "../../logging/logger.js";
import "../../../../styles/pdb_viewer.css";

import { useTooltipSettings } from "../../state/tooltipState.js";
import { useTheme } from "../../state/themeState.js";
import { useNodeDetails } from "../hooks/useNodeDetails.js";
import { useProteinDetails } from "../hooks/useProteinDetails.js";
import { useGraphState } from "../../state/graphState.js";
import { useColorschemeState } from "../../state/colorschemeState.js";
import { TooltipPopup, TooltipPopupItem, TooltipPopupLinkItem } from "../reusable_components/tooltipComponents.js";
import { Button } from "../reusable_components/sidebarComponents.js";
import { describeSector, getColor } from "../../../domain/service/canvas_drawing/drawingUtils.js";
import { downloadNodeIdsCsv } from "../../../domain/service/download/download.js";
import { usePixiState } from "../../state/pixiState.js";
import { useRenderState } from "../../state/canvasState.js";
import { formatWeight, getAdjacentNodes } from "../../../domain/service/graph_calculations/graphUtils.js";

export function ClickTooltip() {
  const { theme } = useTheme();
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();
  const { graphState } = useGraphState();
  const { colorschemeState } = useColorschemeState();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();

  const viewerRef = useRef(null);
  const [isAdjacentView, setIsAdjacentView] = useState(false);
  const [history, setHistory] = useState([]);
  const isGoingBack = useRef(false);

  const clickData = tooltipSettings.clickTooltipData;
  const nodeId = clickData?.node;
  const nodeAttribs = clickData?.nodeAttribs ?? [];
  const isTooltipActive = tooltipSettings.isClickTooltipActive;
  const { displayName, entries: nodeEntries, hasPhosphosites } = useNodeDetails(nodeId);
  const { fullName, description, pdbId, protIdNoIsoform, responsePdb } = useProteinDetails(nodeId);
  const heading = displayName || nodeId;

  // Push to history whenever the node changes, unless this change was triggered by going back.
  useEffect(() => {
    if (!clickData) return;
    if (isGoingBack.current) {
      isGoingBack.current = false;
      return;
    }
    setHistory((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].node === clickData.node) return prev;
      return [...prev, clickData];
    });
  }, [clickData]);

  useEffect(() => {
    if (nodeId) setIsAdjacentView(false);
  }, [nodeId]);

  useEffect(() => {
    if (!isTooltipActive) return;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      setTooltipSettings("isClickTooltipActive", false);
    };
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [isTooltipActive, setTooltipSettings]);

  usePdbViewer(viewerRef, responsePdb, theme.name, isTooltipActive);

  const { tooltipRef, isPositioned } = useTooltipPosition(isTooltipActive, clickData);

  const nodeColors = colorschemeState.nodeColorscheme?.data ?? [];
  const nodeAttribsToColorIndices = colorschemeState.nodeAttribsToColorIndices ?? [];

  const adjacentNodes = useMemo(() => getAdjacentNodes(graphState.graph?.data, nodeId), [graphState.graph, nodeId]);

  const adjacentNodeList = useMemo(() => adjacentNodes.map(({ node }) => node), [adjacentNodes]);

  const getNodeScreenPosition = useCallback(
    (node) => {
      if (!node) return null;
      const circle = pixiState.nodeMap?.[node.id]?.circle;
      if (!circle || !renderState.app?.stage) return null;
      try {
        const globalPos = circle.getGlobalPosition();
        const canvasEl = renderState.app.renderer.view ?? renderState.app.canvas;
        const rect = canvasEl.getBoundingClientRect();
        return { x: rect.left + globalPos.x, y: rect.top + globalPos.y };
      } catch {
        return null;
      }
    },
    [pixiState.nodeMap, renderState.app],
  );

  const handleExportAdjacent = useCallback(() => {
    if (!adjacentNodeList.length) return;
    const baseName = nodeId ? `${nodeId}_adjacent` : "adjacent_nodes";
    downloadNodeIdsCsv(adjacentNodeList, baseName);
  }, [adjacentNodeList, nodeId]);

  const navigateToNode = useCallback(
    (node) => {
      if (!node) return;
      const pos = getNodeScreenPosition(node);
      if (!pos) return;
      setIsAdjacentView(false);
      setTooltipSettings("clickTooltipData", {
        node: node.id,
        nodeAttribs: node.attribs ?? [],
        x: pos.x,
        y: pos.y,
      });
    },
    [getNodeScreenPosition, setTooltipSettings],
  );

  const handleBack = useCallback(() => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const prevEntry = newHistory[newHistory.length - 1];
    // Refresh the position in case the graph was panned/zoomed since the node was visited.
    const prevNode = graphState.graph?.data?.nodes?.find((n) => n.id === prevEntry.node);
    const freshPos = prevNode ? getNodeScreenPosition(prevNode) : null;
    isGoingBack.current = true;
    setHistory(newHistory);
    setTooltipSettings("clickTooltipData", freshPos ? { ...prevEntry, ...freshPos } : prevEntry);
  }, [history, graphState.graph, getNodeScreenPosition, setTooltipSettings]);

  const canGoBack = history.length > 1;

  const footerContent = useMemo(() => {
    if (isAdjacentView) {
      return (
        <>
          <div className="tooltip-popup-footer-links" />
          <div className="tooltip-popup-footer-actions">
            {canGoBack && <Button className="tooltip-popup-action" text="Back" onClick={handleBack} />}
            <Button
              className="tooltip-popup-action"
              text="Export"
              onClick={handleExportAdjacent}
              disabled={!adjacentNodeList.length}
            />
            <Button className="tooltip-popup-action" text="Back to node" onClick={() => setIsAdjacentView(false)} />
          </div>
        </>
      );
    }

    return (
      <>
        <div className="tooltip-popup-footer-links">
          {protIdNoIsoform && <TooltipPopupLinkItem text={"UniProt"} link={`https://www.uniprot.org/uniprotkb/${protIdNoIsoform}/`} />}
          {pdbId && <TooltipPopupLinkItem text={"RCSB PDB"} link={`https://www.rcsb.org/structure/${pdbId}/`} />}
        </div>
        <div className="tooltip-popup-footer-actions">
          {canGoBack && <Button className="tooltip-popup-action" text="Back" onClick={handleBack} />}
          <Button className="tooltip-popup-action" text="Adjacent nodes" onClick={() => setIsAdjacentView(true)} />
        </div>
      </>
    );
  }, [adjacentNodeList.length, canGoBack, handleBack, handleExportAdjacent, isAdjacentView, pdbId, protIdNoIsoform]);

  const showDetails = !isAdjacentView;

  return (
    <TooltipPopup
      heading={heading}
      close={() => setTooltipSettings("isClickTooltipActive", false)}
      contentKey={nodeId}
      tooltipRef={tooltipRef}
      isPositioned={isPositioned}
      footer={footerContent}
    >
      {showDetails ? (
        <NodeDetails
          nodeId={nodeId}
          displayName={displayName}
          nodeEntries={nodeEntries}
          hasPhosphosites={hasPhosphosites}
          fullName={fullName}
          nodeAttribs={nodeAttribs}
          description={description}
          viewerRef={viewerRef}
        />
      ) : (
        <AdjacentNodesList
          adjacentNodes={adjacentNodes}
          nodeAttribsToColorIndices={nodeAttribsToColorIndices}
          nodeColors={nodeColors}
          borderColor={theme.circleBorderColor}
          onViewNode={(node) => navigateToNode(node)}
        />
      )}
    </TooltipPopup>
  );
}

function NodeDetails({ nodeId, displayName, nodeEntries, hasPhosphosites, fullName, nodeAttribs, description, viewerRef }) {
  const entryContent =
    Array.isArray(nodeEntries) && nodeEntries.length > 0
      ? nodeEntries.map(({ id, name, phosphosites }, index) => (
          <div key={`${id}-${name}-${index}`}>
            {id}
            {name ? ` (${name})` : ""}
            {phosphosites?.length ? ` - ${phosphosites.join(", ")}` : ""}
          </div>
        ))
      : "—";

  return (
    <>
      <TooltipPopupItem heading={"Node ID"} value={nodeId} />
      <TooltipPopupItem heading={"Name"} value={displayName || "—"} />
      <TooltipPopupItem heading={`Node Entries${hasPhosphosites ? " and Phosphosites" : ""}`} value={entryContent} />
      {fullName && <TooltipPopupItem heading={"Full Name"} value={fullName} />}
      <TooltipPopupItem heading={"Annotations"} value={nodeAttribs.join(", ")} />
      {description && <TooltipPopupItem heading={"Description"} value={description} />}
      <div className="pdb-viewer" ref={viewerRef} />
    </>
  );
}

const TOOLTIP_OFFSET = 14; // gap between click point and tooltip edge (px)
const SCREEN_MARGIN = 8;   // minimum distance from viewport edges (px)

function useTooltipPosition(isActive, clickData) {
  const tooltipRef = useRef(null);
  const [isPositioned, setIsPositioned] = useState(false);

  useLayoutEffect(() => {
    if (!isActive || !clickData || !tooltipRef.current) {
      setIsPositioned(false);
      return;
    }

    const el = tooltipRef.current;
    const { width, height } = el.getBoundingClientRect();
    const { x = 0, y = 0 } = clickData;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: open to the right and aligned to the click point vertically
    let left = x + TOOLTIP_OFFSET;
    let top = y;

    // Flip horizontally if it clips the right edge
    if (left + width > vw - SCREEN_MARGIN) {
      left = x - width - TOOLTIP_OFFSET;
    }

    // Flip vertically if it clips the bottom
    if (top + height > vh - SCREEN_MARGIN) {
      top = y - height;
    }

    // Final clamp to guarantee it stays within the viewport
    left = Math.max(SCREEN_MARGIN, Math.min(left, vw - width - SCREEN_MARGIN));
    top  = Math.max(SCREEN_MARGIN, Math.min(top,  vh - height - SCREEN_MARGIN));

    el.style.left = `${left}px`;
    el.style.top  = `${top}px`;
    setIsPositioned(true);
  }, [isActive, clickData]);

  return { tooltipRef, isPositioned };
}

function usePdbViewer(viewerRef, responsePdb, themeName, isTooltipActive) {
  const [viewer, setViewer] = useState(null);

  const getTooltipBackground = useCallback(() => {
    const tooltipEl = viewerRef.current?.closest(".tooltip") ?? viewerRef.current;
    if (!tooltipEl) return null;
    const { backgroundColor } = getComputedStyle(tooltipEl);
    const match = backgroundColor?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return backgroundColor || null;

    const [, r, g, b] = match;
    const toHex = (value) => Number(value).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }, [viewerRef]);

  useEffect(() => {
    if (!viewerRef.current || viewer) return;
    try {
      const backgroundColor = getTooltipBackground() ?? (themeName === "light" ? "#ffffff" : "#2a2e35");
      const config = { backgroundColor };
      setViewer($3Dmol.createViewer(viewerRef.current, config));
    } catch (error) {
      log.error(error);
    }
  }, [getTooltipBackground, themeName, viewer]);

  useEffect(() => {
    if (!viewer) return;
    const backgroundColor = getTooltipBackground() ?? (themeName === "light" ? "#ffffff" : "#2a2e35");
    viewer.setBackgroundColor(backgroundColor);
  }, [getTooltipBackground, themeName, viewer]);

  useEffect(() => {
    if (!viewer) return;

    if (!isTooltipActive || !responsePdb) {
      viewer.clear();
      viewer.render();
      return;
    }

    viewer.clear();
    viewer.addModel(responsePdb.data, "pdb");
    viewer.setStyle({}, { cartoon: { color: "spectrum" } });
    viewer.zoomTo();
    viewer.render();
  }, [viewer, responsePdb, isTooltipActive]);
}

function AdjacentNodesList({ adjacentNodes, nodeAttribsToColorIndices, nodeColors, borderColor, onViewNode }) {
  if (!adjacentNodes.length) {
    return <div className="tooltip-adjacent-empty">No adjacent nodes available.</div>;
  }

  return (
    <div className="tooltip-adjacent-list">
      {adjacentNodes.map(({ node, connections }) => (
        <div className="tooltip-adjacent-card" key={node.id}>
          <div className="tooltip-adjacent-card-header">
            <NodePreview node={node} nodeAttribsToColorIndices={nodeAttribsToColorIndices} nodeColors={nodeColors} borderColor={borderColor} />
            <div className="tooltip-adjacent-card-meta">
              <div className="tooltip-adjacent-node-id-row">
                <div className="tooltip-adjacent-node-id">{node.id}</div>
                {onViewNode && <Button className="tooltip-popup-action" text="View node" onClick={() => onViewNode(node)} />}
              </div>
              <div className="tooltip-adjacent-node-attribs">{node.attribs?.join(", ")}</div>
            </div>
          </div>
          <div className="tooltip-adjacent-connection-list">
            {connections.map((connection, index) => (
              <div className="tooltip-adjacent-connection" key={`${node.id}-${connection.type}-${index}`}>
                <span className="tooltip-adjacent-connection-type">{connection.type}</span>
                <span className="tooltip-adjacent-connection-weight">weight: {formatWeight(connection.weight)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NodePreview({ node, nodeAttribsToColorIndices, nodeColors, borderColor, size = 24 }) {
  if (!node) return null;
  const attribs = Array.isArray(node.attribs) && node.attribs.length > 0 ? node.attribs : [null];
  const radius = size / 2 - 2;
  const center = size / 2;
  const baseColor = getColor(nodeAttribsToColorIndices?.[attribs[0]], nodeColors);

  const wedges = attribs.slice(1).map((attrib, index) => {
    const segmentIndex = index + 1;
    const total = attribs.length;
    const startAngle = (segmentIndex * 2 * Math.PI) / total;
    const endAngle = ((segmentIndex + 1) * 2 * Math.PI) / total;
    return {
      color: getColor(nodeAttribsToColorIndices?.[attrib], nodeColors),
      path: describeSector(center, center, radius - 1, startAngle, endAngle),
      key: `${attrib}-${index}`,
    };
  });

  return (
    <svg className="tooltip-node-preview" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Preview of ${node.id}`}>
      <circle cx={center} cy={center} r={radius} fill={baseColor} stroke={borderColor} strokeWidth="2" />
      {wedges.map((wedge) => (
        <path key={wedge.key} d={wedge.path} fill={wedge.color} stroke="none" />
      ))}
    </svg>
  );
}
