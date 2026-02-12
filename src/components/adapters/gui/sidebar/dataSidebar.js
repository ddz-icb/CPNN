import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import deleteSvg from "../../../../assets/icons/delete.svg?raw";
import trashSvg from "../../../../assets/icons/trash.svg?raw";
import plusSvg from "../../../../assets/icons/plus.svg?raw";
import { useRef, useState } from "react";

const DeleteIcon = (props) => <SvgIcon svg={deleteSvg} {...props} />;
const TrashIcon = (props) => <SvgIcon svg={trashSvg} {...props} />;
const PlusIcon = (props) => <SvgIcon svg={plusSvg} {...props} />;

import { TableList, ButtonPopup, SwitchBlock, SliderBlock, FieldBlock, Button } from "../reusable_components/sidebarComponents.js";
import { exampleGraphJson } from "../../../../assets/exampleGraphJSON.js";
import { downloadObjectAsFile, downloadTsvFile } from "../../../domain/service/download/download.js";
import { exampleGraphTsv } from "../../../../assets/exampleGraphCSV.js";
import { exampleNodeMappingTsv } from "../../../../assets/exampleMappingCSV.js";
import { exampleGraphRaw } from "../../../../assets/exampleGraphRawTSV.js";
import {
  maxCompSizeDescriptionUpload,
  minCompSizeDescriptionUpload,
  minLinkCorrDescription,
  spearmanCoefficientDescription,
  takeAbsDescription,
  uploadGraphDescription,
  uploadNodeMappingDescription,
} from "./descriptions/dataDescriptions.js";
import { mergeByNameDescription } from "./descriptions/filterDescriptions.js";
import { graphService } from "../../../application/services/graphService.js";
import { useMappingState } from "../../state/mappingState.js";
import { mappingService } from "../../../application/services/mappingService.js";
import { useGraphState } from "../../state/graphState.js";

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
      heading={"Currently Active Mapping"}
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
      heading={"Uploaded Mappings"}
      data={uploadedMappingNames}
      onItemClick={(mappingName) => mappingService.handleSelectMapping(mappingName)}
      itemTooltipContent={() => "Replace Active Mapping"}
      ActionIcon={TrashIcon}
      onActionIconClick={(mappingName) => mappingService.handleDeleteMapping(mappingName)}
      actionIconTooltipContent={() => "Delete Annotation Mapping"}
    />
  );
}

function UploadGraph() {
  const graphFileRef = useRef(null);

  const [takeAbs, setTakeAbs] = useState(false);
  const [mergeByName, setMergeProtein] = useState(false);
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
        <Button variant="popup" text={"JSON Example Graph"} onClick={() => downloadObjectAsFile(exampleGraphJson.data, exampleGraphJson.name)} />
        <Button variant="popup" text={"Matrix Example Graph"} onClick={() => downloadTsvFile(exampleGraphTsv.data, exampleGraphTsv.name)} />
        <Button variant="popup" text={"Raw Data Example Graph"} onClick={() => downloadTsvFile(exampleGraphRaw.data, exampleGraphRaw.name)} />
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
        value={mergeByName}
        setValue={() => setMergeProtein(!mergeByName)}
        text={"Merge nodes sharing the same name"}
        infoHeading={"Merge Nodes by Name"}
        infoDescription={mergeByNameDescription}
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
              mergeByName: mergeByName,
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
      buttonText={"Upload Node Mappings"}
      tooltip={"Upload Node Annotation Mappings as a TSV or CSV File"}
      tooltipId={"upload-mapping-tooltip"}
      heading={"Uploading Your Node Annotation Mapping"}
      description={uploadNodeMappingDescription}
    >
      <div className="block-section">
        <Button
          variant="popup"
          text={"Download Example Mapping"}
          onClick={() => downloadTsvFile(exampleNodeMappingTsv.data, exampleNodeMappingTsv.name)}
        />
        <Button
          variant="popup"
          text={"Upload Own Node Mapping"}
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
