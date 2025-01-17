import log from "../../logger.js";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { extractDescription, extractFullName, extractPdbId } from "../RegexExtract/extract.js";
import * as $3Dmol from "3dmol/build/3Dmol.js";
import { useGraphData, useSettings, useTooltipSettings } from "../../states.js";

export function Tooltips({}) {
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();
  const { graphData, setGraphData } = useGraphData();

  return (
    <>
      {tooltipSettings.isClickTooltipActive && <ClickTooltip mapping={graphData.mapping} />}
      {!tooltipSettings.isClickTooltipActive && tooltipSettings.isHoverTooltipActive && <HoverTooltip />}
    </>
  );
}

export function ClickTooltip({ mapping }) {
  const { settings, setSettings } = useSettings();
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();

  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [pdbId, setPdbId] = useState("");
  const [protIdNoIsoform, setProtIdNoIsoform] = useState("");
  const [gene, setGene] = useState("");
  const [isoforms, setIsoforms] = useState("");

  const [style, setStyle] = useState({});
  const [viewer, setViewer] = useState(null);
  const viewerRef = useRef(null);
  const tooltipRef = useRef(null); // wahrscheinlich noch zu löschen

  useEffect(() => {
    const fetchData = async () => {
      try {
        const entries = tooltipSettings.clickTooltipData.node.split(";");

        const protIdNoIsoform = entries[0].split("_")[0].split("-")[0];
        if (protIdNoIsoform) setProtIdNoIsoform(protIdNoIsoform);
        const gene = tooltipSettings.clickTooltipData.node.split("_")[1];
        if (gene) setGene(gene);

        const isoforms = [];
        entries.forEach((entry) => {
          const pepId = entry.split("_")[0];
          const phosphosites = entry.split("_")[2];
          if (pepId && phosphosites) isoforms.push({ pepId: pepId, phosphosites: phosphosites });
        });
        if (isoforms) setIsoforms(isoforms);

        // send request to localhost:3001 to append CORS-Header
        const responseUniprot = await axios.get(`http://localhost:3001/uniprot/${protIdNoIsoform}`);
        const fullName = extractFullName(responseUniprot.data);
        if (fullName) setFullName(fullName);

        const description = extractDescription(responseUniprot.data);
        if (description) setDescription(description);

        const pdbId = extractPdbId(responseUniprot.data);
        if (pdbId) setPdbId(pdbId);
      } catch (error) {
        log.error(error);
      }
    };

    if (tooltipSettings.clickTooltipData.node) {
      fetchData();
    }
  }, [tooltipSettings.clickTooltipData]);

  useEffect(() => {
    const initViewer = async () => {
      try {
        const responsePdb = await axios.get(`https://files.rcsb.org/download/${pdbId}.pdb`);
        if (!responsePdb) return;

        const config = {
          backgroundColor: settings.appearance.theme.name === "light" ? "0xffffff" : "0x2a2e35",
        };
        if (!viewerRef || !viewerRef.current) return; // need this check as the await from axios may take a while -> viewerRef.current has a different state
        const viewer = $3Dmol.createViewer(viewerRef.current, config);

        viewer.addModel(responsePdb.data, "pdb");
        viewer.setStyle({}, { cartoon: { color: "spectrum" } });
        viewer.zoomTo();
        viewer.render();
        setViewer(viewer);
      } catch (error) {
        log.error(error);
      }
    };

    if (pdbId && viewerRef.current) {
      initViewer();
    }
  }, [pdbId]);

  useEffect(() => {
    if (!viewer) return;

    const backgroundColor = settings.appearance.theme.name === "light" ? "0xffffff" : "0x2a2e35";
    viewer.setBackgroundColor(backgroundColor);
  }, [settings.appearance.theme]);

  useEffect(() => {
    setFullName("");
    setDescription("");
    setPdbId("");

    // NEXT: sicherstellen, dass die breite absolut ist und nicht kleiner wird falls zu nahe am rechten rand
    if (tooltipSettings.isClickTooltipActive) {
      let x = `${tooltipSettings.clickTooltipData.x + 15}px`;
      let x2 = `${tooltipSettings.clickTooltipData.x - 15}px`;
      let y = `${tooltipSettings.clickTooltipData.y}px`;

      if (tooltipSettings.clickTooltipData.y > settings.container.height / 2) {
        setStyle({
          left: x,
          top: y,
          opacity: 0.95,
          transform: "translateY(-100%)",
        });
        if (tooltipSettings.clickTooltipData.x > (2 * settings.container.width) / 3) {
          setStyle({
            left: x2,
            top: y,
            opacity: 0.95,
            transform: "translateX(-100%) translateY(-100%)",
          });
        }
      } else if (tooltipSettings.clickTooltipData.x > (2 * settings.container.width) / 3) {
        setStyle({
          left: x2,
          top: y,
          opacity: 0.95,
          transform: "translateX(-100%)",
        });
      } else {
        setStyle({
          left: x,
          top: y,
          opacity: 0.95,
        });
      }
    } else {
      setStyle({
        opacity: 0,
      });
    }
  }, [tooltipSettings.isClickTooltipActive, tooltipSettings.clickTooltipData]);

  const closeTooltip = () => {
    setTooltipSettings("isClickTooltipActive", false);
  };

  let groupContent = [];
  if (mapping && mapping.groupMapping && tooltipSettings.clickTooltipData.nodeGroups[0]) {
    tooltipSettings.clickTooltipData.nodeGroups.forEach((group) => {
      const groupName = mapping.groupMapping[group]?.name;
      const reactomeId = mapping.groupMapping[group]?.reactomeId;

      if (groupName && reactomeId) {
        groupContent.push(
          <a key={group} href={`https://reactome.org/PathwayBrowser/#/${reactomeId}`} target="_blank" rel="noopener noreferrer">
            {groupName}
          </a>
        );
      } else if (groupName) {
        groupContent.push(groupName);
      }
    });
  } else {
    tooltipSettings.clickTooltipData.nodeGroups.forEach((group) => {
      groupContent.push(group);
    });
  }

  groupContent = groupContent.reduce((acc, item, index) => {
    if (index === 0) {
      return [item];
    } else {
      return [...acc, ", ", item];
    }
  }, []);

  let isoformContent = [];
  if (isoforms[0]) {
    isoforms.forEach((isoform) => {
      if (isoform.pepId) {
        isoformContent.push(
          <div key={`${isoform.phosphosites}-${isoform.pepId}`}>
            {isoform.pepId}
            {isoform.phosphosites ? ": " + isoform.phosphosites : ""}
          </div>
        );
      }
    });
  }

  return (
    <div className="tooltip tooltip-click" style={style} ref={tooltipRef}>
      {style.opacity > 0 && (
        <div className="tooltip-content">
          <div className="tooltip-header">
            <b>{gene}</b>
            <span className="tooltip-button" onClick={closeTooltip}>
              <XIcon />
            </span>
          </div>
          <div className="tooltip-body">
            {fullName && (
              <>
                <b className="no-margin-bottom text-secondary">Full Name</b>
                <div className="no-margin-top pad-bottom-05">{fullName}</div>
              </>
            )}
            {isoforms && isoforms.length > 0 && (
              <>
                <b className="no-margin-bottom text-secondary">Protein-IDs and Phosphosites</b>
                <div className="no-margin-top pad-bottom-05">{isoformContent}</div>
              </>
            )}
            {groupContent && groupContent.length > 0 && (
              <>
                <b className="no-margin-bottom text-secondary">Gene/Protein Annotations</b>
                <div className="no-margin-top pad-bottom-05">{groupContent}</div>
              </>
            )}
            {description && (
              <>
                <b className="no-margin-bottom text-secondary">Decription</b>
                <div className="no-margin-top pad-bottom-05">{description}</div>
              </>
            )}
          </div>
          {pdbId && <div className="pdb-viewer" ref={viewerRef}></div>}
          <div className="tooltip-footer">
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
          </div>
        </div>
      )}
    </div>
  );
}

export function HoverTooltip({}) {
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();

  const [style, setStyle] = useState({});
  const [gene, setGene] = useState("");

  useEffect(() => {
    if (!tooltipSettings.hoverTooltipData) return;

    const gene = tooltipSettings.hoverTooltipData.node.split("_")[1];
    if (gene) setGene(gene);
  }, [tooltipSettings.hoverTooltipData]);

  useEffect(() => {
    if (tooltipSettings.isHoverTooltipActive) {
      setStyle({
        left: `${tooltipSettings.hoverTooltipData.x + 15}px`,
        top: `${tooltipSettings.hoverTooltipData.y}px`,
        opacity: 0.95,
        transition: "opacity 0.2s",
      });
    } else {
      setStyle({
        opacity: 0,
        transition: "opacity 0.2s",
      });
    }
  }, [tooltipSettings.isHoverTooltipActive, tooltipSettings.hoverTooltipData]);

  return (
    <div className="tooltip" style={style}>
      {style.opacity > 0 && <b>{gene}</b>}
    </div>
  );
}

export function initTooltips(circle, node, setTooltipSettings) {
  circle.on("mouseover", (mouseData) => {
    setTooltipSettings("hoverTooltipData", {
      node: node.id,
      nodeGroups: node.groups,
      x: mouseData.originalEvent.pageX,
      y: mouseData.originalEvent.pageY,
    });
    setTooltipSettings("isHoverTooltipActive", true);
  });
  circle.on("mouseout", () => {
    setTooltipSettings("isHoverTooltipActive", false);
  });
  circle.on("click", (mouseData) => {
    setTooltipSettings("clickTooltipData", {
      node: node.id,
      nodeGroups: node.groups,
      x: mouseData.originalEvent.pageX,
      y: mouseData.originalEvent.pageY,
    });
    setTooltipSettings("isClickTooltipActive", true);
  });
}
