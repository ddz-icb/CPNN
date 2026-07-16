import { useRef, useState, useEffect } from "react";

import { exampleGraphJson } from "../../../../assets/exampleGraphJSON.js";
import { exampleGraphRaw } from "../../../../assets/exampleGraphRawTSV.js";
import { exampleGraphTsv } from "../../../../assets/exampleGraphMatrixTSV.js";
import { graphService } from "../../../application/services/graphService.js";
import { downloadObjectAsFile, downloadTsvFile } from "../../../domain/service/download/download.js";
import { Button, ButtonPopup, Popup, FieldBlock, SelectFieldBlock, SliderBlock, SwitchBlock } from "../reusable_components/sidebarComponents.jsx";
import { isTypingTarget, isPopupOpen } from "../hooks/keyboardUtils.js";
import {
  maxCompSizeDescriptionUpload,
  minCompSizeDescriptionUpload,
  maxLinkCorrDescription,
  minLinkCorrDescription,
  spearmanCoefficientDescription,
  ignoreNegativesDescription,
  uploadGraphDescription,
  uploadGraphDataFormat,
} from "./descriptions/dataDescriptions.jsx";
import { mergeByNameDescription } from "./descriptions/filterDescriptions.jsx";

const dataFormatOptions = [
  { value: "json", label: "JSON" },
  { value: "matrix", label: "Correlation Matrix (TSV/CSV)" },
  { value: "tabular", label: "Tabular Data (TSV/CSV)" },
];

function GraphFormatExampleButtons() {
  return (
    <div className="block-section pad-top-05">
      <Button variant="popup" text={"Download JSON Example"} onClick={() => downloadObjectAsFile(exampleGraphJson.data, exampleGraphJson.name)} />
      <Button variant="popup" text={"Download Matrix Example"} onClick={() => downloadTsvFile(exampleGraphTsv.data, exampleGraphTsv.name)} />
      <Button variant="popup" text={"Download Tabular Data Example"} onClick={() => downloadTsvFile(exampleGraphRaw.data, exampleGraphRaw.name)} />
    </div>
  );
}

function GraphPrefilterPopup({
  onCloseUploadPopup,
  dataFormat,
  ignoreNegatives,
  setIgnoreNegatives,
  mergeByName,
  setMergeProtein,
  minEdgeCorr,
  minEdgeCorrText,
  setMinEdgeCorr,
  setMinEdgeCorrText,
  maxEdgeCorr,
  maxEdgeCorrText,
  setMaxEdgeCorr,
  setMaxEdgeCorrText,
  minCompSizeText,
  setMinCompSize,
  setMinCompSizeText,
  maxCompSizeText,
  setMaxCompSize,
  setMaxCompSizeText,
}) {
  const usesListedWeights = dataFormat === "json";
  const maxLinkThresholdLabel = usesListedWeights ? "Maximum absolute link weight" : "Maximum absolute link correlation";

  return (
    <ButtonPopup buttonText={"Prefilter Graph"} heading={"Prefilter Graph"} onClose={onCloseUploadPopup}>
      {({ closePopup }) => (
        <>
          <SwitchBlock
            variant="popup"
            value={ignoreNegatives}
            setValue={() => setIgnoreNegatives(!ignoreNegatives)}
            text={usesListedWeights ? "Ignore negative weights" : "Ignore negative correlations"}
            infoHeading={usesListedWeights ? "Ignore negative weights" : "Ignore negative correlations"}
            infoDescription={ignoreNegativesDescription}
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
          {usesListedWeights ? (
            <FieldBlock
              variant="popup"
              valueText={minEdgeCorrText}
              setValue={(value) => setMinEdgeCorr(value)}
              setValueText={(value) => setMinEdgeCorrText(value)}
              fallbackValue={0}
              min={0}
              step={0.05}
              text={"Minimum absolute link weight"}
              infoHeading={"Minimum absolute link weight"}
              infoDescription={minLinkCorrDescription}
            />
          ) : (
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
          )}
          <FieldBlock
            variant="popup"
            valueText={maxEdgeCorrText}
            setValue={(value) => setMaxEdgeCorr(value)}
            setValueText={(value) => setMaxEdgeCorrText(value)}
            fallbackValue={""}
            min={0}
            max={usesListedWeights ? undefined : 1}
            step={0.05}
            text={maxLinkThresholdLabel}
            infoHeading={maxLinkThresholdLabel}
            infoDescription={maxLinkCorrDescription}
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
          <div className="block-section pad-top-1">
            <Button variant="popup" text={"Back"} onClick={closePopup} />
          </div>
        </>
      )}
    </ButtonPopup>
  );
}

function buildCreateGraphSettings({ dataFormat, ignoreNegatives, minEdgeCorr, maxEdgeCorr, minCompSize, maxCompSize, takeSpearman, mergeByName }) {
  return {
    dataFormat,
    ignoreNegatives,
    minEdgeCorr,
    maxEdgeCorr,
    minCompSize,
    maxCompSize,
    takeSpearman,
    mergeByName,
  };
}

export function UploadGraph() {
  const [isOpen, setIsOpen] = useState(false);
  const graphFileRef = useRef(null);

  const [dataFormat, setDataFormat] = useState("json");
  const [ignoreNegatives, setIgnoreNegatives] = useState(false);
  const [mergeByName, setMergeProtein] = useState(false);
  const [takeSpearman, setTakeSpearman] = useState(false);

  const [minEdgeCorr, setMinEdgeCorr] = useState(0);
  const [minEdgeCorrText, setMinEdgeCorrText] = useState(0);
  const [maxEdgeCorr, setMaxEdgeCorr] = useState("");
  const [maxEdgeCorrText, setMaxEdgeCorrText] = useState("");

  const [minCompSize, setMinCompSize] = useState(2);
  const [minCompSizeText, setMinCompSizeText] = useState(2);

  const [maxCompSize, setMaxCompSize] = useState("");
  const [maxCompSizeText, setMaxCompSizeText] = useState("");

  const usesTabularData = dataFormat === "tabular";
  const closePopup = () => setIsOpen(false);

  useEffect(() => {
    if (dataFormat === "json") return;
    if (Number(minEdgeCorr) > 1) {
      setMinEdgeCorr(1);
      setMinEdgeCorrText(1);
    }
    if (maxEdgeCorr !== "" && Number(maxEdgeCorr) > 1) {
      setMaxEdgeCorr(1);
      setMaxEdgeCorrText(1);
    }
  }, [dataFormat, minEdgeCorr, maxEdgeCorr]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() !== "u") return;
      if (isTypingTarget(document.activeElement) || isPopupOpen()) return;
      e.preventDefault();
      setIsOpen(true);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        tooltip={"Upload Graph as TSV, CSV or JSON File"}
        tooltipId={"upload-graph-tooltip"}
        text={"Upload Graph"}
      />
      {isOpen && (
        <Popup heading={"Uploading your Graph"} description={uploadGraphDescription} isOpen={isOpen} setIsOpen={setIsOpen}>
          <SelectFieldBlock
            text={"Data format"}
            value={dataFormat}
            setValue={setDataFormat}
            options={dataFormatOptions}
            size={"wide"}
            infoHeading={"Data Formats"}
            infoDescription={uploadGraphDataFormat}
            infoChildren={<GraphFormatExampleButtons />}
          />
          {usesTabularData && (
            <SwitchBlock
              variant="popup"
              value={takeSpearman}
              setValue={() => setTakeSpearman(!takeSpearman)}
              text={"Spearman correlation"}
              infoHeading={"Use spearman correlation"}
              infoDescription={spearmanCoefficientDescription}
            />
          )}
          <div className="block-section pad-top-1">
            <GraphPrefilterPopup
              onCloseUploadPopup={closePopup}
              dataFormat={dataFormat}
              ignoreNegatives={ignoreNegatives}
              setIgnoreNegatives={setIgnoreNegatives}
              mergeByName={mergeByName}
              setMergeProtein={setMergeProtein}
              minEdgeCorr={minEdgeCorr}
              minEdgeCorrText={minEdgeCorrText}
              setMinEdgeCorr={setMinEdgeCorr}
              setMinEdgeCorrText={setMinEdgeCorrText}
              maxEdgeCorr={maxEdgeCorr}
              maxEdgeCorrText={maxEdgeCorrText}
              setMaxEdgeCorr={setMaxEdgeCorr}
              setMaxEdgeCorrText={setMaxEdgeCorrText}
              minCompSizeText={minCompSizeText}
              setMinCompSize={setMinCompSize}
              setMinCompSizeText={setMinCompSizeText}
              maxCompSizeText={maxCompSizeText}
              setMaxCompSize={setMaxCompSize}
              setMaxCompSizeText={setMaxCompSizeText}
            />
            <Button
              variant="popup"
              text={"Upload Graph File"}
              onClick={() => graphFileRef.current.click()}
              linkRef={graphFileRef}
              fileInputProps={{ multiple: true }}
              onChange={(event) => {
                const createGraphSettings = buildCreateGraphSettings({
                  dataFormat,
                  ignoreNegatives,
                  minEdgeCorr,
                  maxEdgeCorr,
                  minCompSize,
                  maxCompSize,
                  takeSpearman,
                  mergeByName,
                });

                graphService.handleCreateGraph(event.target.files, createGraphSettings);
                event.target.value = null; // Reset to allow re-uploading the same file.
                closePopup();
              }}
            />
          </div>
        </Popup>
      )}
    </>
  );
}
