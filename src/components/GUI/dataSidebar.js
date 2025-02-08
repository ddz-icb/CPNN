import { ReactComponent as DeleteIcon } from "../../icons/delete.svg";
import { ReactComponent as TrashIcon } from "../../icons/trash.svg";
import { ReactComponent as PlusIcon } from "../../icons/plus.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { Tooltip } from "react-tooltip";
import { useEffect, useRef, useState } from "react";

import { PopupButtonRect, PopUpSwitchBlock, PopUpTextField, SidebarButtonRect } from "./sidebar.js";
import log from "../../logger.js";
import { useGraphData } from "../../states.js";
import { exampleGraphJson } from "../../demographs/exampleGraphJSON.js";

export function DataSidebar({
  handleRemoveActiveGraphFile,
  handleSelectGraph,
  handleDeleteGraphFile,
  handleAddFile,
  handleNewAnnotationMapping,
  handleRemoveActiveAnnotationMapping,
  handleAnnotationMappingSelect,
  handleDeleteAnnotationMapping,
  handleNewGraphFile,
}) {
  const { graphData, setGraphData } = useGraphData();

  return (
    <>
      <TopDataButtons handleNewGraphFile={handleNewGraphFile} handleNewAnnotationMapping={handleNewAnnotationMapping} />
      <ActiveFiles activeGraphFileNames={graphData.activeGraphFileNames} handleRemoveActiveGraphFile={handleRemoveActiveGraphFile} />
      <UploadedFiles
        uploadedGraphFileNames={graphData.uploadedGraphFileNames}
        handleSelectGraph={handleSelectGraph}
        handleDeleteGraphFile={handleDeleteGraphFile}
        handleAddFile={handleAddFile}
      />
      <ActiveAnnotationMapping
        activeAnnotationMapping={graphData.activeAnnotationMapping}
        handleRemoveActiveAnnotationMapping={handleRemoveActiveAnnotationMapping}
      />
      <UploadedMappings
        uploadedAnnotationMappingNames={graphData.uploadedAnnotationMappingNames}
        handleAnnotationMappingSelect={handleAnnotationMappingSelect}
        handleDeleteAnnotationMapping={handleDeleteAnnotationMapping}
      />
    </>
  );
}

function UploadedFiles({ uploadedGraphFileNames, handleSelectGraph, handleDeleteGraphFile, handleAddFile }) {
  let uploadedGraphFileNamesNoExample = uploadedGraphFileNames?.filter((name) => name !== exampleGraphJson.name);

  return (
    <>
      <b className="heading-label">Uploaded Files</b>
      <table className="recent-item-table">
        <tbody>
          {uploadedGraphFileNamesNoExample?.map((filename, index) => (
            <tr key={index} className="recent-item-entry recent-item-entry-highlight">
              <td className="recent-item-text sidebar-tooltip-wrapper" onClick={() => handleSelectGraph(filename)}>
                <div data-tooltip-id={`replace-tooltip-${index}`} data-tooltip-content="Replace Active Graphs" className="pad-left-025">
                  {filename}
                </div>
                <Tooltip id={`replace-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
              </td>
              <td className="recent-item-logo sidebar-tooltip-wrapper">
                <PlusIcon data-tooltip-id={`add-tooltip-${index}`} data-tooltip-content="Set Graph Active" onClick={() => handleAddFile(filename)} />
                <Tooltip id={`add-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
              </td>
              <td className="recent-item-logo sidebar-tooltip-wrapper">
                <TrashIcon
                  data-tooltip-id={`delete-tooltip-${index}`}
                  data-tooltip-content="Delete Graph"
                  onClick={() => handleDeleteGraphFile(filename)}
                />
                <Tooltip id={`delete-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
              </td>
            </tr>
          ))}
          {(!uploadedGraphFileNamesNoExample || uploadedGraphFileNamesNoExample.length === 0) && (
            <tr className="recent-item-entry">
              <td className="recent-item-text sidebar-tooltip-wrapper" onClick={() => handleSelectGraph(exampleGraphJson.name)}>
                <div data-tooltip-id={`replace-tooltip-example`} data-tooltip-content="Replace Active Graphs" className="pad-left-025">
                  {exampleGraphJson.name}
                </div>
                <Tooltip id={`replace-tooltip-example`} place="top" effect="solid" className="sidebar-tooltip" />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

function ActiveFiles({ activeGraphFileNames, handleRemoveActiveGraphFile }) {
  return (
    <>
      <b className="heading-label">Currently Active Files</b>
      <table className="active-item-table">
        <tbody>
          {activeGraphFileNames?.map((filename, index) => (
            <tr key={index} className="recent-item-entry">
              <td>
                <span className="pad-left-025">{filename}</span>
              </td>
              <td className="recent-item-logo sidebar-tooltip-wrapper">
                <DeleteIcon
                  data-tooltip-id={`remove-tooltip-${index}`}
                  data-tooltip-content="Remove Graph"
                  onClick={() => handleRemoveActiveGraphFile(filename)}
                />
                <Tooltip id={`remove-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function UploadedMappings({ uploadedAnnotationMappingNames, handleAnnotationMappingSelect, handleDeleteAnnotationMapping }) {
  return (
    <>
      <>
        <b className="heading-label">Uploaded Annotation Mappings</b>
        <table className="recent-item-table">
          <tbody>
            {uploadedAnnotationMappingNames && (
              <>
                {uploadedAnnotationMappingNames?.map((mappingName, index) => (
                  <tr key={index} className="recent-item-entry recent-item-entry-highlight">
                    <td className="recent-item-text sidebar-tooltip-wrapper" onClick={() => handleAnnotationMappingSelect(mappingName)}>
                      <div data-tooltip-id={`replace-mapping-tooltip-${index}`} data-tooltip-content="Replace Active Annotation Mapping">
                        <span className="pad-left-025">{mappingName}</span>
                      </div>
                      <Tooltip id={`replace-mapping-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
                    </td>
                    <td className="recent-item-logo sidebar-tooltip-wrapper">
                      <TrashIcon
                        data-tooltip-id={`delete-mapping-tooltip-${index}`}
                        data-tooltip-content="Delete Annotation Mapping"
                        onClick={() => handleDeleteAnnotationMapping(mappingName)}
                      />
                      <Tooltip id={`delete-mapping-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
                    </td>
                  </tr>
                ))}
              </>
            )}
            {(!uploadedAnnotationMappingNames || uploadedAnnotationMappingNames.length === 0) && (
              <tr className="recent-item-entry">
                <td>None</td>
              </tr>
            )}
          </tbody>
        </table>
      </>
    </>
  );
}

function ActiveAnnotationMapping({ activeAnnotationMapping, handleRemoveActiveAnnotationMapping }) {
  return (
    <>
      <>
        <b className="heading-label">Currently Active Annotation Mapping</b>
        <table className="active-item-table">
          <tbody>
            {activeAnnotationMapping && (
              <tr className="recent-item-entry">
                <td>
                  <span className="pad-left-025">{activeAnnotationMapping.name}</span>
                </td>
                <td className="recent-item-logo sidebar-tooltip-wrapper">
                  <DeleteIcon
                    data-tooltip-id={`delete-active-mapping-tooltip`}
                    data-tooltip-content="Remove mapping"
                    onClick={() => handleRemoveActiveAnnotationMapping()}
                  />
                  <Tooltip id={`delete-active-mapping-tooltip`} place="top" effect="solid" className="sidebar-tooltip" />
                </td>
              </tr>
            )}
            {!activeAnnotationMapping && (
              <tr className="recent-item-entry">
                <td>None</td>
              </tr>
            )}
          </tbody>
        </table>
      </>
    </>
  );
}

export function TopDataButtons({ handleNewGraphFile, handleNewAnnotationMapping }) {
  const annotationMappingRef = useRef(null);
  const graphFileRef = useRef(null);

  const [graphPopUpActive, setGraphPopUpActive] = useState(false);

  const [takeAbs, setTakeAbs] = useState(false);
  const [containsUniprotId, setContainsUniprotIds] = useState(false);
  const [containsGene, setContainsGene] = useState(false);
  const [containsSites, setContainsSites] = useState(false);

  const [nodeIdFormat, setNodeIdFormat] = useState("");
  const [nodeIdExample, setNodeIdExample] = useState("");

  const handleUploadGraphPopUp = () => {
    setGraphPopUpActive(!graphPopUpActive);
  };

  const handleGraphUploadClick = () => {
    graphFileRef.current.click();
  };

  const handleUploadMappingClick = () => {
    annotationMappingRef.current.click();
  };

  useEffect(() => {
    let id = containsUniprotId ? "UNIPROT-ID" : "NODE-ID";
    let gene = "GENE";
    let sites = "SITE-A, SITE-B, ... SITE-T";

    const idFormat = `${id}${containsUniprotId ? "-1" : ""}${containsGene ? "_" + gene + (containsUniprotId ? "-1" : "") : ""}${
      containsSites ? "_" + sites : ""
    }${containsUniprotId ? "; " + id + "-2 ..." : ""}`;

    const idExample = `${containsUniprotId ? "Q8WZ42" : "ID123"}${containsGene ? "_TTN" : ""}${containsSites ? "_T719, S721" : ""}${
      containsUniprotId ? "; Q8WZ42-12 ..." : ""
    }`;
    // let idExample = "Q8WZ42-2_TTN_T719, S721; Q8WZ42-10_TTN_T765, S767; Q8WZ42-12_TTN_T811, S813";

    setNodeIdFormat(idFormat);
    setNodeIdExample(idExample);
  }, [containsUniprotId, containsGene, containsSites]);

  return (
    <>
      <div className="pad-bottom-1 pad-top-05 data-buttons">
        <SidebarButtonRect
          onClick={handleUploadGraphPopUp}
          text={"Upload Graph"}
          tooltip={"Upload Graph as CSV/TSV Matrix or JSON File"}
          tooltipId={"upload-graph-tooltip"}
        />
        <SidebarButtonRect
          onClick={handleUploadMappingClick}
          onChange={(event) => {
            handleNewAnnotationMapping(event);
            event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
          }}
          text={"Upload Gene/Protein Annotations"}
          linkRef={annotationMappingRef}
          tooltip={"Upload Gene/Protein Annotation Mappings as TSV File"}
          tooltipId={"upload-graph-tooltip"}
        />
      </div>
      {graphPopUpActive && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header pad-bottom-1">
              <b>Upload Your Graph Here</b>
              <span className="tooltip-button" onClick={handleUploadGraphPopUp}>
                <XIcon />
              </span>
            </div>
            <PopUpSwitchBlock
              text={"Include negative correlations by taking the absolute value"}
              value={takeAbs}
              onChange={() => {
                setTakeAbs(!takeAbs);
              }}
            />
            <PopUpSwitchBlock
              text={"Node IDs contain Uniprot IDs"}
              value={containsUniprotId}
              onChange={() => {
                setContainsUniprotIds(!containsUniprotId);
              }}
            />
            <PopUpSwitchBlock
              text={"Node IDs contain the gene name"}
              value={containsGene}
              onChange={() => {
                setContainsGene(!containsGene);
              }}
            />
            <PopUpSwitchBlock
              text={"Node IDs contain phosphosites"}
              value={containsSites}
              onChange={() => {
                setContainsSites(!containsSites);
              }}
            />
            <PopUpTextField
              textInfront={"Your Node ID format:"}
              // NEXT: DEPENDING ON THE SELECTED ID ATTRIBUTES THE FORMAT AND EXAMPLE SHOWN SHOULD CHANGE (MAKE FORMAT AND EXAMPLE FOR EVERY CASE)
              // DEPENDING ON THE SELECTED ID ATTRIBUTES THE PARSING HAS TO BE HANDLED ALTERNATIVELY
              textInside={nodeIdFormat}
            />
            <PopUpTextField textInfront={"Node ID example:"} textInside={nodeIdExample} />
            <PopupButtonRect
              text={"Upload Graph File"}
              onClick={handleGraphUploadClick}
              linkRef={graphFileRef}
              onChange={(event) => {
                handleNewGraphFile(event, takeAbs, containsGene, containsSites, containsUniprotId);
                event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
                setGraphPopUpActive(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
