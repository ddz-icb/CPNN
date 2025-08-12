import log from "../../logger.js";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { extractDescription, extractFullName, extractPdbId } from "./regex/extract.js";
import * as $3Dmol from "3dmol/build/3Dmol.js";
import { useAppearance } from "../adapters/state/appearanceState.js";
import { useContainer } from "../adapters/state/containerState.js";
import { useTooltipSettings } from "../adapters/state/tooltipState.js";
import { useMappingData } from "../adapters/state/mappingState.js";

export function Tooltips({}) {
  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();
  const { mappingData, setMappingData } = useMappingData();

  return (
    <>
      {tooltipSettings.isClickTooltipActive && <ClickTooltip mapping={mappingData.activeMapping} />}
      {!tooltipSettings.isClickTooltipActive && tooltipSettings.isHoverTooltipActive && <HoverTooltip />}
    </>
  );
}

export function ClickTooltip({ mapping }) {
  const { appearance, setAppearance } = useAppearance();
  const { container, setContainer } = useContainer();

  const { tooltipSettings, setTooltipSettings } = useTooltipSettings();

  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [pdbId, setPdbId] = useState("");
  const [protIdNoIsoform, setProtIdNoIsoform] = useState("");
  const [gene, setGene] = useState("");
  const [isoforms, setIsoforms] = useState("");
  const [hasPhosphosites, setHasPhosphosites] = useState(false);
  const [responsePdb, setResponsePdb] = useState(null);

  const [style, setStyle] = useState({});
  const [viewer, setViewer] = useState(null);
  const viewerRef = useRef(null);

  // fetch data
  useEffect(() => {
    log.info("Fetching data for tooltip");
    const fetchData = async () => {
      try {
        const entries = tooltipSettings.clickTooltipData.node?.split(";");
        if (!entries || entries.length === 0) {
          log.info("No entries found in tooltip data");
          return;
        }

        const protIdNoIsoform = entries[0].split("_")[0].split("-")[0];
        if (!protIdNoIsoform) {
          log.info("No protein ID found");
          setProtIdNoIsoform("");
          return;
        }
        setProtIdNoIsoform(protIdNoIsoform);

        const gene = entries[0].split("_")[1];
        if (!gene) {
          log.info("No gene found");
          setGene("");
          return;
        }
        setGene(gene);

        const phosphosites = entries[0].split("_")[2];
        setHasPhosphosites(!!phosphosites);

        const isoforms = [];
        entries.forEach((entry) => {
          const pepId = entry.split("_")[0];
          const phosphosites = entry.split("_")[2];
          if (pepId) isoforms.push({ pepId: pepId, phosphosites: phosphosites });
        });
        if (isoforms.length > 0) {
          setIsoforms(isoforms);
        }

        const responseUniprot = await axios.get(`http://localhost:3001/uniprot/${protIdNoIsoform}`);
        // const responseUniprot = await axios.get(`https://cpnn.ddz.de/api/uniprot/${protIdNoIsoform}`);
        if (!responseUniprot || !responseUniprot.data) {
          log.info("No response from Uniprot");
          return;
        }

        const fullName = extractFullName(responseUniprot.data);
        if (!fullName) {
          log.info("No full name extracted");
          setFullName("");
          return;
        }
        setFullName(fullName);

        const description = extractDescription(responseUniprot.data);
        if (!description) {
          log.info("No description extracted");
          setDescription("");
          return;
        }
        setDescription(description);

        const pdbId = extractPdbId(responseUniprot.data);
        if (!pdbId) {
          log.info("No PDB ID extracted");
          setPdbId(null);
          return;
        }
        setPdbId(pdbId);

        const responsePdb = await axios.get(`https://files.rcsb.org/download/${pdbId}.pdb`);
        if (!responsePdb || !responsePdb.data) {
          log.info("No response from RCSB for PDB");
          return;
        }
        setResponsePdb(responsePdb);
      } catch (error) {
        log.error(error);
      }
    };

    if (tooltipSettings.clickTooltipData?.node) {
      fetchData();
    }
  }, [tooltipSettings.clickTooltipData]);

  // init viewer
  useEffect(() => {
    const initViewer = async () => {
      log.info("init 3dmol viewer");
      try {
        const config = {
          backgroundColor: appearance.theme.name === "light" ? "0xffffff" : "0x2a2e35",
        };
        if (
          !viewerRef ||
          !viewerRef.current || // need this check as the await from axios may take a while -> viewerRef.current has a different state
          viewerRef.current.clientWidth === 0 ||
          viewerRef.current.clientHeight === 0
        ) {
          return;
        }
        const viewer = $3Dmol.createViewer(viewerRef.current, config);
        setViewer(viewer);
      } catch (error) {
        log.error(error);
      }
    };

    if (viewerRef && viewerRef.current && !viewer) {
      initViewer();
    }
  }, [viewerRef.current]);

  useEffect(() => {
    if (!viewer || !responsePdb || !tooltipSettings.isClickTooltipActive) return;
    log.info("Adding model to 3dmol viewer");

    viewer.addModel(responsePdb.data, "pdb");
    viewer.setStyle({}, { cartoon: { color: "spectrum" } });
    viewer.zoomTo();
    viewer.render();
  }, [viewer, responsePdb, tooltipSettings.isClickTooltipActive]);

  useEffect(() => {
    if (!viewer) return;

    const backgroundColor = appearance.theme.name === "light" ? "0xffffff" : "0x2a2e35";
    viewer.setBackgroundColor(backgroundColor);
  }, [appearance.theme]);

  useEffect(() => {
    if (viewer) {
      viewer.clear();
    }

    setFullName("");
    setDescription("");
    setPdbId("");
    setResponsePdb(null);

    if (tooltipSettings.isClickTooltipActive) {
      let x = `${tooltipSettings.clickTooltipData.x + 15}px`;
      let x2 = `${tooltipSettings.clickTooltipData.x - 15}px`;
      let y = `${tooltipSettings.clickTooltipData.y}px`;

      if (tooltipSettings.clickTooltipData.y > container.height / 2) {
        setStyle({
          left: x,
          top: y,
          transform: "translateY(-100%)",
        });
        if (tooltipSettings.clickTooltipData.x > (2 * container.width) / 3) {
          setStyle({
            left: x2,
            top: y,
            transform: "translateX(-100%) translateY(-100%)",
          });
        }
      } else if (tooltipSettings.clickTooltipData.x > (2 * container.width) / 3) {
        setStyle({
          left: x2,
          top: y,
          transform: "translateX(-100%)",
        });
      } else {
        setStyle({
          left: x,
          top: y,
        });
      }
    }
  }, [tooltipSettings.isClickTooltipActive, tooltipSettings.clickTooltipData]);

  const closeTooltip = () => {
    if (viewer) {
      viewer.clear();
    }
    setTooltipSettings("isClickTooltipActive", false);
  };

  let groupContent = [];
  if (mapping && mapping.groupMapping && tooltipSettings.clickTooltipData?.nodeGroups[0]) {
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
    tooltipSettings.clickTooltipData?.nodeGroups?.forEach((group) => {
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
    isoforms.forEach((isoform, index) => {
      if (isoform.pepId) {
        isoformContent.push(
          <div key={`${isoform.pepId}-${index}`}>
            {isoform.pepId}
            {isoform.phosphosites ? ": " + isoform.phosphosites : ""}
          </div>
        );
      }
    });
  }

  return (
    <div
      className="tooltip tooltip-click"
      style={{
        ...style,
        opacity: tooltipSettings.isClickTooltipActive ? 0.95 : 0,
        visibility: tooltipSettings.isClickTooltipActive ? "visible" : "hidden",
      }}
    >
      <div className="tooltip-content">
        <div className="tooltip-header">
          <p>{gene}</p>
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
              <b className="no-margin-bottom text-secondary">Protein-IDs {hasPhosphosites ? "and Phosphosites" : ""}</b>
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
        <div
          className="pdb-viewer"
          ref={viewerRef}
          style={responsePdb ? {} : { position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
        ></div>
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
      });
    }
  }, [tooltipSettings.isHoverTooltipActive, tooltipSettings.hoverTooltipData]);

  return (
    <div className="tooltip" style={style}>
      <p className="margin-0">{gene}</p>
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
