import { Button, FieldBlock, SliderBlock, SwitchBlock, LassoFilterBlock } from "../reusable_components/sidebarComponents.jsx";
import { getLinkThresholdBounds } from "../../../domain/service/graph_settings/linkThresholdRange.js";
import { NodeIdFilterBlock } from "./nodeIdFilterBlock.jsx";
import { LinkAttribFilterBlock, NodeAttribFilterBlock } from "./attribFilterBlock.jsx";
import { useFilter } from "../../state/filterState.js";
import { useGraphMetrics } from "../../state/graphMetricsState.js";
import { useGraphFlags } from "../../state/graphFlagsState.js";
import {
  filterInit,
  minLinkThresholdInit,
  minKCoreSizeInit,
  minCompSizeInit,
  maxCompSizeInit,
  componentDensityInit,
  maxComponentDensityInit,
} from "../../../adapters/state/filterState.js";
import {
  lassoDescription,
  minLinkThresholdDescription,
  maxLinkThresholdDescription,
  maxCompSizeDescription,
  maxComponentDensityDescription,
  componentDensityDescription,
  mergeByNameDescription,
  minCompSizeDescription,
  minKCoreSizeDescription,
} from "./descriptions/filterDescriptions.jsx";

export function FilterSidebar() {
  const { filter, setFilter, setAllFilter } = useFilter();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { graphMetrics } = useGraphMetrics();

  const lassoSelectionCount = Array.isArray(filter.lassoSelection) ? filter.lassoSelection.length : 0;
  const linkThresholdBounds = getLinkThresholdBounds(graphMetrics.linkWeightAbsMax, minLinkThresholdInit);
  const defaultMaxLinkThreshold = linkThresholdBounds.defaultMax;

  const handleClearLassoSelection = () => {
    setFilter("lassoSelection", []);
  };

  const handleToggleLasso = () => {
    setFilter("lasso", !filter.lasso);
  };

  const handleResetFilters = () => {
    setAllFilter({
      ...filterInit,
      maxLinkThreshold: defaultMaxLinkThreshold,
      maxLinkThresholdText: defaultMaxLinkThreshold,
    });
    setGraphFlags("mergeByName", false);
  };

  return (
    <>
      <div className="block-section">
        <Button text={"Reset Filters"} onClick={handleResetFilters} />
      </div>
      <div className="table-list-heading">Link Filters</div>
      <SliderBlock
        value={filter.minLinkThreshold}
        valueText={filter.minLinkThresholdText}
        setValue={(value) => setFilter("minLinkThreshold", value)}
        setValueText={(value) => setFilter("minLinkThresholdText", value)}
        fallbackValue={minLinkThresholdInit}
        min={linkThresholdBounds.min}
        max={linkThresholdBounds.max}
        step={linkThresholdBounds.step}
        text={"Min Link Weight Threshold"}
        infoHeading={"Filtering Links by Threshold"}
        infoDescription={minLinkThresholdDescription}
      />
      <SliderBlock
        value={filter.maxLinkThreshold}
        valueText={filter.maxLinkThresholdText}
        setValue={(value) => setFilter("maxLinkThreshold", value)}
        setValueText={(value) => setFilter("maxLinkThresholdText", value)}
        fallbackValue={defaultMaxLinkThreshold}
        min={linkThresholdBounds.min}
        max={linkThresholdBounds.max}
        step={linkThresholdBounds.step}
        text={"Max Link Weight Threshold"}
        infoHeading={"Filtering Links by Maximum Threshold"}
        infoDescription={maxLinkThresholdDescription}
      />
      <LinkAttribFilterBlock />
      <div className="table-list-heading">Node Filters</div>
      <SwitchBlock
        value={graphFlags.mergeByName}
        setValue={() => setGraphFlags("mergeByName", !graphFlags.mergeByName)}
        text={"Merge Nodes by Name"}
        infoHeading={"Merge nodes with the same Name"}
        infoDescription={mergeByNameDescription}
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
        valueText={filter.maxComponentDensityText}
        setValue={(value) => setFilter("maxComponentDensity", value)}
        setValueText={(value) => setFilter("maxComponentDensityText", value)}
        fallbackValue={maxComponentDensityInit}
        min={0}
        step={1}
        text={"Max Component Density"}
        infoHeading={"Filter by Component Density"}
        infoDescription={maxComponentDensityDescription}
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
