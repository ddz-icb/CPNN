import { useEffect, useRef, useState } from "react";
import { ReactComponent as TrashIcon } from "../../icons/trash.svg";
import { ReactComponent as PlusIcon } from "../../icons/plus.svg";
import { PopupButtonRect, PopUpTextField, SidebarButtonRect } from "./sidebar.js";
import { ReactComponent as LinesVertical } from "../../icons/lines-vertical.svg";
import { ReactComponent as CircleHollow } from "../../icons/circle-hollow.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { colorSchemeCsv } from "../../demodata/exampleColorSchemeCSV.js";
import { downloadCsvFile } from "../GraphStuff/download.js";
import { Tooltip } from "react-tooltip";
import { useSettings } from "../../states.js";

export function AppearanceSidebar({ handleNewColorScheme, handleDeleteColorScheme, colorSchemes }) {
  return (
    <>
      <TopAppearanceButtons
        handleNewColorScheme={handleNewColorScheme}
        colorSchemes={colorSchemes}
        handleDeleteColorScheme={handleDeleteColorScheme}
      />
      <ActiveNodeColorScheme />
      <ActiveLinkColorScheme />
      <UploadedColorSchemes colorSchemes={colorSchemes} handleDeleteColorScheme={handleDeleteColorScheme} />
    </>
  );
}

export function TopAppearanceButtons({ handleNewColorScheme, colorSchemes, handleDeleteColorScheme, activeMenu, handleActiveMenuClick }) {
  const [colorSchemePopUpActive, setColorSchemePopUpActive] = useState(false);

  const colorSchemeRef = useRef(null);

  let content = null;

  const handleUploadSchemeClick = () => {
    colorSchemeRef.current.click();
  };

  const handleColorSchemePopUp = () => {
    setColorSchemePopUpActive(!colorSchemePopUpActive);
  };

  return (
    <>
      <div className="sidebar-button">
        <SidebarButtonRect
          onClick={handleColorSchemePopUp}
          text={"Upload Color Schemes"}
          tooltip={"Upload your Color Scheme as a CSV or TSV File"}
          tooltipId={"upload-graph-tooltip"}
        />
      </div>
      {colorSchemePopUpActive && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header pad-bottom-1">
              <b>Uploading Your Color Scheme</b>
              <span
                className="tooltip-button"
                onClick={() => {
                  setColorSchemePopUpActive(false);
                }}
              >
                <XIcon />
              </span>
            </div>
            <div className="popup-block color-text-primary">
              A color scheme can determine the colors given to both links and nodes. It furthermore determines the order in which the colors are
              distributed.
              <br></br>
              <br></br>
              Color schemes can be uploaded as either CSV or TSV files. The colors should be listed using the HEX-format.
            </div>
            <PopUpTextField textInfront={"Color Scheme format:"} textInside={"Color1, Color2, Color3, ..."} />
            <PopUpTextField textInfront={"Color Scheme example:"} textInside={"#e69f00,#56b4e9,#009e73"} />
            <div className="popup-block">
              <PopupButtonRect
                text={"Download Example Color Scheme"}
                onClick={() => {
                  downloadCsvFile(colorSchemeCsv.content, colorSchemeCsv.name);
                }}
              />
              <PopupButtonRect
                text={"Upload Own Color Scheme"}
                onClick={handleUploadSchemeClick}
                linkRef={colorSchemeRef}
                onChange={(event) => {
                  handleNewColorScheme(event);
                  event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
                  setColorSchemePopUpActive(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      {content}
    </>
  );
}

function UploadedColorSchemes({ colorSchemes, handleDeleteColorScheme }) {
  const { settings, setSettings } = useSettings();

  return (
    <>
      <>
        <span className="heading-label">Uploaded Color Schemes</span>
        <table className="recent-item-table">
          <tbody>
            {colorSchemes && (
              <>
                {colorSchemes?.map((colorScheme, index) => (
                  <tr key={index} className="recent-item-entry recent-item-entry-highlight">
                    <td>
                      <span className="pad-left-025">{colorScheme.name}</span>
                    </td>
                    <td className="recent-item-logo sidebar-tooltip-wrapper">
                      <CircleHollow
                        data-tooltip-id={`add-tooltip-${index}`}
                        data-tooltip-content="Replace Active Node Color Scheme"
                        onClick={() => setSettings("appearance.nodeColorScheme", colorScheme)}
                      />
                      <Tooltip id={`add-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
                    </td>
                    <td className="recent-item-logo sidebar-tooltip-wrapper">
                      <LinesVertical
                        data-tooltip-id={`add-tooltip-${index}`}
                        data-tooltip-content="Replace Active Link Color Scheme"
                        onClick={() => setSettings("appearance.linkColorScheme", colorScheme)}
                      />
                      <Tooltip id={`add-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
                    </td>
                    <td className="recent-item-logo sidebar-tooltip-wrapper">
                      <TrashIcon
                        data-tooltip-id={`delete-mapping-tooltip-${index}`}
                        data-tooltip-content="Delete Color Scheme"
                        onClick={() => handleDeleteColorScheme(colorScheme.name)}
                      />
                      <Tooltip id={`delete-mapping-tooltip-${index}`} place="top" effect="solid" className="sidebar-tooltip" />
                    </td>
                  </tr>
                ))}
              </>
            )}
            {(!colorSchemes || colorSchemes.length === 0) && (
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

function ActiveNodeColorScheme({}) {
  const { settings, setSettings } = useSettings();

  return (
    <>
      <>
        <span className="heading-label">Active Node Color Scheme</span>
        <table className="active-item-table">
          <tbody>
            {settings.appearance.nodeColorScheme && (
              <tr className="recent-item-entry">
                <td>
                  <span className="pad-left-025">{settings.appearance.nodeColorScheme.name}</span>
                </td>
              </tr>
            )}
            {!settings.appearance.nodeColorScheme && (
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

function ActiveLinkColorScheme({}) {
  const { settings, setSettings } = useSettings();

  return (
    <>
      <>
        <span className="heading-label">Active Link Color Scheme</span>
        <table className="active-item-table">
          <tbody>
            {settings.appearance.linkColorScheme && (
              <tr className="recent-item-entry">
                <td>
                  <span className="pad-left-025">{settings.appearance.linkColorScheme.name}</span>
                </td>
              </tr>
            )}
            {!settings.appearance.linkColorScheme && (
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
