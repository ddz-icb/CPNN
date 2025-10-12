import { ReactComponent as DeleteIcon } from "../../../icons/delete.svg";
import { ReactComponent as TrashIcon } from "../../../icons/trash.svg";
import { ReactComponent as PlusIcon } from "../../../icons/plus.svg";
import { useEffect, useRef, useState } from "react";

import { TableList, ButtonPopup, SwitchBlock, SliderBlock, FieldBlock, Button, PopupTextField } from "../reusable_components/sidebarComponents.js";
import { exampleGraphJson } from "../../assets/exampleGraphJSON.js";
import { downloadObjectAsFile, downloadTsvFile } from "../../domain/service/download/download.js";
import { exampleGraphTsv } from "../../assets/exampleGraphCSV.js";
import { exampleMappingTsv } from "../../assets/exampleMappingCSV.js";
import { exampleGraphRaw } from "../../assets/exampleGraphRawTSV.js";
import {
  maxCompSizeDescriptionUpload,
  minCompSizeDescriptionUpload,
  minLinkCorrDescription,
  spearmanCoefficientDescription,
  takeAbsDescription,
  uploadGraphDescription,
  uploadPathwayMappingDescription,
} from "./descriptions/dataDescriptions.js";
import { mergeProteinsDescription } from "./descriptions/filterDescriptions.js";
import { graphService } from "../../application_service/services/graphService.js";
import { useMappingState } from "../../adapters/state/mappingState.js";
import { mappingService } from "../../application_service/services/mappingService.js";
import { useGraphState } from "../../adapters/state/graphState.js";

export function DataSidebar() {
  const { graphState } = useGraphState();
  const { mappingState } = useMappingState();

  return (
    <>
      <TopDataButtons />
      <ActiveGraphFiles activeGraphNames={graphState.activeGraphNames} />
      <UploadedGraphFiles uploadedGraphNames={graphState.uploadedGraphNames} activeGraphNames={graphState.activeGraphNames} />
      <Mapping mapping={mappingState.mapping} />
      <UploadedMappings uploadedMappingNames={mappingState.uploadedMappingNames} />
    </>
  );
}

export function TopDataButtons() {
  return (
    <>
      <div className="block-section">
        <UploadGraph />
        <UploadMapping />
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

function UploadedGraphFiles({ uploadedGraphNames, activeGraphNames }) {
  let uploadedGraphNamesNoExample = uploadedGraphNames?.filter((name) => name !== exampleGraphJson.name);
  let onlyExampleGraph = activeGraphNames && activeGraphNames.length === 1 && activeGraphNames[0] === exampleGraphJson.name;
  const isActiveGraph = (graph) => activeGraphNames && activeGraphNames.includes(graph);

  return (
    <>
      <TableList
        heading={"Uploaded Graphs"}
        data={uploadedGraphNamesNoExample}
        onItemClick={(filename) => graphService.handleSelectGraph(filename)}
        itemTooltipContent={() => "Replace Active Graphs"}
        ActionIcon={PlusIcon}
        showActionIconOn={(graph) => !onlyExampleGraph && !isActiveGraph(graph)}
        onActionIconClick={(filename) => graphService.handleAddActiveGraph(filename)}
        actionIconTooltipContent={() => "Add Graph to Currently Active Graphs"}
        ActionIcon2={TrashIcon}
        onActionIcon2Click={(filename) => graphService.handleDeleteGraph(filename)}
        actionIcon2TooltipContent={() => "Delete Graph"}
      />
    </>
  );
}

function Mapping({ mapping }) {
  return (
    <TableList
      heading={"Currently Active Pathway Mapping"}
      data={mapping ? [mapping] : []}
      displayKey={"name"}
      ActionIcon={DeleteIcon}
      onActionIconClick={() => mappingService.handleRemoveMapping()}
      actionIconTooltipContent={() => "Deselect pathway mapping"}
      dark={true}
    />
  );
}

function UploadedMappings({ uploadedMappingNames }) {
  return (
    <TableList
      heading={"Uploaded Pathway Mappings"}
      data={uploadedMappingNames}
      onItemClick={(mappingName) => mappingService.handleSelectMapping(mappingName)}
      itemTooltipContent={() => "Replace Active Pathway Mapping"}
      ActionIcon={TrashIcon}
      onActionIconClick={(mappingName) => mappingService.handleDeleteMapping(mappingName)}
      actionIconTooltipContent={() => "Delete Annotation Mapping"}
    />
  );
}

function UploadGraph() {
  const graphFileRef = useRef(null);

  const [takeAbs, setTakeAbs] = useState(false);
  const [mergeProteins, setMergeProtein] = useState(false);
  const [takeSpearman, setTakeSpearman] = useState(false);

  const [minEdgeCorr, setMinEdgeCorr] = useState(0);
  const [minEdgeCorrText, setMinEdgeCorrText] = useState(0);

  const [minCompSize, setMinCompSize] = useState(2);
  const [minCompSizeText, setMinCompSizeText] = useState(2);

  const [maxCompSize, setMaxCompSize] = useState("");
  const [maxCompSizeText, setMaxCompSizeText] = useState("");

  return (
    <ButtonPopup
      buttonText={"Upload Graph"}
      tooltip={"Upload Graph as CSV, TSV or JSON File"}
      tooltipId={"upload-graph-tooltip"}
      heading={"Uploading your Graph"}
      description={uploadGraphDescription}
    >
      <div className="block-section">
        <Button
          variant="popup"
          text={"JSON Example Graph"}
          onClick={() => downloadObjectAsFile(exampleGraphJson.data, exampleGraphJson.name)}
          className="no-pad-top"
        />
        <Button
          variant="popup"
          text={"Matrix Example Graph"}
          onClick={() => downloadTsvFile(exampleGraphTsv.data, exampleGraphTsv.name)}
          className="no-pad-top"
        />
        <Button
          variant="popup"
          text={"Raw Data Example Graph"}
          onClick={() => downloadTsvFile(exampleGraphRaw.data, exampleGraphRaw.name)}
          className="no-pad-top"
        />
      </div>
      <SwitchBlock
        variant="popup"
        value={takeSpearman}
        setValue={() => setTakeSpearman(!takeSpearman)}
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
        value={mergeProteins}
        setValue={() => setMergeProtein(!mergeProteins)}
        text={"Merge nodes of same protein"}
        infoHeading={"Merge Proteins"}
        infoDescription={mergeProteinsDescription}
      />
      <div className="block-section"></div>
      <SliderBlock
        variant="popup"
        value={minEdgeCorr}
        valueText={minEdgeCorrText}
        setValue={(value) => setMinEdgeCorr(value)}
        setValueText={(value) => setMinEdgeCorrText(value)}
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
      <div className="block-section flex-end">
        <Button
          variant="popup"
          text={"Upload Own Graph File"}
          onClick={() => graphFileRef.current.click()}
          linkRef={graphFileRef}
          onChange={(event) => {
            const createGraphSettings = {
              takeAbs: takeAbs,
              minEdgeCorr: minEdgeCorr,
              minCompSize: minCompSize,
              maxCompSize: maxCompSize,
              takeSpearman: takeSpearman,
              mergeProteins: mergeProteins,
            };
            graphService.handleCreateGraph(event, createGraphSettings);
            event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
          }}
        />
      </div>
    </ButtonPopup>
  );
}

function UploadMapping() {
  const mappingRef = useRef(null);

  return (
    <ButtonPopup
      buttonText={"Upload Pathway Mappings"}
      tooltip={"Upload Pathway Annotation Mappings as a TSV or CSV File"}
      tooltipId={"upload-mapping-tooltip"}
      heading={"Uploading Your Pathway Mapping"}
      description={uploadPathwayMappingDescription}
    >
      <div className="block-section">
        <Button
          variant="popup"
          text={"Download Example Pathway Mapping"}
          onClick={() => downloadTsvFile(exampleMappingTsv.data, exampleMappingTsv.name)}
        />
        <Button
          variant="popup"
          text={"Upload Own Pathway Mapping"}
          onClick={() => mappingRef.current.click()}
          linkRef={mappingRef}
          onChange={(event) => {
            mappingService.handleCreateMapping(event);
            event.target.value = null; // resetting the value so uploading the same item tice in a row also gets registered
          }}
        />
      </div>
    </ButtonPopup>
  );
}
