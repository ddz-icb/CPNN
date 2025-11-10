import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import * as $3Dmol from "3dmol/build/3Dmol.js";

import log from "../../logging/logger.js";
import { getDescriptionUniprotData, getFullNameUniprotData, getPdbIdUniprotData } from "../../../domain/service/parsing/uniprotDataParsing.js";

import { useContainer } from "../../state/containerState.js";
import { useTooltipSettings } from "../../state/tooltipState.js";
import { useTheme } from "../../state/themeState.js";
import { getNodeIdEntries, parseNodeIdEntries } from "../../../domain/service/parsing/nodeIdParsing.js";
import { getLinkWeight } from "../../../domain/service/graph_calculations/graphUtils.js";
import { useGraphState } from "../../state/graphState.js";
import { useColorschemeState } from "../../state/colorschemeState.js";
import { TooltipPopup, TooltipPopupItem, TooltipPopupLinkItem } from "../reusable_components/tooltipComponents.js";
import { getColor } from "../../../domain/service/canvas_drawing/draw.js";

const fullNameInit = "";
const descriptionInit = "";
const pdbIdInit = "";
const protIdNoIsoformInit = "";
const geneInit = "";
const isoformsInit = [];
const hasPhosphositesInit = false;
const responsePdbInit = null;
const proteinDetailsInit = {
  fullName: fullNameInit,
  description: descriptionInit,
  pdbId: pdbIdInit,
  protIdNoIsoform: protIdNoIsoformInit,
  gene: geneInit,
  isoforms: isoformsInit,
  hasPhosphosites: hasPhosphositesInit,
  responsePdb: responsePdbInit,
};

export function ClickTooltip() {
  const { theme } = useTheme();
  const { container } = useContainer();
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();
  const { graphState } = useGraphState();
  const { colorschemeState } = useColorschemeState();

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

  const adjacentNodes = useMemo(() => {
    if (!graphState.graph?.data || !nodeId) return [];
    const { nodes, links } = graphState.graph.data;
    const currentNodeId = nodeId;
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const adjacencyMap = new Map();

    links.forEach((link) => {
      const sourceId = getEndpointId(link.source);
      const targetId = getEndpointId(link.target);
      if (sourceId !== currentNodeId && targetId !== currentNodeId) return;
      const neighborId = sourceId === currentNodeId ? targetId : sourceId;
      if (!neighborId || neighborId === currentNodeId) return;

      const neighborNode = nodeMap.get(neighborId);
      if (!neighborNode) return;

      const entry =
        adjacencyMap.get(neighborId) ??
        {
          node: neighborNode,
          connections: [],
          maxWeight: 0,
        };
      const attribs = Array.isArray(link.attribs) ? link.attribs : [];
      const weights = Array.isArray(link.weights) ? link.weights : [];
      attribs.forEach((attrib, index) => {
        entry.connections.push({
          type: attrib,
          weight: weights[index],
        });
      });
      entry.maxWeight = Math.max(entry.maxWeight, getLinkWeight(link) ?? 0);
      adjacencyMap.set(neighborId, entry);
    });

    return Array.from(adjacencyMap.values()).sort((a, b) => {
      if (b.maxWeight !== a.maxWeight) {
        return (b.maxWeight ?? 0) - (a.maxWeight ?? 0);
      }
      const labelA = a.node?.id ?? "";
      const labelB = b.node?.id ?? "";
      return labelA.localeCompare(labelB);
    });
  }, [graphState.graph, nodeId]);

  const footerContent = useMemo(() => {
    if (isAdjacentView) {
      return (
        <button className="tooltip-popup-action" onClick={() => setIsAdjacentView(false)}>
          Back to node details
        </button>
      );
    }

    return (
      <>
        <TooltipPopupLinkItem text={"To UniProt"} link={`https://www.uniprot.org/uniprotkb/${protIdNoIsoform}/`} />
        <TooltipPopupLinkItem text={"To RCSB PDB"} link={`https://www.rcsb.org/structure/${pdbId}/`} />
        <button className="tooltip-popup-action" onClick={() => setIsAdjacentView(true)}>
          See adjacent nodes
        </button>
      </>
    );
  }, [isAdjacentView, pdbId, protIdNoIsoform]);

  const showDetails = !isAdjacentView;
  const has3dModel = Boolean(responsePdb?.data);

  return (
    <TooltipPopup heading={heading} close={() => setTooltipSettings("isClickTooltipActive", false)} style={tooltipStyle} footer={footerContent}>
      {showDetails ? (
        <NodeDetails
          fullName={fullName}
          hasPhosphosites={hasPhosphosites}
          isoforms={isoforms}
          nodeGroups={nodeGroups}
          description={description}
          showStructure={has3dModel}
          viewerRef={viewerRef}
        />
      ) : (
        <AdjacentNodesList
          adjacentNodes={adjacentNodes}
          nodeAttribsToColorIndices={nodeAttribsToColorIndices}
          nodeColors={nodeColors}
          borderColor={theme.circleBorderColor}
        />
      )}
    </TooltipPopup>
  );
}

function NodeDetails({ fullName, hasPhosphosites, isoforms, nodeGroups, description, showStructure, viewerRef }) {
  return (
    <>
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
      {showStructure && <div className="pdb-viewer" ref={viewerRef} />}
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

  useEffect(() => {
    if (!viewerRef.current || viewer) return;
    try {
      const config = { backgroundColor: themeName === "light" ? "0xffffff" : "0x2a2e35" };
      setViewer($3Dmol.createViewer(viewerRef.current, config));
    } catch (error) {
      log.error(error);
    }
  }, [themeName, viewerRef, viewer]);

  useEffect(() => {
    if (viewer) viewer.setBackgroundColor(themeName === "light" ? "0xffffff" : "0x2a2e35");
  }, [themeName, viewer]);

  useEffect(() => {
    if (!viewer || !responsePdb || !isTooltipActive) return;
    viewer.clear();
    viewer.addModel(responsePdb.data, "pdb");
    viewer.setStyle({}, { cartoon: { color: "spectrum" } });
    viewer.zoomTo();
    viewer.render();
  }, [viewer, responsePdb, isTooltipActive]);
}

function AdjacentNodesList({ adjacentNodes, nodeAttribsToColorIndices, nodeColors, borderColor }) {
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
              <div className="tooltip-adjacent-node-id">{node.id}</div>
              <div className="tooltip-adjacent-node-groups">{node.groups?.join(", ")}</div>
            </div>
          </div>
          <div className="tooltip-adjacent-connection-list">
            {connections.map((connection, index) => (
              <div className="tooltip-adjacent-connection" key={`${node.id}-${connection.type}-${index}`}>
                <span>{connection.type}</span>
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

function describeSector(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
  return ["M", cx, cy, "L", start.x, start.y, "A", r, r, 0, largeArcFlag, 1, end.x, end.y, "Z"].join(" ");
}

function polarToCartesian(cx, cy, r, angle) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function formatWeight(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  if (Math.abs(value) >= 1) return value.toFixed(2);
  return value.toPrecision(2);
}

function getEndpointId(endpoint) {
  if (endpoint == null) return null;
  if (typeof endpoint === "object") {
    if (endpoint.id != null) return endpoint.id;
    if (endpoint.data?.id != null) return endpoint.data.id;
  }
  return endpoint;
}
