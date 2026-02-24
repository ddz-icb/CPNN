import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import deleteSvg from "../../../../assets/icons/delete.svg?raw";
import trashSvg from "../../../../assets/icons/trash.svg?raw";
import plusSvg from "../../../../assets/icons/plus.svg?raw";
import { useRef } from "react";

const DeleteIcon = (props) => <SvgIcon svg={deleteSvg} {...props} />;
const TrashIcon = (props) => <SvgIcon svg={trashSvg} {...props} />;
const PlusIcon = (props) => <SvgIcon svg={plusSvg} {...props} />;

import { TableList, ButtonPopup, Button } from "../reusable_components/sidebarComponents.js";
import { exampleGraphJson } from "../../../../assets/exampleGraphJSON.js";
import { downloadTsvFile } from "../../../domain/service/download/download.js";
import { exampleNodeMappingTsv } from "../../../../assets/exampleMappingTSV.js";
import { uploadNodeMappingDescription } from "./descriptions/dataDescriptions.js";
import { graphService } from "../../../application/services/graphService.js";
import { useMappingState } from "../../state/mappingState.js";
import { mappingService } from "../../../application/services/mappingService.js";
import { useGraphState } from "../../state/graphState.js";
import { UploadGraph } from "./uploadGraph.js";

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

function UploadMapping() {
  const mappingRef = useRef(null);

  return (
    <ButtonPopup
      buttonText={"Upload Node Mappings"}
      tooltip={"Upload Node Annotation Mappings as a TSV (preferred) or CSV File"}
      tooltipId={"upload-mapping-tooltip"}
      heading={"Uploading Your Node Annotation Mapping"}
      description={uploadNodeMappingDescription}
    >
      <div className="block-section">
        <Button
          variant="popup"
          text={"Download Example Node Mapping"}
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
