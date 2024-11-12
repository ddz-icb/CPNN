import log from "../../logger.js";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { ReactComponent as TrashIcon } from "../../icons/trash.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { extractDescription, extractFullName, extractPdbId } from "../RegexExtract/extract.js";
import * as $3Dmol from "3dmol/build/3Dmol.js";

export function Tooltips({
  isClickTooltipActive,
  setIsClickTooltipActive,
  clickTooltipData,
  isHoverTooltipActive,
  setIsHoverTooltipActive,
  hoverTooltipData,
  setNodeToDelete,
  theme,
  mapping,
}) {
  return (
    <>
      {isClickTooltipActive && (
        <ClickTooltip
          isActive={isClickTooltipActive}
          setIsActive={setIsClickTooltipActive}
          data={clickTooltipData}
          setNodeToDelete={setNodeToDelete}
          theme={theme}
          mapping={mapping}
        />
      )}
      {!isClickTooltipActive && isHoverTooltipActive && (
        <HoverTooltip isActive={isHoverTooltipActive} setIsActive={setIsHoverTooltipActive} data={hoverTooltipData} />
      )}
    </>
  );
}

export function ClickTooltip({ isActive, setIsActive, data, setNodeToDelete, theme, mapping }) {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [pdbId, setPdbId] = useState("");
  const [protIdNoIsoform, setProtIdNoIsoform] = useState("");
  const [gene, setGene] = useState("");
  const [isoforms, setIsoforms] = useState("");

  const [style, setStyle] = useState({});
  const [viewer, setViewer] = useState(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const entries = data.node.split(";");

        const protIdNoIsoform = entries[0].split("_")[0].split("-")[0];
        if (protIdNoIsoform) setProtIdNoIsoform(protIdNoIsoform);
        const gene = data.node.split("_")[1];
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

    if (data.node) {
      fetchData();
    }
  }, [data]);

  useEffect(() => {
    const initViewer = async () => {
      try {
        const responsePdb = await axios.get(`https://files.rcsb.org/download/${pdbId}.pdb`);
        if (!responsePdb) return;

        const config = {
          backgroundColor: theme === "light" ? "0xffffff" : "0x2a2e35",
        };
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

    const backgroundColor = theme === "light" ? "0xffffff" : "0x2a2e35";
    viewer.setBackgroundColor(backgroundColor);
  }, [theme]);

  useEffect(() => {
    setFullName("");
    setDescription("");
    setPdbId("");

    if (isActive) {
      setStyle({
        left: `${data.x + 15}px`,
        top: `${data.y}px`,
        opacity: 0.95,
        transition: "opacity 0.2s",
      });
    } else {
      setStyle({
        opacity: 0,
        transition: "opacity 0.2s",
      });
    }
  }, [isActive, data]);

  const closeTooltip = () => {
    setIsActive(false);
  };

  const handleDeleteNode = () => {
    setNodeToDelete(data.node);
  };

  let groupContent = [];
  if (mapping && mapping.groupMapping && data.nodeGroups[0]) {
    data.nodeGroups.forEach((group) => {
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
    data.nodeGroups.forEach((group) => {
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
          <div key={isoform.pepId}>
            {isoform.pepId}
            {isoform.phosphosites ? ": " + isoform.phosphosites : ""}
          </div>
        );
      }
    });
  }

  return (
    <div className="tooltip tooltip-click" style={style}>
      <div className="tooltip-content">
        <div className="tooltip-header">
          <b>{gene || data.node}</b>
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
              {description && (
                <>
                  <b className="no-margin-bottom text-secondary">Decription</b>
                  <div className="no-margin-top pad-bottom-05">{description}</div>
                </>
              )}
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

          <span className="tooltip-footer-item tooltip-button" onClick={handleDeleteNode}>
            <TrashIcon />
          </span>
        </div>
      </div>
    </div>
  );
}

export function HoverTooltip({ isActive, data }) {
  const [style, setStyle] = useState({});
  const [gene, setGene] = useState("");

  useEffect(() => {
    const gene = data.node.split("_")[1];
    if (gene) setGene(gene);
  }, [data]);

  useEffect(() => {
    if (isActive) {
      setStyle({
        left: `${data.x + 15}px`,
        top: `${data.y}px`,
        opacity: 0.95,
        transition: "opacity 0.2s",
      });
    } else {
      setStyle({
        opacity: 0,
        transition: "opacity 0.2s",
      });
    }
  }, [isActive, data]);

  return (
    <div className="tooltip" style={style}>
      <b>{gene || data.node}</b>
    </div>
  );
}

export function initTooltips(circle, node, setIsHoverTooltipActive, setHoverTooltipData, setIsClickTooltipActive, setClickTooltipData) {
  circle.on("mouseover", (mouseData) => {
    setIsHoverTooltipActive(true);
    setHoverTooltipData({
      node: node.id,
      nodeGroups: node.groups,
      x: mouseData.originalEvent.pageX,
      y: mouseData.originalEvent.pageY,
    });
  });
  circle.on("mouseout", () => {
    setIsHoverTooltipActive(false);
  });
  circle.on("click", (mouseData) => {
    setIsClickTooltipActive(true);
    setClickTooltipData({
      node: node.id,
      nodeGroups: node.groups,
      x: mouseData.originalEvent.pageX,
      y: mouseData.originalEvent.pageY,
    });
  });
}
