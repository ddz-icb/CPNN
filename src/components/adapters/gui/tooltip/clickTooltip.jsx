import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as $3Dmol from "3dmol/build/3Dmol.js";

import log from "../../logging/logger.js";
import "../../../../styles/pdb_viewer.css";

import { useTooltipSettings } from "../../state/tooltipState.js";
import { useTheme } from "../../state/themeState.js";
import { useNodeDetails } from "../hooks/useNodeDetails.js";
import { useProteinDetails } from "../hooks/useProteinDetails.js";
import { useGraphState } from "../../state/graphState.js";
import { useColorschemeState } from "../../state/colorschemeState.js";
import { TooltipPopup, TooltipPopupItem, TooltipPopupLinkItem } from "../reusable_components/tooltipComponents.jsx";
import { Button } from "../reusable_components/sidebarComponents.jsx";
import { AttributeList } from "../reusable_components/AttributeLabel.jsx";
import { describeSector, getColor } from "../../../domain/service/canvas_drawing/drawingUtils.js";
import { downloadNodeIdsCsv } from "../../../domain/service/download/download.js";
import { usePixiState } from "../../state/pixiState.js";
import { useRenderState } from "../../state/canvasState.js";
import { formatWeight, getAdjacentNodes } from "../../../domain/service/graph_calculations/graphUtils.js";

import { getNodeStatistics } from "../../../domain/service/graph_calculations/nodeStatistics.js";
import { NodeStatistics } from "./nodeStatistics.jsx";

export function ClickTooltip() {
  const { theme } = useTheme();
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();
  const { graphState } = useGraphState();
  const { colorschemeState } = useColorschemeState();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();

  const viewerRef = useRef(null);
  const [view, setView] = useState("details");
  const isAdjacentView = view === "adjacent";

  const clickData = tooltipSettings.clickTooltipData;
  const nodeId = clickData?.node;
  const nodeAttribs = clickData?.nodeAttribs ?? [];
  const isTooltipActive = tooltipSettings.isClickTooltipActive;
  const { displayName, entries: nodeEntries, hasPhosphosites } = useNodeDetails(nodeId);
  const proteinDetails = useProteinDetails(nodeId);
  const { fullName, description, pdbId, protIdNoIsoform, responsePdb, uniprotStatus, pdbStatus, isApiComplete } = proteinDetails;
  const heading = displayName || nodeId;
  const [isPdbModelReady, setIsPdbModelReady] = useState(false);
  const hasPdbModel = Boolean(responsePdb?.data);
  const isTooltipApiReady = Boolean(!nodeId || (uniprotStatus !== "idle" && isApiComplete && (!hasPdbModel || isPdbModelReady)));

  useEffect(() => {
    if (nodeId) setView("details");
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

  usePdbViewer(viewerRef, responsePdb, theme.name, isTooltipActive, setIsPdbModelReady);

  const nodeColors = colorschemeState.nodeColorscheme?.data ?? [];
  const nodeAttribsToColorIndices = colorschemeState.nodeAttribsToColorIndices ?? [];

  const adjacentNodes = useMemo(() => getAdjacentNodes(graphState.graph?.data, nodeId), [graphState.graph, nodeId]);

  const statistics = useMemo(
    () => (view === "statistics" ? getNodeStatistics(graphState.graph?.data, nodeId) : null),
    [graphState.graph, nodeId, view],
  );

  const adjacentNodeList = useMemo(() => adjacentNodes.map(({ node }) => node), [adjacentNodes]);

  const getNodeScreenPosition = useCallback(
    (node) => {
      if (!node) return null;
      const circle = pixiState.nodeMap?.[node.id]?.circle;
      if (!circle) return null;
      const canvasEl = renderState.app?.renderer?.canvas ?? renderState.app?.renderer?.view ?? renderState.app?.canvas;
      if (!canvasEl) return null;
      try {
        const rect = canvasEl.getBoundingClientRect();
        const wt = circle.worldTransform;
        return { x: rect.left + wt.tx, y: rect.top + wt.ty };
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
      setView("details");
      setTooltipSettings("clickTooltipData", {
        node: node.id,
        nodeAttribs: node.attribs ?? [],
        x: pos?.x ?? clickData?.x ?? 0,
        y: pos?.y ?? clickData?.y ?? 0,
      });
    },
    [clickData, getNodeScreenPosition, setTooltipSettings],
  );

  const footerContent = useMemo(() => {
    if (view !== "details") {
      return (
        <>
          <div className="tooltip-popup-footer-links" />
          <div className="tooltip-popup-footer-actions">
            <Button className="tooltip-popup-action" text="Back to node" data-tooltip-view="details" onClick={() => setView("details")} />
            {isAdjacentView && (
              <Button className="tooltip-popup-action" text="Export" onClick={handleExportAdjacent} disabled={!adjacentNodeList.length} />
            )}
            <Button
              className="tooltip-popup-action"
              text={isAdjacentView ? "Statistics" : "Neighbors"}
              data-tooltip-view={isAdjacentView ? "statistics" : "adjacent"}
              onClick={() => setView(isAdjacentView ? "statistics" : "adjacent")}
            />
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
          <Button className="tooltip-popup-action" text="Statistics" data-tooltip-view="statistics" onClick={() => setView("statistics")} />
          <Button className="tooltip-popup-action" text="Neighbors" data-tooltip-view="adjacent" onClick={() => setView("adjacent")} />
        </div>
      </>
    );
  }, [adjacentNodeList.length, handleExportAdjacent, isAdjacentView, view, pdbId, protIdNoIsoform]);

  const showDetails = view === "details";

  return (
    <TooltipPopup
      heading={heading}
      close={() => setTooltipSettings("isClickTooltipActive", false)}
      contentKey={nodeId}
      footer={footerContent}
      dataAttributes={{
        "data-tooltip-api-ready": isTooltipApiReady ? "true" : "false",
        "data-tooltip-uniprot-status": uniprotStatus,
        "data-tooltip-pdb-status": pdbStatus,
        "data-tooltip-pdb-model-ready": hasPdbModel ? (isPdbModelReady ? "true" : "false") : "not-applicable",
      }}
    >
      <div hidden={!showDetails}>
        <NodeDetails
          nodeId={nodeId}
          nodeEntries={nodeEntries}
          hasPhosphosites={hasPhosphosites}
          fullName={fullName}
          nodeAttribs={nodeAttribs}
          description={description}
          pdbId={pdbId}
          pdbStatus={pdbStatus}
          responsePdb={responsePdb}
          viewerRef={viewerRef}
        />
      </div>
      {view === "statistics" && <NodeStatistics statistics={statistics} />}
      {isAdjacentView && (
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

function NodeDetails({ nodeId, nodeEntries, hasPhosphosites, fullName, nodeAttribs, description, pdbId, pdbStatus, responsePdb, viewerRef }) {
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
  const pdbValue = pdbId ? `${pdbId}${pdbStatus === "loading" ? " (loading model)" : ""}` : null;

  return (
    <>
      <TooltipPopupItem heading={"Node ID"} value={nodeId} />
      <TooltipPopupItem heading={`Node Entries${hasPhosphosites ? " and Phosphosites" : ""}`} value={entryContent} />
      {fullName && <TooltipPopupItem heading={"Full Name"} value={fullName} />}
      <TooltipPopupItem heading={"Annotations"} value={nodeAttribs.length ? <AttributeList values={nodeAttribs} /> : null} />
      {description && <TooltipPopupItem heading={"Description"} value={description} />}
      {pdbValue && <TooltipPopupItem heading={"PDB Structure"} value={pdbValue} />}
      <div className={`pdb-viewer${responsePdb?.data ? "" : " pdb-viewer--pending"}`} ref={viewerRef} />
    </>
  );
}

function usePdbViewer(viewerRef, responsePdb, themeName, isTooltipActive, onModelReadyChange) {
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
      const config = { backgroundColor, preserveDrawingBuffer: true };
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

    if (!isTooltipActive || !responsePdb?.data) {
      onModelReadyChange?.(false);
      viewer.clear();
      viewer.render();
      return;
    }

    let frameId = null;
    onModelReadyChange?.(false);

    try {
      viewer.clear();
      viewer.addModel(responsePdb.data, "pdb");
      viewer.setStyle({}, { cartoon: { color: "spectrum" } });
      viewer.zoomTo();
      viewer.render();
      frameId = window.requestAnimationFrame(() => onModelReadyChange?.(true));
    } catch (error) {
      log.error(error);
      onModelReadyChange?.(false);
    }

    return () => {
      if (frameId != null) window.cancelAnimationFrame(frameId);
    };
  }, [viewer, responsePdb, isTooltipActive, onModelReadyChange]);
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
              <div className="tooltip-adjacent-node-attribs">
                <AttributeList values={node.attribs} />
              </div>
            </div>
          </div>
          <div className="tooltip-adjacent-connection-list">
            {connections.map((connection, index) => (
              <div
                className="tooltip-adjacent-connection"
                key={`${node.id}-${formatConnectionAttribs(connection.attribs)}-${connection.direction}-${index}`}
              >
                <ConnectionDirectionBadge direction={connection.direction} />
                <span className="tooltip-adjacent-connection-attribs">{formatConnectionAttribs(connection.attribs)}</span>
                <span className="tooltip-adjacent-connection-weight">weight: {formatWeight(connection.weight)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatConnectionAttribs(attribs) {
  return Array.isArray(attribs) && attribs.length > 0 ? attribs.join(", ") : "No attributes";
}

function ConnectionDirectionBadge({ direction }) {
  const directionConfig = {
    outgoing: { label: "out", symbol: "->", title: "Directed link from selected node to this neighbor" },
    incoming: { label: "in", symbol: "<-", title: "Directed link from this neighbor to selected node" },
    undirected: { label: "both", symbol: "<->", title: "Undirected link" },
  };
  const config = directionConfig[direction] ?? directionConfig.undirected;

  return (
    <span className={`tooltip-adjacent-direction tooltip-adjacent-direction--${direction ?? "undirected"}`} aria-label={config.title}>
      <span className="tooltip-adjacent-direction-symbol" aria-hidden="true">
        {config.symbol}
      </span>
      <span className="tooltip-adjacent-direction-label">{config.label}</span>
    </span>
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
