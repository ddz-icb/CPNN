import { ReactComponent as DeleteIcon } from "../../../icons/delete.svg";
import { ReactComponent as TrashIcon } from "../../../icons/trash.svg";
import { ReactComponent as PlusIcon } from "../../../icons/plus.svg";
import { useEffect, useRef, useState } from "react";

import {
  PopUpTextFieldInline,
  PopUpSliderBlock,
  PopUpFieldBlock,
  PopUpSwitchBlock,
  SidebarButtonRect,
  PopupButtonRect,
  PopUp,
  TableList,
} from "../reusable_components/sidebarComponents.js";
import log from "../../../logger.js";
import { useGraphData } from "../../../states.js";
import { exampleGraphJson } from "../../../demodata/exampleGraphJSON.js";
import { downloadCsvFile, downloadObjectAsFile } from "../../application_service/download.js";
import { exampleGraphCsv } from "../../../demodata/exampleGraphCSV.js";
import { exampleMappingCsv } from "../../../demodata/exampleMappingCSV.js";
import { exampleGraphRaw } from "../../../demodata/exampleGraphRawTSV.js";
import {
  containsSitesDescription,
  maxCompSizeDescriptionUpload,
  minCompSizeDescriptionUpload,
  minCorrForEdgeDescription as minLinkCorrDescription,
  spearmanCoefficientDescription,
  takeAbsDescription,
  uploadGraphDescription,
  uploadPathwayMappingDescription,
} from "./descriptions/dataDescriptions.js";
import { mergeProteinsDescription } from "./descriptions/filterDescriptions.js";

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
  const { graphData } = useGraphData();

  return (
    <>
      <TopDataButtons
        handleNewGraphFile={handleNewGraphFile}
        handleNewAnnotationMapping={handleNewAnnotationMapping}
        handleCreateDifferenceGraph={handleCreateDifferenceGraph}
      />
      <ActiveGraphFiles activeGraphFileNames={graphData.activeGraphFileNames} handleRemoveActiveGraphFile={handleRemoveActiveGraphFile} />
      <UploadedGraphFiles
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

function UploadedGraphFiles({ uploadedGraphFileNames, handleSelectGraph, handleDeleteGraphFile, handleAddFile }) {
  let uploadedGraphFileNamesNoExample = uploadedGraphFileNames?.filter((name) => name !== exampleGraphJson.name);

  return (
    <>
      <TableList
        heading={"Uploaded Graphs"}
        data={uploadedGraphFileNamesNoExample}
        onItemClick={(filename) => handleSelectGraph(filename)}
        itemTooltipContent={() => "Replace Active Graphs"}
        ActionIcon={PlusIcon}
        onActionIconClick={(filename) => handleAddFile(filename)}
        actionIconTooltipContent={() => "Add Graph to Currently Active Graphs"}
        ActionIcon2={TrashIcon}
        onActionIcon2Click={(filename) => handleDeleteGraphFile(filename)}
        actionIcon2TooltipContent={() => "Delete Graph"}
      />
    </>
  );
}

function ActiveGraphFiles({ activeGraphFileNames, handleRemoveActiveGraphFile }) {
  return (
    <TableList
      heading={"Currently Active Graphs"}
      data={activeGraphFileNames}
      ActionIcon={DeleteIcon}
      onActionIconClick={(filename) => handleRemoveActiveGraphFile(filename)}
      actionIconTooltipContent={() => "Remove Graph"}
      dark={true}
    />
  );
}

function UploadedMappings({ uploadedAnnotationMappingNames, handleAnnotationMappingSelect, handleDeleteAnnotationMapping }) {
  return (
    <TableList
      heading={"Uploaded Pathway Mappings"}
      data={uploadedAnnotationMappingNames}
      onItemClick={(mappingName) => handleAnnotationMappingSelect(mappingName)}
      itemTooltipContent={() => "Replace Active Pathway Mapping"}
      ActionIcon={TrashIcon}
      onActionIconClick={(mappingName) => handleDeleteAnnotationMapping(mappingName)}
      actionIconTooltipContent={() => "Delete Annotation Mapping"}
    />
  );
}

function ActiveAnnotationMapping({ activeAnnotationMapping, handleRemoveActiveAnnotationMapping }) {
  return (
    <TableList
      heading={"Currently Active Pathway Mapping"}
      data={activeAnnotationMapping ? [activeAnnotationMapping] : []}
      displayKey={"name"}
      ActionIcon={DeleteIcon}
      onActionIconClick={() => handleRemoveActiveAnnotationMapping()}
      actionIconTooltipContent={() => "Deselect pathway mapping"}
      dark={true}
    />
  );
}

export function TopDataButtons({ handleNewGraphFile, handleNewAnnotationMapping }) {
  const annotationMappingRef = useRef(null);
  const graphFileRef = useRef(null);

  const [graphPopUpActive, setGraphPopUpActive] = useState(false);
  const [mappingPopUpActive, setMappingPopUpActive] = useState(false);

  const [takeAbs, setTakeAbs] = useState(false);
  const [mergeSameProtein, setMergeSameProtein] = useState(false);
  const [spearmanCoefficient, setSpearmanCoefficient] = useState(false);

  const [minLinkCorr, setMinLinkCorr] = useState(0);
  const [minLinkCorrText, setMinLinkCorrText] = useState(0);

  const [minCompSizeForNode, setMinCompSize] = useState(2);
  const [minCompSizeText, setMinCompSizeText] = useState(2);

  const [maxCompSizeForNode, setMaxCompSize] = useState("");
  const [maxCompSizeText, setMaxCompSizeText] = useState("");

  const [containsSites, setContainsSites] = useState(false);

  const [nodeIdFormat, setNodeIdFormat] = useState("");
  const [nodeIdExample1, setNodeIdExample1] = useState("");
  const [nodeIdExample2, setNodeIdExample2] = useState("");

  const annotationMappingFormat = "Uniprot-ID, Pathway Name, Reactome-ID";
  const annotationMappingExample = "O60306,mRNA Splicing,R-HSA-72172";

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
      <PopUp
        heading={"Uploading Your Pathway Mapping"}
        description={uploadPathwayMappingDescription}
        isOpen={mappingPopUpActive}
        setIsOpen={setMappingPopUpActive}
      >
        <PopUpTextFieldInline textInfront={"Pathway Mapping format:"} textInside={annotationMappingFormat} />
        <PopUpTextFieldInline textInfront={"Pathway Mapping example:"} textInside={annotationMappingExample} />
        <div className="popup-block">
          <PopupButtonRect
            text={"Download Example Pathway Mapping"}
            onClick={() => downloadCsvFile(exampleMappingCsv.content, exampleMappingCsv.name)}
          />
          <PopupButtonRect
            text={"Upload Own Pathway Mapping"}
            onClick={() => annotationMappingRef.current.click()}
            linkRef={annotationMappingRef}
            onChange={(event) => {
              handleNewAnnotationMapping(event);
              event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
              setMappingPopUpActive(false);
            }}
          />
        </div>
      </PopUp>
      <PopUp heading={"Upload Graph"} description={uploadGraphDescription} isOpen={graphPopUpActive} setIsOpen={setGraphPopUpActive}>
        <div className="popup-block">
          <PopupButtonRect
            text={"JSON Example Graph"}
            onClick={() => downloadObjectAsFile(exampleGraphJson.content, exampleGraphJson.name)}
            className="no-pad-top"
          />
          <PopupButtonRect
            text={"Matrix Example Graph"}
            onClick={() => downloadCsvFile(exampleGraphCsv.content, exampleGraphCsv.name)}
            className="no-pad-top"
          />
          <PopupButtonRect
            text={"Raw Data Example Graph"}
            onClick={() => downloadCsvFile(exampleGraphRaw.content, exampleGraphRaw.name)}
            className="no-pad-top"
          />
        </div>
        <PopUpSwitchBlock
          value={spearmanCoefficient}
          setValue={() => setSpearmanCoefficient(!spearmanCoefficient)}
          text={"Calculate spearman correlation"}
          infoHeading={"Use spearman correlation"}
          infoDescription={spearmanCoefficientDescription}
        />
        <PopUpSwitchBlock
          value={takeAbs}
          setValue={() => setTakeAbs(!takeAbs)}
          text={"Include negative correlations by taking the absolute value"}
          infoHeading={"Include negative correlations"}
          infoDescription={takeAbsDescription}
        />
        <PopUpSwitchBlock
          value={mergeSameProtein}
          setValue={() => setMergeSameProtein(!mergeSameProtein)}
          text={"Merge nodes of same protein"}
          infoHeading={"Merge Proteins"}
          infoDescription={mergeProteinsDescription}
        />
        <div className="popup-block"></div>
        <PopUpSliderBlock
          value={minLinkCorr}
          valueText={minLinkCorrText}
          setValue={(value) => setMinLinkCorr(value)}
          setValueText={(value) => setMinLinkCorrText(value)}
          fallbackValue={0}
          min={0}
          max={1}
          step={0.05}
          text={"Minimum link correlation"}
          infoHeading={"Minimum link correlation"}
          infoDescription={minLinkCorrDescription}
        />
        <PopUpFieldBlock
          valueText={minCompSizeText}
          setValue={(value) => setMinCompSize(value)}
          setValueText={(value) => setMinCompSizeText(value)}
          fallbackValue={1}
          min={1}
          step={1}
          text={"Minimum component size"}
          infoHeading={"Minimum component/cluster size"}
          infoDescription={minCompSizeDescriptionUpload}
        />
        <PopUpFieldBlock
          valueText={maxCompSizeText}
          setValue={(value) => setMaxCompSize(value)}
          setValueText={(value) => setMaxCompSizeText(value)}
          fallbackValue={""}
          min={1}
          step={1}
          text={"Maximum component size"}
          infoHeading={"Maximum component/cluster size"}
          infoDescription={maxCompSizeDescriptionUpload}
        />
        <PopUpSwitchBlock
          value={containsSites}
          setValue={() => setContainsSites(!containsSites)}
          text={"Include phosphosites"}
          infoHeading={"Include phosphosites"}
          infoDescription={containsSitesDescription}
        />
        <PopUpTextFieldInline textInfront={"Your Node ID format:"} textInside={nodeIdFormat} />
        <PopUpTextFieldInline textInfront={"Node ID examples:"} textInside={nodeIdExample1} />
        <PopUpTextFieldInline textInside={nodeIdExample2} />
        <div className="popup-block flex-end">
          <PopupButtonRect
            text={"Upload Own Graph File"}
            onClick={() => graphFileRef.current.click()}
            linkRef={graphFileRef}
            onChange={(event) => {
              handleNewGraphFile(event, takeAbs, minLinkCorr, minCompSizeForNode, maxCompSizeForNode, spearmanCoefficient, mergeSameProtein);
              event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
              setGraphPopUpActive(false);
            }}
          />
        </div>
      </PopUp>
    </>
  );
}
