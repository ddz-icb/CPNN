import { Button, FieldBlock, SliderBlock, SwitchBlock, LassoFilterBlock } from "../reusable_components/sidebarComponents.js";
import {
  filterInit,
  linkThresholdInit,
  minKCoreSizeInit,
} from "../../../adapters/state/filterState.js";
import {
  lassoDescription,
  linkThresholdDescription,
  mergeByNameDescription,
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

  const handleToggleLasso = () => {
    setFilter("lasso", !filter.lasso);
  };

  const handleResetFilters = () => {
    setAllFilter(filterInit);
    setGraphFlags("mergeByName", false);
  };

  return (
    <>
      <div className="block-section">
        <Button text={"Reset Filters"} onClick={handleResetFilters} />
      </div>
      <SwitchBlock
        value={graphFlags.mergeByName}
        setValue={() => setGraphFlags("mergeByName", !graphFlags.mergeByName)}
        text={"Merge by Name"}
        infoHeading={"Merge nodes with the same Name"}
        infoDescription={mergeByNameDescription}
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
    </>
  );
}
