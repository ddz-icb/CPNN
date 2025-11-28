import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import * as $3Dmol from "3dmol/build/3Dmol.js";

import log from "../../logging/logger.js";
import { getDescriptionUniprotData, getFullNameUniprotData, getPdbIdUniprotData } from "../../../domain/service/parsing/uniprotDataParsing.js";

import { useContainer } from "../../state/containerState.js";
import { useTooltipSettings } from "../../state/tooltipState.js";
import { useTheme } from "../../state/themeState.js";
import { getNodeIdEntries, parseNodeIdEntries } from "../../../domain/service/parsing/nodeIdParsing.js";
import { useGraphState } from "../../state/graphState.js";
import { useColorschemeState } from "../../state/colorschemeState.js";
import { TooltipPopup, TooltipPopupItem, TooltipPopupLinkItem } from "../reusable_components/tooltipComponents.js";
import { Button } from "../reusable_components/sidebarComponents.js";
import { describeSector, getColor } from "../../../domain/service/canvas_drawing/draw.js";
import { downloadNodeIdsCsv } from "../../../domain/service/download/download.js";
import { getAdjacentNodes } from "../../../domain/service/physics_calculations/physicsGraph.js";
import { usePixiState } from "../../state/pixiState.js";
import { useRenderState } from "../../state/canvasState.js";

const proteinDetailsInit = {
  fullName: "",
  description: "",
  pdbId: "",
  protIdNoIsoform: "",
  gene: "",
  isoforms: [],
  hasPhosphosites: false,
  responsePdb: null,
};

export function ClickTooltip() {
  const { theme } = useTheme();
  const { container } = useContainer();
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();
  const { graphState } = useGraphState();
  const { colorschemeState } = useColorschemeState();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();

  const viewerRef = useRef(null);
  const [isAdjacentView, setIsAdjacentView] = useState(false);
  const clickData = tooltipSettings.clickTooltipData;
  const nodeId = clickData?.node;
  const nodeGroups = clickData?.nodeGroups ?? [];
  const isTooltipActive = tooltipSettings.isClickTooltipActive;
  const { fullName, description, pdbId, protIdNoIsoform, gene, isoforms, hasPhosphosites, responsePdb } = useProteinDetails(nodeId);
  const heading = gene || nodeId;

  useEffect(() => {
    if (nodeId) setIsAdjacentView(false);
  }, [nodeId]);

  usePdbViewer(viewerRef, responsePdb, theme.name, isTooltipActive);

  const tooltipStyle = useTooltipPosition(isTooltipActive, clickData, container);

  const nodeColors = colorschemeState.nodeColorscheme?.data ?? [];
  const nodeAttribsToColorIndices = colorschemeState.nodeAttribsToColorIndices ?? [];

  const adjacentNodes = useMemo(() => getAdjacentNodes(graphState.graph?.data, nodeId), [graphState.graph, nodeId]);

  const adjacentNodeList = useMemo(() => adjacentNodes.map(({ node }) => node), [adjacentNodes]);

  const handleExportAdjacent = useCallback(() => {
    if (!adjacentNodeList.length) return;
    const baseName = nodeId ? `${nodeId}_adjacent` : "adjacent_nodes";
    downloadNodeIdsCsv(adjacentNodeList, baseName);
  }, [adjacentNodeList, nodeId]);

  const handleViewAdjacentNode = useCallback(
    (node) => {
      if (!node) return;
      setIsAdjacentView(false);
      setTooltipSettings("clickTooltipData", {
        node: node.id,
        nodeGroups: node.groups ?? [],
        x: node.x + 70, // offset needed, as the tooltip is quite large :c
        y: node.y,
      });
    },
    [pixiState?.nodeMap, renderState?.app, setIsAdjacentView, setTooltipSettings, tooltipSettings.clickTooltipData]
  );

  const footerContent = useMemo(() => {
    if (isAdjacentView) {
      return (
        <>
          <Button
            className="tooltip-popup-action tooltip-popup-footer-fill"
            text="Export adjacent nodes"
            onClick={handleExportAdjacent}
            disabled={!adjacentNodeList.length}
          />
          <Button className="tooltip-popup-action" text="Back to node details" onClick={() => setIsAdjacentView(false)} />
        </>
      );
    }

    return (
      <>
        <TooltipPopupLinkItem text={"To UniProt"} link={`https://www.uniprot.org/uniprotkb/${protIdNoIsoform}/`} />
        <TooltipPopupLinkItem text={"To RCSB PDB"} link={`https://www.rcsb.org/structure/${pdbId}/`} />
        <Button className="tooltip-popup-action" text="See adjacent nodes" onClick={() => setIsAdjacentView(true)} />
      </>
    );
  }, [adjacentNodeList.length, handleExportAdjacent, isAdjacentView, pdbId, protIdNoIsoform]);

  const showDetails = !isAdjacentView;

  return (
    <TooltipPopup heading={heading} close={() => setTooltipSettings("isClickTooltipActive", false)} style={tooltipStyle} footer={footerContent}>
      {showDetails ? (
        <NodeDetails
          nodeId={nodeId}
          fullName={fullName}
          hasPhosphosites={hasPhosphosites}
          isoforms={isoforms}
          nodeGroups={nodeGroups}
          description={description}
          viewerRef={viewerRef}
        />
      ) : (
        <AdjacentNodesList
          adjacentNodes={adjacentNodes}
          nodeAttribsToColorIndices={nodeAttribsToColorIndices}
          nodeColors={nodeColors}
          borderColor={theme.circleBorderColor}
          onViewNode={handleViewAdjacentNode}
        />
      )}
    </TooltipPopup>
  );
}

function NodeDetails({ nodeId, fullName, hasPhosphosites, isoforms, nodeGroups, description, viewerRef }) {
  return (
    <>
      <TooltipPopupItem heading={"Node ID"} value={nodeId} />
      <TooltipPopupItem heading={"Full Name"} value={fullName} />
      <TooltipPopupItem
        heading={`Protein-IDs ${hasPhosphosites && "and Phosphosites"}`}
        value={isoforms.map(({ pepId, phosphosites }, index) => (
          <div key={`${pepId}-${index}`}>
            {pepId} {phosphosites.join(", ")}
          </div>
        ))}
      />
      <TooltipPopupItem heading={"Gene/Protein Annotations"} value={nodeGroups.join(", ")} />
      <TooltipPopupItem heading={"Description"} value={description} />
      <div className="pdb-viewer" ref={viewerRef} />
    </>
  );
}

function useTooltipPosition(isActive, clickData, container) {
  const width = container?.width ?? 0;
  const height = container?.height ?? 0;

  return useMemo(() => {
    if (!isActive || !clickData) return {};
    const { x = 0, y = 0 } = clickData;
    const left = x > (2 * width) / 3 ? x - 15 : x + 15;
    const top = y;

    const translateY = y > height / 2 ? " translateY(-100%)" : "";
    const translateX = x > (2 * width) / 3 ? " translateX(-100%)" : "";

    return {
      left: `${left}px`,
      top: `${top}px`,
      transform: `${translateY}${translateX}`.trim(),
    };
  }, [clickData, height, isActive, width]);
}

function useProteinDetails(nodeId) {
  const [details, setDetails] = useState(proteinDetailsInit);

  const reset = useCallback(() => {
    setDetails(proteinDetailsInit);
  }, []);

  useEffect(() => {
    if (!nodeId) {
      reset();
      return;
    }

    let isCancelled = false;

    const fetchProteinDetails = async () => {
      try {
        const entries = getNodeIdEntries(nodeId);
        const parsedEntries = parseNodeIdEntries(entries);

        if (isCancelled) return;
        setDetails((prev) => ({
          ...prev,
          protIdNoIsoform: parsedEntries.protIdNoIsoform,
          gene: parsedEntries.gene,
          hasPhosphosites: parsedEntries.hasPhosphosites,
          isoforms: parsedEntries.isoforms,
        }));

        if (!parsedEntries.protIdNoIsoform) return;

        // const responseUniprot = await axios.get(`http://localhost:3001/uniprot/${parsedEntries.protIdNoIsoform}`);
        const responseUniprot = await axios.get(`https://cpnn.ddz.de/api/uniprot/${parsedEntries.protIdNoIsoform}`);
        if (isCancelled) return;

        const uniprotData = responseUniprot?.data;
        if (!uniprotData) return;

        const nextDetails = {
          fullName: getFullNameUniprotData(uniprotData) || "",
          description: getDescriptionUniprotData(uniprotData) || "",
          pdbId: "",
          responsePdb: null,
        };

        const pdbId = getPdbIdUniprotData(uniprotData);
        if (pdbId) {
          nextDetails.pdbId = pdbId;
          const responsePdb = await axios.get(`https://files.rcsb.org/download/${pdbId}.pdb`);
          if (!isCancelled && responsePdb?.data) {
            nextDetails.responsePdb = responsePdb;
          }
        }

        if (!isCancelled) {
          setDetails((prev) => ({
            ...prev,
            ...nextDetails,
          }));
        }
      } catch (error) {
        if (!isCancelled) log.error(error);
      }
    };

    reset();
    fetchProteinDetails();

    return () => {
      isCancelled = true;
    };
  }, [nodeId, reset]);

  return details;
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
    if (!viewer || !responsePdb || !isTooltipActive) return;

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
              <div className="tooltip-adjacent-node-groups">{node.groups?.join(", ")}</div>
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
  const groups = Array.isArray(node.groups) && node.groups.length > 0 ? node.groups : [null];
  const radius = size / 2 - 2;
  const center = size / 2;
  const baseColor = getColor(nodeAttribsToColorIndices?.[groups[0]], nodeColors);

  const wedges = groups.slice(1).map((group, index) => {
    const segmentIndex = index + 1;
    const total = groups.length;
    const startAngle = (segmentIndex * 2 * Math.PI) / total;
    const endAngle = ((segmentIndex + 1) * 2 * Math.PI) / total;
    return {
      color: getColor(nodeAttribsToColorIndices?.[group], nodeColors),
      path: describeSector(center, center, radius - 1, startAngle, endAngle),
      key: `${group}-${index}`,
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

function formatWeight(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  if (Math.abs(value) >= 1) return value.toFixed(2);
  return value.toPrecision(2);
}
