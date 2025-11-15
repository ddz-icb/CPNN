import { Button, FieldBlock, SliderBlock, SwitchBlock, LassoSelectionBlock } from "../reusable_components/sidebarComponents.js";
import {
  filterInit,
  linkThresholdInit,
  maxCompSizeInit,
  minKCoreSizeInit,
  compDensityInit,
  minCompSizeInit,
} from "../../../adapters/state/filterState.js";
import {
  compDensityDescription,
  lassoDescription,
  linkThresholdDescription,
  maxCompSizeDescription,
  mergeProteinsDescription,
  minCompSizeDescription,
  minKCoreSizeDescription,
} from "./descriptions/filterDescriptions.js";
import { useFilter } from "../../state/filterState.js";
import { useGraphMetrics } from "../../state/graphMetricsState.js";
import { useGraphFlags } from "../../state/graphFlagsState.js";
import { NodeIdFilterBlock } from "./nodeIdFilterBlock.js";
import { LinkAttribFilterBlock, NodeAttribFilterBlock } from "./attribFilterBlock.js";

export function FilterSidebar() {
  const { filter, setFilter, setAllFilter } = useFilter();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { graphMetrics } = useGraphMetrics();

  const lassoSelectionCount = Array.isArray(filter.lassoSelection) ? filter.lassoSelection.length : 0;

  const handleClearLassoSelection = () => {
    setFilter("lassoSelection", []);
  };

  const handleResetFilters = () => {
    setAllFilter(filterInit);
    setGraphFlags("mergeProteins", false);
  };

  return (
    <>
      <div className="block-section">
        <Button text={"Reset Filters"} onClick={handleResetFilters} />
      </div>
      <SwitchBlock
        value={graphFlags.mergeProteins}
        setValue={() => setGraphFlags("mergeProteins", !graphFlags.mergeProteins)}
        text={"Merge Proteins"}
        infoHeading={"Merge nodes of same protein"}
        infoDescription={mergeProteinsDescription}
      />
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
      <NodeAttribFilterBlock />
      <NodeIdFilterBlock />
      <FieldBlock
        valueText={filter.minCompSizeText}
        setValue={(value) => setFilter("minCompSize", value)}
        setValueText={(value) => setFilter("minCompSizeText", value)}
        fallbackValue={minCompSizeInit}
        min={1}
        step={1}
        text={"Min Component Size"}
        infoHeading={"Filter by Component Size"}
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
        infoHeading={"Filter by Component Size"}
        infoDescription={maxCompSizeDescription}
      />
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
      <FieldBlock
        valueText={filter.compDensityText}
        setValue={(value) => setFilter("compDensity", value)}
        setValueText={(value) => setFilter("compDensityText", value)}
        fallbackValue={compDensityInit}
        min={0}
        step={1}
        text={"Component Density"}
        infoHeading={"Filter by Component Density"}
        infoDescription={compDensityDescription}
      />
      <SwitchBlock
        value={filter.lasso}
        setValue={() => setFilter("lasso", !filter.lasso)}
        text={"Lasso Filter"}
        infoHeading={"Lasso Filter"}
        infoDescription={lassoDescription}
      />
      {filter.lasso && <LassoSelectionBlock selectionCount={lassoSelectionCount} onClearSelection={handleClearLassoSelection} />}
    </>
  );
}
