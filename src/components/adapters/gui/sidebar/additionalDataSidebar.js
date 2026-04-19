import { Button, SelectFieldBlock, SliderBlock, SwitchBlock } from "../reusable_components/sidebarComponents.js";
import {
  omniPathEnrichmentEnabledInit,
  stringDbMinConfidenceInit,
  stringDbSpeciesIdInit,
  useGraphEnrichment,
} from "../../state/graphEnrichmentState.js";
import { STRING_DB_SPECIES } from "../../../domain/service/enrichment/stringDbConfig.js";
import {
  omniPathEnrichmentDescription,
  stringDbEnrichmentDescription,
  stringDbMinConfidenceDescription,
  stringDbSpeciesDescription,
} from "./descriptions/filterDescriptions.js";

export function AdditionalDataSidebar() {
  const { graphEnrichment, setGraphEnrichment } = useGraphEnrichment();

  const handleResetAdditionalData = () => {
    setGraphEnrichment("stringDbEnrichmentEnabled", false);
    setGraphEnrichment("stringDbMinConfidence", stringDbMinConfidenceInit);
    setGraphEnrichment("stringDbMinConfidenceText", stringDbMinConfidenceInit);
    setGraphEnrichment("stringDbSpeciesId", stringDbSpeciesIdInit);
    setGraphEnrichment("omniPathEnrichmentEnabled", omniPathEnrichmentEnabledInit);
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
      {graphEnrichment.stringDbEnrichmentEnabled && (
        <>
          <SelectFieldBlock
            value={graphEnrichment.stringDbSpeciesId}
            setValue={(value) => setGraphEnrichment("stringDbSpeciesId", value)}
            options={STRING_DB_SPECIES.map((s) => ({ value: s.id, label: s.label }))}
            size={"wide"}
            text={"STRING Species"}
            infoHeading={"STRING-DB Species"}
            infoDescription={stringDbSpeciesDescription}
          />
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
        </>
      )}
      <div className="table-list-heading">OmniPath</div>
      <SwitchBlock
        value={graphEnrichment.omniPathEnrichmentEnabled}
        setValue={() => setGraphEnrichment("omniPathEnrichmentEnabled", !graphEnrichment.omniPathEnrichmentEnabled)}
        text={"Add OmniPath Kinase Links"}
        infoHeading={"OmniPath Kinase Enrichment"}
        infoDescription={omniPathEnrichmentDescription}
      />
    </>
  );
}
