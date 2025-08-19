import { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as $3Dmol from "3dmol/build/3Dmol.js";

import log from "../../adapters/logging/logger.js";
import { getDescriptionUniprotData, getFullNameUniprotData, getPdbIdUniprotData } from "../../domain_service/parsing/uniprotDataParsing.js";

import { useContainer } from "../../adapters/state/containerState.js";
import { useTooltipSettings } from "../../adapters/state/tooltipState.js";
import { useMappingState } from "../../adapters/state/mappingState.js";
import { useTheme } from "../../adapters/state/themeState.js";
import { getNodeIdEntries, parseNodeIdEntries } from "../../domain_service/parsing/nodeIdParsing.js";
import { Tooltip } from "../reusable_components/tooltipComponents.js";

const fullNameInit = "";
const descriptionInit = "";
const pdbIdInit = "";
const protIdNoIsoformInit = "";
const geneInit = "";
const isoformsInit = [];
const hasPhosphositesInit = false;
const responsePdbInit = null;

export function ClickTooltip() {
  const { theme } = useTheme();
  const { container } = useContainer();
  const { mappingState } = useMappingState();
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();

  const [fullName, setFullName] = useState(fullNameInit);
  const [description, setDescription] = useState(descriptionInit);
  const [pdbId, setPdbId] = useState(pdbIdInit);
  const [protIdNoIsoform, setProtIdNoIsoform] = useState(protIdNoIsoformInit);
  const [gene, setGene] = useState(geneInit);
  const [isoforms, setIsoforms] = useState(isoformsInit);
  const [hasPhosphosites, setHasPhosphosites] = useState(hasPhosphositesInit);
  const [responsePdb, setResponsePdb] = useState(responsePdbInit);

  const [style, setStyle] = useState({});
  const [viewer, setViewer] = useState(null);
  const viewerRef = useRef(null);

  const resetTooltipData = () => {
    setFullName(fullNameInit);
    setDescription(descriptionInit);
    setPdbId(pdbIdInit);
    setProtIdNoIsoform(protIdNoIsoformInit);
    setGene(geneInit);
    setIsoforms(isoformsInit);
    setHasPhosphosites(hasPhosphositesInit);
    setResponsePdb(responsePdbInit);
  };

  useEffect(() => {
    if (!tooltipSettings.clickTooltipData?.node) return;

    const fetchData = async () => {
      try {
        const entries = getNodeIdEntries(tooltipSettings.clickTooltipData.node);
        const { protIdNoIsoform, gene, hasPhosphosites, isoforms } = parseNodeIdEntries(entries);
        setProtIdNoIsoform(protIdNoIsoform);
        setGene(gene);
        setHasPhosphosites(hasPhosphosites);
        setIsoforms(isoforms);

        if (!protIdNoIsoform) return;

        const responseUniprot = await axios.get(`http://localhost:3001/uniprot/${protIdNoIsoform}`);
        const uniprotData = responseUniprot?.data;
        if (!uniprotData) return;

        setFullName(getFullNameUniprotData(uniprotData) || "");
        setDescription(getDescriptionUniprotData(uniprotData) || "");

        const pdbId = getPdbIdUniprotData(uniprotData);
        if (!pdbId) return;
        setPdbId(pdbId);

        const responsePdb = await axios.get(`https://files.rcsb.org/download/${pdbId}.pdb`);
        if (responsePdb?.data) setResponsePdb(responsePdb);
      } catch (error) {
        log.error(error);
      }
    };

    resetTooltipData();
    fetchData();
  }, [tooltipSettings.clickTooltipData]);

  // Init 3Dmol viewer
  useEffect(() => {
    if (!viewerRef.current || viewer) return;
    try {
      const config = { backgroundColor: theme.name === "light" ? "0xffffff" : "0x2a2e35" };
      setViewer($3Dmol.createViewer(viewerRef.current, config));
    } catch (error) {
      log.error(error);
    }
  }, [viewerRef.current]);

  // Render PDB model
  useEffect(() => {
    if (!viewer || !responsePdb || !tooltipSettings.isClickTooltipActive) return;
    viewer.clear();
    viewer.addModel(responsePdb.data, "pdb");
    viewer.setStyle({}, { cartoon: { color: "spectrum" } });
    viewer.zoomTo();
    viewer.render();
  }, [viewer, responsePdb, tooltipSettings.isClickTooltipActive]);

  // Update background color on theme change
  useEffect(() => {
    if (viewer) viewer.setBackgroundColor(theme.name === "light" ? "0xffffff" : "0x2a2e35");
  }, [theme]);

  // Position Tooltip
  useEffect(() => {
    if (!tooltipSettings.isClickTooltipActive) return;

    const { x, y } = tooltipSettings.clickTooltipData;
    const left = x > container.width ? x - 15 : x + 15;
    const top = y;
    let transform = "";

    if (y > container.height / 2) transform += " translateY(-100%)";
    if (x > container.width) transform += " translateX(-100%)";

    setStyle({ left: `${left}px`, top: `${top}px`, transform });
  }, [tooltipSettings.isClickTooltipActive, tooltipSettings.clickTooltipData]);

  const groupContent =
    mappingState.mapping?.data?.groupMapping && tooltipSettings.clickTooltipData?.nodeGroups
      ? tooltipSettings.clickTooltipData.nodeGroups
          .map((group) => {
            const { name, reactomeId } = mappingState.mapping.data.groupMapping[group] || {};
            return reactomeId ? (
              <a key={group} href={`https://reactome.org/PathwayBrowser/#/${reactomeId}`} target="_blank" rel="noopener noreferrer">
                {name}
              </a>
            ) : (
              name || group
            );
          })
          .reduce((acc, item, i) => (i === 0 ? [item] : [...acc, ", ", item]), [])
      : [];

  return (
    <Tooltip
      heading={gene}
      isOpen={tooltipSettings.isClickTooltipActive}
      setIsOpen={(value) => setTooltipSettings("isClickTooltipActive", value)}
      style={style}
      footer={
        <>
          {fullName && (
            <a className="tooltip-footer-item" href={`https://www.uniprot.org/uniprotkb/${protIdNoIsoform}/`} target="_blank" rel="noreferrer">
              To UniProt
            </a>
          )}
          {pdbId && (
            <a className="tooltip-footer-item" href={`https://www.rcsb.org/structure/${pdbId}/`} target="_blank" rel="noreferrer">
              To RCSB PDB
            </a>
          )}
        </>
      }
    >
      {fullName && (
        <>
          <b className="text-secondary">Full Name</b>
          <div>{fullName}</div>
        </>
      )}

      {isoforms.length > 0 && (
        <>
          <b className="text-secondary">Protein-IDs {hasPhosphosites && "and Phosphosites"}</b>
          <div>
            {isoforms.map(({ pepId, phosphosites }, i) => (
              <div key={`${pepId}-${i}`}>
                {pepId}
                {phosphosites ? `: ${phosphosites}` : ""}
              </div>
            ))}
          </div>
        </>
      )}

      {groupContent.length > 0 && (
        <>
          <b className="text-secondary">Gene/Protein Annotations</b>
          <div>{groupContent}</div>
        </>
      )}

      {description && (
        <>
          <b className="text-secondary">Description</b>
          <div>{description}</div>
        </>
      )}

      <div
        className="pdb-viewer"
        ref={viewerRef}
        style={!responsePdb ? { position: "absolute", left: "-9999px", width: "1px", height: "1px" } : {}}
      />
    </Tooltip>
  );
}
