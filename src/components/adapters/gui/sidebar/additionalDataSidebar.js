import { Button, FieldBlock, SelectFieldBlock, SliderBlock, SwitchBlock, TextFieldBlock } from "../reusable_components/sidebarComponents.js";
import {
  omniPathMinCurationEffortInit,
  omniPathEnrichmentEnabledInit,
  omniPathNodeAnnotationEnrichmentEnabledInit,
  omniPathNodeAnnotationModeInit,
  omniPathPhosphataseEnrichmentEnabledInit,
  stringDbEvidenceEnrichmentEnabledInit,
  stringDbGroupEnrichmentEnabledInit,
  stringDbGroupEnrichmentMaxFdrInit,
  stringDbMinConfidenceInit,
  stringDbMinEvidenceScoreInit,
  stringDbNodeAttributeTermFilterInit,
  stringDbNodeAttributeTypeInit,
  stringDbNodeAttributeEnrichmentEnabledInit,
  stringDbSpeciesIdInit,
  useGraphEnrichment,
} from "../../state/graphEnrichmentState.js";
import {
  OMNI_PATH_MIN_CURATION_EFFORT_MAX,
  OMNI_PATH_MIN_CURATION_EFFORT_MIN,
  OMNI_PATH_NODE_ANNOTATION_MODE_OPTIONS,
} from "../../../domain/service/enrichment/omniPathConfig.js";
import {
  MAX_EVIDENCE_SCORE,
  MAX_GROUP_ENRICHMENT_MAX_FDR,
  MIN_EVIDENCE_SCORE,
  MIN_GROUP_ENRICHMENT_MAX_FDR,
  STRING_DB_NODE_ATTRIBUTE_TYPE_OPTIONS,
  STRING_DB_SPECIES,
} from "../../../domain/service/enrichment/stringDbConfig.js";
import {
  omniPathCurationEffortDescription,
  omniPathEnrichmentDescription,
  omniPathNodeAnnotationEnrichmentDescription,
  omniPathNodeAnnotationModeDescription,
  omniPathPhosphataseEnrichmentDescription,
  stringDbEvidenceDescription,
  stringDbEnrichmentDescription,
  stringDbGroupEnrichmentDescription,
  stringDbGroupEnrichmentFdrDescription,
  stringDbMinConfidenceDescription,
  stringDbMinEvidenceDescription,
  stringDbNodeAttributeDescription,
  stringDbSpeciesDescription,
} from "./descriptions/filterDescriptions.js";

export function AdditionalDataSidebar() {
  const { graphEnrichment, setGraphEnrichment } = useGraphEnrichment();

  const handleResetAdditionalData = () => {
    setGraphEnrichment("stringDbEnrichmentEnabled", false);
    setGraphEnrichment("stringDbEvidenceEnrichmentEnabled", stringDbEvidenceEnrichmentEnabledInit);
    setGraphEnrichment("stringDbNodeAttributeEnrichmentEnabled", stringDbNodeAttributeEnrichmentEnabledInit);
    setGraphEnrichment("stringDbGroupEnrichmentEnabled", stringDbGroupEnrichmentEnabledInit);
    setGraphEnrichment("stringDbMinConfidence", stringDbMinConfidenceInit);
    setGraphEnrichment("stringDbMinConfidenceText", stringDbMinConfidenceInit);
    setGraphEnrichment("stringDbMinEvidenceScore", stringDbMinEvidenceScoreInit);
    setGraphEnrichment("stringDbMinEvidenceScoreText", stringDbMinEvidenceScoreInit);
    setGraphEnrichment("stringDbNodeAttributeType", stringDbNodeAttributeTypeInit);
    setGraphEnrichment("stringDbNodeAttributeTermFilter", stringDbNodeAttributeTermFilterInit);
    setGraphEnrichment("stringDbNodeAttributeTermFilterText", stringDbNodeAttributeTermFilterInit);
    setGraphEnrichment("stringDbGroupEnrichmentMaxFdr", stringDbGroupEnrichmentMaxFdrInit);
    setGraphEnrichment("stringDbGroupEnrichmentMaxFdrText", stringDbGroupEnrichmentMaxFdrInit);
    setGraphEnrichment("stringDbSpeciesId", stringDbSpeciesIdInit);
    setGraphEnrichment("omniPathEnrichmentEnabled", omniPathEnrichmentEnabledInit);
    setGraphEnrichment("omniPathPhosphataseEnrichmentEnabled", omniPathPhosphataseEnrichmentEnabledInit);
    setGraphEnrichment("omniPathNodeAnnotationEnrichmentEnabled", omniPathNodeAnnotationEnrichmentEnabledInit);
    setGraphEnrichment("omniPathNodeAnnotationMode", omniPathNodeAnnotationModeInit);
    setGraphEnrichment("omniPathMinCurationEffort", omniPathMinCurationEffortInit);
    setGraphEnrichment("omniPathMinCurationEffortText", omniPathMinCurationEffortInit);
  };
  const stringDbEnabled =
    graphEnrichment.stringDbEnrichmentEnabled ||
    graphEnrichment.stringDbNodeAttributeEnrichmentEnabled ||
    graphEnrichment.stringDbGroupEnrichmentEnabled;
  const omniPathLinkEnabled = graphEnrichment.omniPathEnrichmentEnabled || graphEnrichment.omniPathPhosphataseEnrichmentEnabled;
  const handleApplyStringDbNodeAttributeTermFilter = () => {
    setGraphEnrichment("stringDbNodeAttributeTermFilter", graphEnrichment.stringDbNodeAttributeTermFilterText);
  };

  return (
    <>
      <div className="block-section">
        <Button text={"Reset Additional Data"} onClick={handleResetAdditionalData} />
      </div>
      <div className="table-list-heading">STRING-DB</div>
      <SwitchBlock
        value={graphEnrichment.stringDbEnrichmentEnabled}
        setValue={() => setGraphEnrichment("stringDbEnrichmentEnabled", !graphEnrichment.stringDbEnrichmentEnabled)}
        text={"Add STRING-DB Links"}
        infoHeading={"STRING-DB Enrichment"}
        infoDescription={stringDbEnrichmentDescription}
      />
      <SwitchBlock
        value={graphEnrichment.stringDbNodeAttributeEnrichmentEnabled}
        setValue={() => setGraphEnrichment("stringDbNodeAttributeEnrichmentEnabled", !graphEnrichment.stringDbNodeAttributeEnrichmentEnabled)}
        text={"Add STRING Node Attributes"}
        infoHeading={"STRING functional annotations"}
        infoDescription={stringDbNodeAttributeDescription}
      />
      <SwitchBlock
        value={graphEnrichment.stringDbGroupEnrichmentEnabled}
        setValue={() => setGraphEnrichment("stringDbGroupEnrichmentEnabled", !graphEnrichment.stringDbGroupEnrichmentEnabled)}
        text={"Add STRING Community Labels"}
        infoHeading={"STRING community enrichment"}
        infoDescription={stringDbGroupEnrichmentDescription}
      />
      {stringDbEnabled && (
        <SelectFieldBlock
          value={graphEnrichment.stringDbSpeciesId}
          setValue={(value) => setGraphEnrichment("stringDbSpeciesId", value)}
          options={STRING_DB_SPECIES.map((s) => ({ value: s.id, label: s.label }))}
          size={"wide"}
          text={"STRING Species"}
          infoHeading={"STRING-DB Species"}
          infoDescription={stringDbSpeciesDescription}
        />
      )}
      {graphEnrichment.stringDbEnrichmentEnabled && (
        <>
          <SliderBlock
            value={graphEnrichment.stringDbMinConfidence}
            valueText={graphEnrichment.stringDbMinConfidenceText}
            setValue={(value) => setGraphEnrichment("stringDbMinConfidence", value)}
            setValueText={(value) => setGraphEnrichment("stringDbMinConfidenceText", value)}
            fallbackValue={stringDbMinConfidenceInit}
            min={0}
            max={1}
            step={0.05}
            text={"STRING Min Confidence"}
            infoHeading={"STRING-DB minimum confidence"}
            infoDescription={stringDbMinConfidenceDescription}
          />
          <SwitchBlock
            value={graphEnrichment.stringDbEvidenceEnrichmentEnabled}
            setValue={() => setGraphEnrichment("stringDbEvidenceEnrichmentEnabled", !graphEnrichment.stringDbEvidenceEnrichmentEnabled)}
            text={"Add STRING Evidence Labels"}
            infoHeading={"STRING evidence channels"}
            infoDescription={stringDbEvidenceDescription}
          />
          {graphEnrichment.stringDbEvidenceEnrichmentEnabled && (
            <FieldBlock
              valueText={graphEnrichment.stringDbMinEvidenceScoreText}
              setValue={(value) => setGraphEnrichment("stringDbMinEvidenceScore", value)}
              setValueText={(value) => setGraphEnrichment("stringDbMinEvidenceScoreText", value)}
              fallbackValue={stringDbMinEvidenceScoreInit}
              min={MIN_EVIDENCE_SCORE}
              max={MAX_EVIDENCE_SCORE}
              step={0.05}
              text={"STRING Min Evidence"}
              infoHeading={"STRING minimum evidence score"}
              infoDescription={stringDbMinEvidenceDescription}
            />
          )}
        </>
      )}
      {graphEnrichment.stringDbNodeAttributeEnrichmentEnabled && (
        <SelectFieldBlock
          value={graphEnrichment.stringDbNodeAttributeType}
          setValue={(value) => setGraphEnrichment("stringDbNodeAttributeType", value)}
          options={STRING_DB_NODE_ATTRIBUTE_TYPE_OPTIONS}
          size={"wide"}
          text={"STRING Attribute Type"}
          infoHeading={"STRING node attribute type"}
          infoDescription={stringDbNodeAttributeDescription}
        />
      )}
      {graphEnrichment.stringDbNodeAttributeEnrichmentEnabled && (
        <>
          <TextFieldBlock
            value={graphEnrichment.stringDbNodeAttributeTermFilterText}
            setValue={(value) => setGraphEnrichment("stringDbNodeAttributeTermFilterText", value)}
            placeholder={"diabetes, insulin"}
            size={"wide"}
            text={"STRING Term Filter"}
            infoHeading={"STRING node attribute term filter"}
            infoDescription={stringDbNodeAttributeDescription}
          />
          <div className="block-section">
            <Button text={"Apply Term Filter"} onClick={handleApplyStringDbNodeAttributeTermFilter} />
          </div>
        </>
      )}
      {graphEnrichment.stringDbGroupEnrichmentEnabled && (
        <FieldBlock
          valueText={graphEnrichment.stringDbGroupEnrichmentMaxFdrText}
          setValue={(value) => setGraphEnrichment("stringDbGroupEnrichmentMaxFdr", value)}
          setValueText={(value) => setGraphEnrichment("stringDbGroupEnrichmentMaxFdrText", value)}
          fallbackValue={stringDbGroupEnrichmentMaxFdrInit}
          min={MIN_GROUP_ENRICHMENT_MAX_FDR}
          max={MAX_GROUP_ENRICHMENT_MAX_FDR}
          step={0.01}
          text={"STRING Community Max FDR"}
          infoHeading={"STRING community enrichment FDR"}
          infoDescription={stringDbGroupEnrichmentFdrDescription}
        />
      )}
      <div className="table-list-heading">OmniPath</div>
      <SwitchBlock
        value={graphEnrichment.omniPathEnrichmentEnabled}
        setValue={() => setGraphEnrichment("omniPathEnrichmentEnabled", !graphEnrichment.omniPathEnrichmentEnabled)}
        text={"Add OmniPath Kinase Links"}
        infoHeading={"OmniPath Kinase Enrichment"}
        infoDescription={omniPathEnrichmentDescription}
      />
      <SwitchBlock
        value={graphEnrichment.omniPathPhosphataseEnrichmentEnabled}
        setValue={() => setGraphEnrichment("omniPathPhosphataseEnrichmentEnabled", !graphEnrichment.omniPathPhosphataseEnrichmentEnabled)}
        text={"Add OmniPath Phosphatase Links"}
        infoHeading={"OmniPath Phosphatase Enrichment"}
        infoDescription={omniPathPhosphataseEnrichmentDescription}
      />
      <SwitchBlock
        value={graphEnrichment.omniPathNodeAnnotationEnrichmentEnabled}
        setValue={() =>
          setGraphEnrichment("omniPathNodeAnnotationEnrichmentEnabled", !graphEnrichment.omniPathNodeAnnotationEnrichmentEnabled)
        }
        text={"Add OmniPath Node Attributes"}
        infoHeading={"OmniPath Node Annotation Enrichment"}
        infoDescription={omniPathNodeAnnotationEnrichmentDescription}
      />
      {graphEnrichment.omniPathNodeAnnotationEnrichmentEnabled && (
        <SelectFieldBlock
          value={graphEnrichment.omniPathNodeAnnotationMode}
          setValue={(value) => setGraphEnrichment("omniPathNodeAnnotationMode", value)}
          options={OMNI_PATH_NODE_ANNOTATION_MODE_OPTIONS}
          size={"wide"}
          text={"OmniPath Node Attributes"}
          infoHeading={"OmniPath node annotation type"}
          infoDescription={omniPathNodeAnnotationModeDescription}
        />
      )}
      {omniPathLinkEnabled && (
        <FieldBlock
          valueText={graphEnrichment.omniPathMinCurationEffortText}
          setValue={(value) => setGraphEnrichment("omniPathMinCurationEffort", value)}
          setValueText={(value) => setGraphEnrichment("omniPathMinCurationEffortText", value)}
          fallbackValue={omniPathMinCurationEffortInit}
          min={OMNI_PATH_MIN_CURATION_EFFORT_MIN}
          max={OMNI_PATH_MIN_CURATION_EFFORT_MAX}
          step={1}
          text={"OmniPath Min Curation"}
          infoHeading={"OmniPath minimum curation effort"}
          infoDescription={omniPathCurationEffortDescription}
        />
      )}
    </>
  );
}
