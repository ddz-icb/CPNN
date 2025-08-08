import { ReactComponent as DeleteIcon } from "../../icons/delete.svg";
import { ReactComponent as TrashIcon } from "../../icons/trash.svg";
import { ReactComponent as PlusIcon } from "../../icons/plus.svg";
import { ReactComponent as XIcon } from "../../icons/x.svg";
import { Tooltip } from "react-tooltip";
import { useEffect, useRef, useState } from "react";

import {
  PopupButtonRect,
  PopUpDoubleTextField,
  PopUpSwitchBlock,
  PopUpTextField,
  SidebarButtonRect,
  PopUpSliderBlock,
  PopUpFieldBlock,
  PopUp,
} from "./reusableComponents/sidebarComponents.js";
import log from "../../logger.js";
import { useGraphData, useSettings } from "../../states.js";
import { exampleGraphJson } from "../../demodata/exampleGraphJSON.js";
import { downloadCsvFile, downloadObjectAsFile } from "../GraphStuff/download.js";
import { exampleGraphCsv } from "../../demodata/exampleGraphCSV.js";
import { exampleMappingCsv } from "../../demodata/exampleMappingCSV.js";
import { exampleGraphRaw } from "../../demodata/exampleGraphRawTSV.js";

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
  handleCreateDifferenceGraph,
}) {
  const { graphData, setGraphData } = useGraphData();

  return (
    <>
      <TopDataButtons
        handleNewGraphFile={handleNewGraphFile}
        handleNewAnnotationMapping={handleNewAnnotationMapping}
        handleCreateDifferenceGraph={handleCreateDifferenceGraph}
      />
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
  const { settings, setSettings } = useSettings();

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

export function TopDataButtons({ handleNewGraphFile, handleNewAnnotationMapping, handleCreateDifferenceGraph }) {
  const annotationMappingRef = useRef(null);
  const graphFileRef = useRef(null);

  const [graphPopUpActive, setGraphPopUpActive] = useState(false);
  const [mappingPopUpActive, setMappingPopUpActive] = useState(false);
  const [differencePopUpActive, setDifferencePopUpActive] = useState(false);
  const { graphData, setGraphData } = useGraphData();
  const uploadedGraphFileNames = graphData.uploadedGraphFileNames || [];
  const uploadedGraphFileNamesNoExample = uploadedGraphFileNames.filter((name) => name !== exampleGraphJson.name);

  const [selectedGraphName1, setSelectedGraph1] = useState("");
  const [selectedGraphName2, setSelectedGraph2] = useState("");

  const handleGraph1Change = (event) => {
    setSelectedGraph1(event.target.value);
  };

  const handleGraph2Change = (event) => {
    setSelectedGraph2(event.target.value);
  };

  const [takeAbs, setTakeAbs] = useState(false);
  const [mergeSameProtein, setMergeSameProtein] = useState(false);
  const [takeSpearmanCoefficient, setTakeSpearmanCoefficient] = useState(false);

  const [minCorrForEdge, setMinCorrForEdge] = useState(0);
  const [minCorrForEdgeText, setMinCorrForEdgeText] = useState(0);

  const [minCompSizeForNode, setMinCompSizeForNode] = useState(2);
  const [minCompSizeForNodeText, setMinCompSizeForNodeText] = useState(2);

  const [maxCompSizeForNode, setMaxCompSizeForNode] = useState("");
  const [maxCompSizeForNodeText, setMaxCompSizeForNodeText] = useState("");

  const [containsSites, setContainsSites] = useState(false);

  const [nodeIdFormat, setNodeIdFormat] = useState("");
  const [nodeIdExample1, setNodeIdExample1] = useState("");
  const [nodeIdExample2, setNodeIdExample2] = useState("");

  const annotationMappingFormat = "Uniprot-ID, Pathway Name, Reactome-ID";
  const annotationMappingExample = "O60306,mRNA Splicing,R-HSA-72172";

  const handleGraphUploadClick = () => {
    graphFileRef.current.click();
  };

  const handleUploadMappingClick = () => {
    annotationMappingRef.current.click();
  };

  const handleMinCorrSliderChange = (event) => {
    const value = event.target.value;

    if (value >= 0 && value <= 1) {
      setMinCorrForEdge(value);
      setMinCorrForEdgeText(value);
    }
  };

  const handleMinCorrFieldChange = (event) => {
    const value = event.target.value;

    if (value >= 0 && value <= 1) {
      setMinCorrForEdgeText(value);
    }
  };

  const handleMinCorrFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      event.target.innerText = 0;
      setMinCorrForEdge(0);
      setMinCorrForEdgeText(0);
    } else if (value >= 0 && value <= 1) {
      event.target.innerText = value;
      setMinCorrForEdge(value);
      setMinCorrForEdgeText(value);
    }
  };

  const handleMinComponentFieldChange = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      setMinCompSizeForNodeText("");
    } else if (!isNaN(intValue)) {
      setMinCompSizeForNodeText(intValue);
    }
  };

  const handleMinComponentFieldBlur = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      event.target.innerText = 1;
      setMinCompSizeForNode(1);
      setMinCompSizeForNodeText(1);
    } else if (!isNaN(intValue) && intValue >= 0) {
      event.target.innerText = intValue;
      setMinCompSizeForNode(intValue);
      setMinCompSizeForNodeText(intValue);
    }
  };

  const handleMaxComponentFieldChange = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      setMaxCompSizeForNodeText("");
    } else if (!isNaN(intValue)) {
      setMaxCompSizeForNodeText(intValue);
    }
  };

  const handleMaxComponentFieldBlur = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      event.target.innerText = "";
      setMaxCompSizeForNode("");
      setMaxCompSizeForNodeText("");
    } else if (!isNaN(intValue) && intValue >= 1) {
      event.target.innerText = intValue;
      setMaxCompSizeForNode(intValue);
      setMaxCompSizeForNodeText(intValue);
    }
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
          onClick={() => setGraphPopUpActive(!graphPopUpActive)}
          text={"Upload Graph"}
          tooltip={"Upload Graph as CSV, TSV or JSON File"}
          tooltipId={"upload-graph-tooltip"}
        />
        <SidebarButtonRect
          onClick={() => setMappingPopUpActive(!mappingPopUpActive)}
          text={"Upload Pathway Mappings"}
          tooltip={"Upload Pathway Annotation Mappings as a TSV or CSV File"}
          tooltipId={"upload-mapping-tooltip"}
        />
      </div>
      {/* <SidebarButtonRect
        onClick={() => setDifferencePopUpActive(!differencePopUpActive)}
        text={"Create Difference Graph"}
        tooltip={"Create graph resembling the difference between two graphs"}
        tooltipId={"difference-graph-tooltip"}
      /> */}
      <PopUp
        heading={"Uploading Your Pathway Mapping"}
        description={
          <div className="popup-block color-text-primary">
            Uploading pathway mappings can provide additional context to classify nodes, determining their color. By doing so, nodes −such as
            peptides− are associated with one or more pathways. Nodes belonging to the same pathway will then be colored accordingly.
            <br />
            <br />
            Pathway mappings can be uploaded in CSV or TSV format. These mappings must contain a "UniProt-ID" and a "Pathway Name" column. If supplied
            with a "Reactome-ID" column, links to reactome.org with the corresponding pathway will be embedded, when klicking on nodes. To better
            understand the required format, you can download the example mapping below.
          </div>
        }
        isOpen={mappingPopUpActive}
        setIsOpen={setMappingPopUpActive}
      >
        <PopUpTextField textInfront={"Pathway Mapping format:"} textInside={annotationMappingFormat} />
        <div className="popup-block" />
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
      </PopUp>
      <PopUp
        heading={"Upload Graph"}
        description={
          "You can upload your graphs in JSON, CSV or TSV format. CSV and TSV files must be either structured as a symmetric matrix or raw table data, while JSON contains a list of nodes and links. You can download the example graphs below to take a closer look at the required format. When raw table data is uploaded, a correlation matrix will be automatically computed. For this computation all NaN values will be ignored."
        }
        isOpen={graphPopUpActive}
        setIsOpen={setGraphPopUpActive}
      >
        <div className="popup-block">
          <PopupButtonRect
            className="no-pad-top"
            text={"JSON Example Graph"}
            onClick={() => {
              downloadObjectAsFile(exampleGraphJson.content, exampleGraphJson.name);
            }}
          />
          <PopupButtonRect
            className="no-pad-top"
            text={"Matrix Example Graph"}
            onClick={() => {
              downloadCsvFile(exampleGraphCsv.content, exampleGraphCsv.name);
            }}
          />
          <PopupButtonRect
            className="no-pad-top"
            text={"Raw Data Example Graph"}
            onClick={() => {
              downloadCsvFile(exampleGraphRaw.content, exampleGraphRaw.name);
            }}
          />
        </div>
        <PopUpSwitchBlock
          text={"Calculate spearman correlation"}
          value={takeSpearmanCoefficient}
          onChange={() => {
            setTakeSpearmanCoefficient(!takeSpearmanCoefficient);
          }}
          infoHeading={"Use spearman correlation"}
          infoDescription={
            "This option applies exclusively when raw table data is uploaded. If enabled, the raw table data will be converted to a correlation matrix using the spearman correlation coefficient. By default the pearson correlation coefficient will be applied."
          }
        />
        <PopUpSwitchBlock
          text={"Include negative correlations by taking the absolute value"}
          value={takeAbs}
          onChange={() => {
            setTakeAbs(!takeAbs);
          }}
          infoHeading={"Include negative correlations"}
          infoDescription={
            "Negative correlations or link weights are ignored by default and not displayed. Enabling this option will use the absolute value of the correlation instead."
          }
        />
        <PopUpSwitchBlock
          text={"Merge nodes of same protein"}
          value={mergeSameProtein}
          onChange={() => {
            setMergeSameProtein(!mergeSameProtein);
          }}
          infoHeading={"Merge Proteins"}
          infoDescription={
            "Nodes with the same UniprotID and Name will be merged into a single node, along with their respective links. When multiple links to the same node are merged, the maximum absolute weight is used as the new link weight. Enabling this setting can significantly enhance performance by reducing the graph size."
          }
        />
        <div className="popup-block"></div>
        <PopUpSliderBlock
          text={"Minimum link correlation"}
          min={0}
          max={1}
          stepSlider={0.05}
          stepField={0.01}
          value={minCorrForEdge}
          valueText={minCorrForEdgeText}
          onChangeSlider={handleMinCorrSliderChange}
          onChangeField={handleMinCorrFieldChange}
          onChangeBlur={handleMinCorrFieldBlur}
          infoHeading={"Minimum link correlation"}
          infoDescription={
            "Minimum (absolute) correlation value or link weight required for display as a link. Increasing this value can significantly improve performance."
          }
        />
        <PopUpFieldBlock
          text={"Minimum component size"}
          min={1}
          step={1}
          value={minCompSizeForNodeText}
          onChange={handleMinComponentFieldChange}
          onBlur={handleMinComponentFieldBlur}
          infoHeading={"Minimum component/cluster size"}
          infoDescription={
            "Based on the specified minimum link correlation above, set the minimum component/cluster size required for a node to be included in the graph. Increasing this value can significantly improve performance."
          }
        />
        <PopUpFieldBlock
          text={"Maximum component size"}
          min={1}
          step={1}
          value={maxCompSizeForNodeText}
          onChange={handleMaxComponentFieldChange}
          onBlur={handleMaxComponentFieldBlur}
          infoHeading={"Maximum component/cluster size"}
          infoDescription={
            "Based on the specified minimum link correlation above, set the maximum component/cluster size required for a node to be included in the graph. Decreasing this value can significantly improve performance."
          }
        />
        <PopUpSwitchBlock
          text={"Include phosphosites"}
          value={containsSites}
          onChange={() => {
            setContainsSites(!containsSites);
          }}
          infoHeading={"Include phosphosites"}
          infoDescription={"Allows to include phosphosite details for the nodes, which must be incorporated into the node ID as shown below."}
        />
        <div className="popup-block"></div>
        <PopUpTextField textInfront={"Your Node ID format:"} textInside={nodeIdFormat} />
        <div className="popup-block"></div>
        <PopUpDoubleTextField textInfront={"Node ID examples:"} textInside1={nodeIdExample1} textInside2={nodeIdExample2} />
        <div className="popup-block flex-end">
          <PopupButtonRect
            text={"Upload Own Graph File"}
            onClick={handleGraphUploadClick}
            linkRef={graphFileRef}
            onChange={(event) => {
              handleNewGraphFile(event, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient, mergeSameProtein);
              event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
              setGraphPopUpActive(false);
            }}
          />
        </div>
      </PopUp>
      <PopUp
        heading={"Create Difference Graph"}
        description={
          <div>
            Generates a graph that visualizes the differences between the two selected graphs below. The edge weights of the resulting graph represent
            the difference between the corresponding edge weights of the original graphs. You have the option to substract Graph B from Graph A, or
            take the absolute value of their difference. If a link is a multilink, it's maximum weight will be chosen as the value for the
            calculation.
            <br></br>
          </div>
        }
        isOpen={differencePopUpActive}
        setIsOpen={setDifferencePopUpActive}
      >
        <PopUpSwitchBlock
          text={"Take absolute value of the difference ( | Graph A - Graph B | )"}
          value={takeAbs}
          onChange={() => {
            setTakeAbs(!takeAbs);
          }}
        />
        <div className="popup-block"></div>
        <div className="popup-block"></div>
        <div className="popup-block">
          <label className="label-no-pad">Graph A</label>
          <select className="popup-button-rect" value={selectedGraphName1} onChange={handleGraph1Change}>
            <option value="">Please Choose</option>
            {uploadedGraphFileNamesNoExample
              .filter((name) => name !== selectedGraphName2)
              .map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
          </select>
        </div>
        <div className="popup-block">
          <label className="label-no-pad">Graph B</label>
          <select className="popup-button-rect" value={selectedGraphName2} onChange={handleGraph2Change}>
            <option value="">Please Choose</option>
            {uploadedGraphFileNamesNoExample
              .filter((name) => name !== selectedGraphName1)
              .map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
          </select>
        </div>
        <div className="popup-block justify-right">
          <PopupButtonRect
            onClick={() => {
              handleCreateDifferenceGraph(selectedGraphName1, selectedGraphName2, graphData, setGraphData, takeAbs);
              setDifferencePopUpActive(false);
            }}
            text={"Create Difference Graph"}
          />
        </div>
      </PopUp>
    </>
  );
}
