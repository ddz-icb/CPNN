import { ReactComponent as DeleteIcon } from "../../icons/delete.svg";
import { ReactComponent as TrashIcon } from "../../icons/trash.svg";
import { ReactComponent as PlusIcon } from "../../icons/plus.svg";
import { Tooltip } from "react-tooltip";
import { useState } from "react";

import { SidebarButtonRect, SidebarDropdownItem } from "./sidebar";

export function DataSidebar({
  activeFiles,
  handleRemoveActiveFile,
  uploadedFiles,
  handleFileSelect,
  handleDeleteFile,
  handleAddFile,
  handleNewMapping,
  mappingInputRef,
  handleUploadMappingClick,
  activeMapping,
  handleRemoveActiveMapping,
  uploadedMappings,
  handleMappingSelect,
  handleDeleteMapping,
  handleGraphAbsUploadClick,
  handleGraphZeroUploadClick,
  graphAbsInputRef,
  graphZeroInputRef,
  handleNewFile,
}) {
  return (
    <>
      <TopDataButtons
        handleGraphAbsUploadClick={handleGraphAbsUploadClick}
        handleGraphZeroUploadClick={handleGraphZeroUploadClick}
        handleNewFile={handleNewFile}
        graphAbsInputRef={graphAbsInputRef}
        graphZeroInputRef={graphZeroInputRef}
        handleNewMapping={handleNewMapping}
        mappingInputRef={mappingInputRef}
        handleUploadMappingClick={handleUploadMappingClick}
      />
      <ActiveFiles activeFiles={activeFiles} handleRemoveActiveFile={handleRemoveActiveFile} />
      <UploadedFiles
        uploadedFiles={uploadedFiles}
        handleFileSelect={handleFileSelect}
        handleDeleteFile={handleDeleteFile}
        handleAddFile={handleAddFile}
      />
      <ActiveMapping activeMapping={activeMapping} handleRemoveActiveMapping={handleRemoveActiveMapping} />
      <UploadedMappings uploadedMappings={uploadedMappings} handleMappingSelect={handleMappingSelect} handleDeleteMapping={handleDeleteMapping} />
    </>
  );
}

function UploadedFiles({ uploadedFiles, handleFileSelect, handleDeleteFile, handleAddFile }) {
  return (
    <>
      <b className="heading-label">Uploaded Files</b>
      <table className="recent-item-table">
        <tbody>
          {uploadedFiles?.map((name, index) => (
            <tr key={index} className="recent-item-entry recent-item-entry-highlight">
              <td className="recent-item-text sidebar-tooltip-wrapper" onClick={() => handleFileSelect(name)}>
                <div data-tooltip-id={`replace-tooltip-${index}`} data-tooltip-content="Replace Active Graphs" className="pad-left-025">
                  {name}
                </div>
                <Tooltip id={`replace-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
              </td>
              <td className="recent-item-logo sidebar-tooltip-wrapper">
                <PlusIcon data-tooltip-id={`add-tooltip-${index}`} data-tooltip-content="Set Graph Active" onClick={() => handleAddFile(name)} />
                <Tooltip id={`add-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
              </td>
              <td className="recent-item-logo sidebar-tooltip-wrapper">
                <TrashIcon data-tooltip-id={`delete-tooltip-${index}`} data-tooltip-content="Delete Graph" onClick={() => handleDeleteFile(name)} />
                <Tooltip id={`delete-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
              </td>
            </tr>
          ))}
          {(!uploadedFiles || uploadedFiles.length === 0) && (
            <tr className="recent-item-entry">
              <td>None</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

function ActiveFiles({ activeFiles, handleRemoveActiveFile }) {
  return (
    <>
      <b className="heading-label">Currently Active Files</b>
      <table className="active-item-table">
        <tbody>
          {activeFiles?.map((file, index) => (
            <tr key={index} className="recent-item-entry">
              <td>
                <span className="pad-left-025">{file.name}</span>
              </td>
              <td className="recent-item-logo sidebar-tooltip-wrapper">
                <DeleteIcon
                  data-tooltip-id={`remove-tooltip-${index}`}
                  data-tooltip-content="Remove Graph"
                  onClick={() => handleRemoveActiveFile(file)}
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

function UploadedMappings({ uploadedMappings, handleMappingSelect, handleDeleteMapping }) {
  return (
    <>
      <>
        <b className="heading-label">Uploaded Annotation Mappings</b>
        <table className="recent-item-table">
          <tbody>
            {uploadedMappings && (
              <>
                {uploadedMappings?.map((mapping, index) => (
                  <tr key={index} className="recent-item-entry recent-item-entry-highlight">
                    <td className="recent-item-text sidebar-tooltip-wrapper" onClick={() => handleMappingSelect(mapping)}>
                      <div data-tooltip-id={`replace-mapping-tooltip-${index}`} data-tooltip-content="Replace Active Annotation Mapping">
                        <span className="pad-left-025">{mapping.name}</span>
                      </div>
                      <Tooltip id={`replace-mapping-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
                    </td>
                    <td className="recent-item-logo sidebar-tooltip-wrapper">
                      <TrashIcon
                        data-tooltip-id={`delete-mapping-tooltip-${index}`}
                        data-tooltip-content="Delete Annotation Mapping"
                        onClick={() => handleDeleteMapping(mapping.name)}
                      />
                      <Tooltip id={`delete-mapping-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
                    </td>
                  </tr>
                ))}
              </>
            )}
            {(!uploadedMappings || uploadedMappings.length === 0) && (
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

function ActiveMapping({ activeMapping, handleRemoveActiveMapping }) {
  return (
    <>
      <>
        <b className="heading-label">Currently Active Annotation Mapping</b>
        <table className="active-item-table">
          <tbody>
            {activeMapping && (
              <tr className="recent-item-entry">
                <td>
                  <span className="pad-left-025">{activeMapping.name}</span>
                </td>
                <td className="recent-item-logo sidebar-tooltip-wrapper">
                  <DeleteIcon
                    data-tooltip-id={`delete-active-mapping-tooltip`}
                    data-tooltip-content="Remove mapping"
                    onClick={() => handleRemoveActiveMapping()}
                  />
                  <Tooltip id={`delete-active-mapping-tooltip`} place="top" effect="solid" className="sidebar-tooltip" />
                </td>
              </tr>
            )}
            {!activeMapping && (
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

export function TopDataButtons({
  handleGraphAbsUploadClick,
  handleGraphZeroUploadClick,
  handleNewFile,
  graphAbsInputRef,
  graphZeroInputRef,
  handleUploadMappingClick,
  handleNewMapping,
  mappingInputRef,
}) {
  const [dropdownActive, setDropdownActive] = useState(false);

  const handleMainButtonClick = () => {
    setDropdownActive(!dropdownActive);
  };

  let content = null;

  if (dropdownActive) {
    content = (
      <div className="pad-left-1 inline">
        <div className="dropdown-sidebar">
          <SidebarDropdownItem
            text={"take absolute value of link weights"}
            onClick={handleGraphAbsUploadClick}
            linkRef={graphAbsInputRef}
            onChange={(event) => {
              const takeAbs = true;
              handleNewFile(event, takeAbs);
            }}
          />
          <SidebarDropdownItem
            text={"set negative link weights to 0"}
            onClick={handleGraphZeroUploadClick}
            linkRef={graphZeroInputRef}
            onChange={(event) => {
              const takeAbs = false;
              handleNewFile(event, takeAbs);
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
          onChange={handleNewFile}
          linkRef={graphAbsInputRef}
        />
        <SidebarButtonRect
          onClick={handleUploadMappingClick}
          onChange={handleNewMapping}
          text={"Upload Gene/Protein Annotations"}
          linkRef={mappingInputRef}
          tooltip={"Upload Gene/Protein Annotation Mappings as TSV File"}
          tooltipId={"upload-graph-tooltip"}
        />
      </>
    );
  }

  return <div className="pad-bottom-1 pad-top-05 data-buttons">{content}</div>;
}
