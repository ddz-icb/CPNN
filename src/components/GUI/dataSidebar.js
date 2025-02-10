import { ReactComponent as DeleteIcon } from "../../icons/delete.svg";
import { ReactComponent as TrashIcon } from "../../icons/trash.svg";
import { ReactComponent as PlusIcon } from "../../icons/plus.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { Tooltip } from "react-tooltip";
import { useEffect, useRef, useState } from "react";

import { PopupButtonRect, PopUpDoubleTextField, PopUpSwitchBlock, PopUpTextField, SidebarButtonRect } from "./sidebar.js";
import log from "../../logger.js";
import { useGraphData } from "../../states.js";
import { exampleGraphJson } from "../../demodata/exampleGraphJSON.js";
import { downloadCsvFile, downloadObjectAsFile } from "../GraphStuff/download.js";
import { exampleGraphCsv } from "../../demodata/exampleGraphCSV.js";
import { exampleMappingCsv } from "../../demodata/exampleMappingCSV.js";

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
      <div className="center-parent-container">
        <span className="heading-label">Uploaded Graphs</span>
      </div>
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
                <PlusIcon
                  data-tooltip-id={`add-tooltip-${index}`}
                  data-tooltip-content="Add Graph to Currently Active Graphs"
                  onClick={() => handleAddFile(filename)}
                />
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
      <span className="heading-label">Currently Active Graphs</span>
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
        <span className="heading-label">Uploaded Pathway Mappings</span>
        <table className="recent-item-table">
          <tbody>
            {uploadedAnnotationMappingNames && (
              <>
                {uploadedAnnotationMappingNames?.map((mappingName, index) => (
                  <tr key={index} className="recent-item-entry recent-item-entry-highlight">
                    <td className="recent-item-text sidebar-tooltip-wrapper" onClick={() => handleAnnotationMappingSelect(mappingName)}>
                      <div data-tooltip-id={`replace-mapping-tooltip-${index}`} data-tooltip-content="Replace Active Pathway Mapping">
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
                <td>
                  <span className="pad-left-025">None</span>
                </td>
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
        <span className="heading-label">Currently Active Pathway Mapping</span>
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
                <td>
                  <span className="pad-left-025">None</span>
                </td>
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
  const [mappingPopUpActive, setMappingPopUpActive] = useState(false);

  const [takeAbs, setTakeAbs] = useState(false);

  const [containsSites, setContainsSites] = useState(false);

  const [nodeIdFormat, setNodeIdFormat] = useState("");
  const [nodeIdExample1, setNodeIdExample1] = useState("");
  const [nodeIdExample2, setNodeIdExample2] = useState("");

  const annotationMappingFormat = "Uniprot-ID, Pathway Name, Reactome-ID";
  const annotationMappingExample = "O60306,mRNA Splicing,R-HSA-72172";

  const handleGraphPopUp = () => {
    setGraphPopUpActive(!graphPopUpActive);
  };

  const handleMappingPopUp = () => {
    setMappingPopUpActive(!mappingPopUpActive);
  };

  const handleGraphUploadClick = () => {
    graphFileRef.current.click();
  };

  const handleUploadMappingClick = () => {
    annotationMappingRef.current.click();
  };

  useEffect(() => {
    let id = "UniprotID";
    let name = "Name";
    let sites = "SiteA, SiteB, ... SiteT";
    let sites2 = "SiteU, SiteV, ... SiteW";

    const idFormat = `${id}1_ ${name}1${containsSites ? "_" + sites : ""}; ${id}2_${name}2${containsSites ? "_" + sites2 : ""}; ...`;

    const idExample1 = `P08590_MYL3${containsSites ? "_T165" : ""}`;
    const idExample2 = `Q8WZ42_TTN${containsSites ? "_T719, S721" : ""}; Q8WZ42-12_TTN${containsSites ? "_T765, S767" : ""}`;

    setNodeIdFormat(idFormat);
    setNodeIdExample1(idExample1);
    setNodeIdExample2(idExample2);
  }, [containsSites]);

  return (
    <>
      <div className="sidebar-two-buttons">
        <SidebarButtonRect
          onClick={handleGraphPopUp}
          text={"Upload Graph"}
          tooltip={"Upload Graph as CSV, TSV or JSON File"}
          tooltipId={"upload-graph-tooltip"}
        />
        <SidebarButtonRect
          onClick={handleMappingPopUp}
          text={"Upload Pathway Mappings"}
          tooltip={"Upload Pathway Annotation Mappings as a TSV or CSV File"}
          tooltipId={"upload-graph-tooltip"}
        />
      </div>
      {mappingPopUpActive && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header pad-bottom-1">
              <b>Uploading Your Pathway Mapping</b>
              <span className="tooltip-button" onClick={handleMappingPopUp}>
                <XIcon />
              </span>
            </div>
            <div className="popup-block color-text-primary">
              Uploading pathway mappings can provide additional context to classify nodes, determining their color. By doing so, nodes −such as
              peptides− are associated with one or more pathways. Nodes belonging to the same pathway will then be colored accordingly.
              <br />
              <br />
              Pathway mappings can be uploaded in CSV or TSV format. These mappings must contain a "UniProt-ID" and a "Pathway Name" column. If
              supplied with a "Reactome-ID" column, links to reactome.org with the corresponding pathway will be embedded, when klicking on nodes. To
              better understand the required format, you can download the example mapping below.
            </div>
            <PopUpTextField textInfront={"Pathway Mapping format:"} textInside={annotationMappingFormat} />
            <PopUpTextField textInfront={"Pathway Mapping example:"} textInside={annotationMappingExample} />
            <div className="popup-block">
              <PopupButtonRect
                text={"Download Example Pathway Mapping"}
                onClick={() => {
                  downloadCsvFile(exampleMappingCsv.content, exampleMappingCsv.name);
                }}
              />
              <PopupButtonRect
                text={"Upload Own Pathway Mapping"}
                onClick={handleUploadMappingClick}
                linkRef={annotationMappingRef}
                onChange={(event) => {
                  handleNewAnnotationMapping(event);
                  event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
                  setMappingPopUpActive(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      {graphPopUpActive && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header pad-bottom-1">
              <b>Uploading Your Graph</b>
              <span className="tooltip-button" onClick={handleGraphPopUp}>
                <XIcon />
              </span>
            </div>
            <div className="popup-block color-text-primary">
              You can upload your graphs in JSON, CSV or TSV format. CSV and TSV files must be structured as a symmetric matrix, while JSON contains a
              list of nodes and links. You can download the example graphs below to take a closer look at the required format.
            </div>
            <PopUpSwitchBlock
              text={"Include negative correlations by taking the absolute value"}
              value={takeAbs}
              onChange={() => {
                setTakeAbs(!takeAbs);
              }}
            />
            <PopUpSwitchBlock
              text={"Node IDs contain phosphosites"}
              value={containsSites}
              onChange={() => {
                setContainsSites(!containsSites);
              }}
            />
            <PopUpTextField textInfront={"Node ID format:"} textInside={nodeIdFormat} />
            <PopUpDoubleTextField textInfront={"Node ID examples:"} textInside1={nodeIdExample1} textInside2={nodeIdExample2} />
            <div className="popup-block">
              <PopupButtonRect
                text={"Download JSON Example Graph"}
                onClick={() => {
                  downloadObjectAsFile(exampleGraphJson.content, exampleGraphJson.name);
                }}
              />
              <PopupButtonRect
                text={"Download CSV Example Graph"}
                onClick={() => {
                  downloadCsvFile(exampleGraphCsv.content, exampleGraphCsv.name);
                }}
              />
            </div>
            <PopupButtonRect
              text={"Upload Own Graph File"}
              onClick={handleGraphUploadClick}
              linkRef={graphFileRef}
              onChange={(event) => {
                handleNewGraphFile(event, takeAbs);
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
