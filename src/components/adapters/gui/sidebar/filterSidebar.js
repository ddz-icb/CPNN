import { Button, FieldBlock, SelectFieldBlock, SliderBlock, SwitchBlock, LassoFilterBlock } from "../reusable_components/sidebarComponents.js";
import { NodeIdFilterBlock } from "./nodeIdFilterBlock.js";
import { LinkAttribFilterBlock, NodeAttribFilterBlock } from "./attribFilterBlock.js";
import { useFilter } from "../../state/filterState.js";
import { useGraphMetrics } from "../../state/graphMetricsState.js";
import { useGraphFlags } from "../../state/graphFlagsState.js";
import {
  omniPathEnrichmentEnabledInit,
  stringDbMinConfidenceInit,
  stringDbSpeciesIdInit,
  useGraphEnrichment,
} from "../../state/graphEnrichmentState.js";
import {
  filterInit,
  linkThresholdInit,
  minKCoreSizeInit,
  minCompSizeInit,
  maxCompSizeInit,
  componentDensityInit,
} from "../../../adapters/state/filterState.js";
import { STRING_DB_SPECIES } from "../../../domain/service/enrichment/stringDbConfig.js";
import {
  lassoDescription,
  linkThresholdDescription,
  maxCompSizeDescription,
  componentDensityDescription,
  mergeByNameDescription,
  minCompSizeDescription,
  minKCoreSizeDescription,
  omniPathEnrichmentDescription,
  stringDbEnrichmentDescription,
  stringDbMinConfidenceDescription,
  stringDbSpeciesDescription,
} from "./descriptions/filterDescriptions.js";

export function FilterSidebar() {
  const { filter, setFilter, setAllFilter } = useFilter();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { graphEnrichment, setGraphEnrichment } = useGraphEnrichment();
  const { graphMetrics } = useGraphMetrics();

  const lassoSelectionCount = Array.isArray(filter.lassoSelection) ? filter.lassoSelection.length : 0;

  const handleClearLassoSelection = () => {
    setFilter("lassoSelection", []);
  };

  const handleToggleLasso = () => {
    setFilter("lasso", !filter.lasso);
  };

  const handleResetFilters = () => {
    setAllFilter(filterInit);
    setGraphFlags("mergeByName", false);
    setGraphEnrichment("stringDbEnrichmentEnabled", false);
    setGraphEnrichment("stringDbMinConfidence", stringDbMinConfidenceInit);
    setGraphEnrichment("stringDbMinConfidenceText", stringDbMinConfidenceInit);
    setGraphEnrichment("stringDbSpeciesId", stringDbSpeciesIdInit);
    setGraphEnrichment("omniPathEnrichmentEnabled", omniPathEnrichmentEnabledInit);
  };

  return (
    <>
      <div className="block-section">
        <Button text={"Reset Filters"} onClick={handleResetFilters} />
      </div>
      <div className="table-list-heading">Link Filters</div>
      <SliderBlock
        value={filter.linkThreshold}
        valueText={filter.linkThresholdText}
        setValue={(value) => setFilter("linkThreshold", value)}
        setValueText={(value) => setFilter("linkThresholdText", value)}
        fallbackValue={linkThresholdInit}
        min={Math.max(Math.floor((graphMetrics.linkWeightMin / 0.05) * 0.05) - 0.05, 0)}
        max={Math.min(Math.ceil((graphMetrics.linkWeightMax / 0.05) * 0.05) + 0.05, 1)}
        step={0.05}
        text={"Link Weight Threshold"}
        infoHeading={"Filtering Links by Threshold"}
        infoDescription={linkThresholdDescription}
      />
      <LinkAttribFilterBlock />
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
      <div className="table-list-heading">Node Filters</div>
      <SwitchBlock
        value={graphFlags.mergeByName}
        setValue={() => setGraphFlags("mergeByName", !graphFlags.mergeByName)}
        text={"Merge Nodes by Name"}
        infoHeading={"Merge nodes with the same Name"}
        infoDescription={mergeByNameDescription}
      />
      <SwitchBlock
        value={graphEnrichment.omniPathEnrichmentEnabled}
        setValue={() => setGraphEnrichment("omniPathEnrichmentEnabled", !graphEnrichment.omniPathEnrichmentEnabled)}
        text={"Add OmniPath Kinases"}
        infoHeading={"OmniPath Kinase Enrichment"}
        infoDescription={omniPathEnrichmentDescription}
      />
      <NodeAttribFilterBlock />
      <NodeIdFilterBlock />
      <FieldBlock
        valueText={filter.minKCoreSizeText}
        setValue={(value) => setFilter("minKCoreSize", value)}
        setValueText={(value) => setFilter("minKCoreSizeText", value)}
        fallbackValue={minKCoreSizeInit}
        min={1}
        step={1}
        text={"Min k-Core Size"}
        infoHeading={"Filter by minimum k-Core Decomposition"}
        infoDescription={minKCoreSizeDescription}
      />
      <LassoFilterBlock
        isActive={filter.lasso}
        selectionCount={lassoSelectionCount}
        onToggle={handleToggleLasso}
        onClearSelection={handleClearLassoSelection}
        infoHeading={"Lasso Filter"}
        infoDescription={lassoDescription}
      />
      <div className="table-list-heading">Component Filters</div>
      <FieldBlock
        valueText={filter.componentDensityText}
        setValue={(value) => setFilter("componentDensity", value)}
        setValueText={(value) => setFilter("componentDensityText", value)}
        fallbackValue={componentDensityInit}
        min={0}
        step={1}
        text={"Min Component Density"}
        infoHeading={"Filter by Component Density"}
        infoDescription={componentDensityDescription}
      />
      <FieldBlock
        valueText={filter.minCompSizeText}
        setValue={(value) => setFilter("minCompSize", value)}
        setValueText={(value) => setFilter("minCompSizeText", value)}
        fallbackValue={minCompSizeInit}
        min={1}
        step={1}
        text={"Min Component Size"}
        infoHeading={"Filter components by size"}
        infoDescription={minCompSizeDescription}
      />
      <FieldBlock
        valueText={filter.maxCompSizeText}
        setValue={(value) => setFilter("maxCompSize", value)}
        setValueText={(value) => setFilter("maxCompSizeText", value)}
        fallbackValue={maxCompSizeInit}
        min={1}
        step={1}
        text={"Max Component Size"}
        infoHeading={"Filter components by size"}
        infoDescription={maxCompSizeDescription}
      />
    </>
  );
}
