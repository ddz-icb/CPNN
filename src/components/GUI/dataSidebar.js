import { ReactComponent as DeleteIcon } from "../../icons/delete.svg";
import { ReactComponent as TrashIcon } from "../../icons/trash.svg";
import { ReactComponent as PlusIcon } from "../../icons/plus.svg";
import { Tooltip } from "react-tooltip";
import { useRef, useState } from "react";

import { SidebarButtonRect, SidebarDropdownItem } from "./sidebar.js";
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
  let uploadedGraphFileNamesNoExample = uploadedGraphFileNames.filter((name) => name != exampleGraphJson.name);

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
  const graphAbsRef = useRef(null);
  const graphZeroRef = useRef(null);

  const [dropdownActive, setDropdownActive] = useState(false);

  const handleMainButtonClick = () => {
    setDropdownActive(!dropdownActive);
  };

  const handleGraphAbsUploadClick = () => {
    graphAbsRef.current.click();
  };

  const handleGraphZeroUploadClick = () => {
    graphZeroRef.current.click();
  };

  const handleUploadMappingClick = () => {
    annotationMappingRef.current.click();
  };

  let content = null;

  if (dropdownActive) {
    content = (
      <div className="pad-left-1 inline">
        <div className="dropdown-sidebar">
          <SidebarDropdownItem
            text={"take absolute value of link weights"}
            onClick={handleGraphAbsUploadClick}
            linkRef={graphAbsRef}
            onChange={(event) => {
              const takeAbs = true;
              handleNewGraphFile(event, takeAbs);
            }}
          />
          <SidebarDropdownItem
            text={"set negative link weights to 0"}
            onClick={handleGraphZeroUploadClick}
            linkRef={graphZeroRef}
            onChange={(event) => {
              const takeAbs = false;
              handleNewGraphFile(event, takeAbs);
            }}
          />
        </div>
        <SidebarButtonRect onClick={handleMainButtonClick} text={"close"} tooltipId={"close-dropdown-tooltip"} />
      </div>
    );
  } else {
    content = (
      <>
        <SidebarButtonRect
          onClick={handleMainButtonClick}
          text={"Upload Graph"}
          tooltip={"Upload Graph as CSV/TSV Matrix or JSON File"}
          tooltipId={"upload-graph-tooltip"}
          onChange={handleNewGraphFile}
        />
        <SidebarButtonRect
          onClick={handleUploadMappingClick}
          onChange={handleNewAnnotationMapping}
          text={"Upload Gene/Protein Annotations"}
          linkRef={annotationMappingRef}
          tooltip={"Upload Gene/Protein Annotation Mappings as TSV File"}
          tooltipId={"upload-graph-tooltip"}
        />
      </>
    );
  }

  return <div className="pad-bottom-1 pad-top-05 data-buttons">{content}</div>;
}
