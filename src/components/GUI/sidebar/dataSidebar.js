import { ReactComponent as DeleteIcon } from "../../../icons/delete.svg";
import { ReactComponent as TrashIcon } from "../../../icons/trash.svg";
import { ReactComponent as PlusIcon } from "../../../icons/plus.svg";
import { useEffect, useRef, useState } from "react";

import { TableList, ButtonPopup, SwitchBlock, SliderBlock, FieldBlock, Button, PopupTextField } from "../reusable_components/sidebarComponents.js";
import log from "../../../logger.js";
import { exampleGraphJson } from "../../assets/exampleGraphJSON.js";
import { downloadCsvFile, downloadObjectAsFile } from "../../application_service/download.js";
import { exampleGraphCsv } from "../../assets/exampleGraphCSV.js";
import { exampleMappingCsv } from "../../assets/exampleMappingCSV.js";
import { exampleGraphRaw } from "../../assets/exampleGraphRawTSV.js";
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
import { useGraphData } from "../../adapters/state/graph/graphState.js";
import { graphService } from "../../application_service/graphService.js";

export function DataSidebar({ handleCreateMapping, handleRemoveActiveMapping, handleMappingSelect, handleDeleteMapping }) {
  const { graphData } = useGraphData();

  return (
    <>
      <TopDataButtons handleCreateMapping={handleCreateMapping} />
      <ActiveGraphFiles activeGraphNames={graphData.activeGraphNames} />
      <UploadedGraphFiles uploadedGraphNames={graphData.uploadedGraphNames} />
      <ActiveMapping activeMapping={graphData.activeMapping} handleRemoveActiveMapping={handleRemoveActiveMapping} />
      <UploadedMappings
        uploadedMappingNames={graphData.uploadedMappingNames}
        handleMappingSelect={handleMappingSelect}
        handleDeleteMapping={handleDeleteMapping}
      />
    </>
  );
}

export function TopDataButtons({ handleCreateMapping }) {
  return (
    <>
      <div className="sidebar-two-buttons">
        <UploadGraph />
        <UploadMapping handleCreateMapping={handleCreateMapping} />
      </div>
    </>
  );
}

function ActiveGraphFiles({ activeGraphNames }) {
  return (
    <TableList
      heading={"Currently Active Graphs"}
      data={activeGraphNames}
      ActionIcon={DeleteIcon}
      onActionIconClick={(filename) => graphService.handleRemoveActiveGraph(filename)}
      actionIconTooltipContent={() => "Remove Graph"}
      dark={true}
    />
  );
}

function UploadedGraphFiles({ uploadedGraphNames }) {
  let uploadedGraphNamesNoExample = uploadedGraphNames?.filter((name) => name !== exampleGraphJson.name);

  return (
    <>
      <TableList
        heading={"Uploaded Graphs"}
        data={uploadedGraphNamesNoExample}
        onItemClick={(filename) => graphService.handleSelectGraph(filename)}
        itemTooltipContent={() => "Replace Active Graphs"}
        ActionIcon={PlusIcon}
        onActionIconClick={(filename) => graphService.handleAddActiveGraph(filename)}
        actionIconTooltipContent={() => "Add Graph to Currently Active Graphs"}
        ActionIcon2={TrashIcon}
        onActionIcon2Click={(filename) => graphService.handleDeleteGraph(filename)}
        actionIcon2TooltipContent={() => "Delete Graph"}
      />
    </>
  );
}

function ActiveMapping({ activeMapping, handleRemoveActiveMapping }) {
  return (
    <TableList
      heading={"Currently Active Pathway Mapping"}
      data={activeMapping ? [activeMapping] : []}
      displayKey={"name"}
      ActionIcon={DeleteIcon}
      onActionIconClick={() => handleRemoveActiveMapping()}
      actionIconTooltipContent={() => "Deselect pathway mapping"}
      dark={true}
    />
  );
}

function UploadedMappings({ uploadedMappingNames, handleMappingSelect, handleDeleteMapping }) {
  return (
    <TableList
      heading={"Uploaded Pathway Mappings"}
      data={uploadedMappingNames}
      onItemClick={(mappingName) => handleMappingSelect(mappingName)}
      itemTooltipContent={() => "Replace Active Pathway Mapping"}
      ActionIcon={TrashIcon}
      onActionIconClick={(mappingName) => handleDeleteMapping(mappingName)}
      actionIconTooltipContent={() => "Delete Annotation Mapping"}
    />
  );
}

function UploadGraph() {
  const graphFileRef = useRef(null);

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

  useEffect(() => {
    const id = "UniprotID";
    const name = "Name";
    const sites = "SiteA, SiteB, ... SiteT";
    const sites2 = "SiteU, SiteV, ... SiteW";

    const idFormat = `${id}1_ ${name}1${containsSites ? "_" + sites : ""}; ${id}2_${name}2${containsSites ? "_" + sites2 : ""}; ...`;

    const idExample1 = `P08590_MYL3${containsSites ? "_T165" : ""}`;
    const idExample2 = `Q8WZ42_TTN${containsSites ? "_T719, S721" : ""}; Q8WZ42-12_TTN${containsSites ? "_T765, S767" : ""}`;

    setNodeIdFormat(idFormat);
    setNodeIdExample1(idExample1);
    setNodeIdExample2(idExample2);
  }, [containsSites]);

  return (
    <ButtonPopup
      buttonText={"Upload Graph"}
      tooltip={"Upload Graph as CSV, TSV or JSON File"}
      tooltipId={"upload-graph-tooltip"}
      heading={"Uploading your Graph"}
      description={uploadGraphDescription}
    >
      <div className="popup-block">
        <Button
          variant="popup"
          text={"JSON Example Graph"}
          onClick={() => downloadObjectAsFile(exampleGraphJson.content, exampleGraphJson.name)}
          className="no-pad-top"
        />
        <Button
          variant="popup"
          text={"Matrix Example Graph"}
          onClick={() => downloadCsvFile(exampleGraphCsv.content, exampleGraphCsv.name)}
          className="no-pad-top"
        />
        <Button
          variant="popup"
          text={"Raw Data Example Graph"}
          onClick={() => downloadCsvFile(exampleGraphRaw.content, exampleGraphRaw.name)}
          className="no-pad-top"
        />
      </div>
      <SwitchBlock
        variant="popup"
        value={spearmanCoefficient}
        setValue={() => setSpearmanCoefficient(!spearmanCoefficient)}
        text={"Calculate spearman correlation"}
        infoHeading={"Use spearman correlation"}
        infoDescription={spearmanCoefficientDescription}
      />
      <SwitchBlock
        variant="popup"
        value={takeAbs}
        setValue={() => setTakeAbs(!takeAbs)}
        text={"Include negative correlations by taking the absolute value"}
        infoHeading={"Include negative correlations"}
        infoDescription={takeAbsDescription}
      />
      <SwitchBlock
        variant="popup"
        value={mergeSameProtein}
        setValue={() => setMergeSameProtein(!mergeSameProtein)}
        text={"Merge nodes of same protein"}
        infoHeading={"Merge Proteins"}
        infoDescription={mergeProteinsDescription}
      />
      <div className="popup-block"></div>
      <SliderBlock
        variant="popup"
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
      <FieldBlock
        variant="popup"
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
      <FieldBlock
        variant="popup"
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
      <SwitchBlock
        variant="popup"
        value={containsSites}
        setValue={() => setContainsSites(!containsSites)}
        text={"Include phosphosites"}
        infoHeading={"Include phosphosites"}
        infoDescription={containsSitesDescription}
      />
      <PopupTextField inline={true} textInfront={"Your Node ID format:"} textInside={nodeIdFormat} />
      <PopupTextField inline={true} textInfront={"Node ID examples:"} textInside={nodeIdExample1} />
      <PopupTextField inline={true} textInside={nodeIdExample2} />
      <div className="popup-block flex-end">
        <Button
          variant="popup"
          text={"Upload Own Graph File"}
          onClick={() => graphFileRef.current.click()}
          linkRef={graphFileRef}
          onChange={(event) => {
            graphService.handleCreateGraph(
              event,
              takeAbs,
              minLinkCorr,
              minCompSizeForNode,
              maxCompSizeForNode,
              spearmanCoefficient,
              mergeSameProtein
            );
            event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
          }}
        />
      </div>
    </ButtonPopup>
  );
}

function UploadMapping({ handleCreateMapping }) {
  const mappingRef = useRef(null);

  const mappingFormat = "Uniprot-ID, Pathway Name, Reactome-ID";
  const mappingExample = "O60306,mRNA Splicing,R-HSA-72172";

  return (
    <ButtonPopup
      buttonText={"Upload Pathway Mappings"}
      tooltip={"Upload Pathway Annotation Mappings as a TSV or CSV File"}
      tooltipId={"upload-mapping-tooltip"}
      heading={"Uploading Your Pathway Mapping"}
      description={uploadPathwayMappingDescription}
    >
      <PopupTextField inline={true} textInfront={"Pathway Mapping format:"} textInside={mappingFormat} />
      <PopupTextField inline={true} textInfront={"Pathway Mapping example:"} textInside={mappingExample} />
      <div className="popup-block">
        <Button
          variant="popup"
          text={"Download Example Pathway Mapping"}
          onClick={() => downloadCsvFile(exampleMappingCsv.content, exampleMappingCsv.name)}
        />
        <Button
          variant="popup"
          text={"Upload Own Pathway Mapping"}
          onClick={() => mappingRef.current.click()}
          linkRef={mappingRef}
          onChange={(event) => {
            handleCreateMapping(event);
            event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
          }}
        />
      </div>
    </ButtonPopup>
  );
}
