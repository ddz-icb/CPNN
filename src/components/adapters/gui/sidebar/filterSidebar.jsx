import { AdvancedFilters, Button, FieldBlock, SelectFieldBlock, SliderBlock, SwitchBlock, LassoFilterBlock } from "../reusable_components/sidebarComponents.jsx";
import { getLinkThresholdBounds } from "../../../domain/service/graph_settings/linkThresholdRange.js";
import { NodeIdFilterBlock } from "./nodeIdFilterBlock.jsx";
import { LinkAttribFilterBlock, NodeAttribFilterBlock } from "./attribFilterBlock.jsx";
import { useFilter } from "../../state/filterState.js";
import { useGraphMetrics } from "../../state/graphMetricsState.js";
import { useGraphFlags } from "../../state/graphFlagsState.js";
import {
  filterInit,
  minLinkThresholdInit,
  linkSignInit,
  topLinkPercentInit,
  minKCoreSizeInit,
  minCompSizeInit,
  maxCompSizeInit,
  componentDensityInit,
} from "../../../adapters/state/filterState.js";
import {
  lassoDescription,
  minLinkThresholdDescription,
  maxLinkThresholdDescription,
  linkSignDescription,
  topLinkPercentDescription,
  maxCompSizeDescription,
  componentDensityDescription,
  mergeByNameDescription,
  minCompSizeDescription,
  minKCoreSizeDescription,
} from "./descriptions/filterDescriptions.jsx";

const linkSignOptions = [
  { value: "both", label: "Both" },
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
];

export function FilterSidebar() {
  const { filter, setFilter, setAllFilter } = useFilter();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { graphMetrics } = useGraphMetrics();

  const lassoSelectionCount = Array.isArray(filter.lassoSelection) ? filter.lassoSelection.length : 0;
  const hasLinkWeights = Number.isFinite(graphMetrics.linkWeightAbsMax);
  const linkThresholdBounds = getLinkThresholdBounds(graphMetrics.linkWeightAbsMin, graphMetrics.linkWeightAbsMax, minLinkThresholdInit);
  const defaultMaxLinkThreshold = linkThresholdBounds.max;
  const thresholdSliderMax = Math.max(
    linkThresholdBounds.max,
    Number(filter.minLinkThreshold) || 0,
    Number(filter.maxLinkThreshold) || 0,
  );
  const hasAdvancedFilters =
    (filter.maxLinkThreshold !== "" && Number(filter.maxLinkThreshold) < defaultMaxLinkThreshold) ||
    filter.linkSign !== linkSignInit ||
    Number(filter.topLinkPercent) < topLinkPercentInit ||
    filter.maxCompSize !== "";

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
      {hasLinkWeights && (
        <>
          <SliderBlock
            value={filter.minLinkThreshold}
            valueText={filter.minLinkThresholdText}
            setValue={(value) => setFilter("minLinkThreshold", value)}
            setValueText={(value) => setFilter("minLinkThresholdText", value)}
            fallbackValue={minLinkThresholdInit}
            min={linkThresholdBounds.min}
            max={thresholdSliderMax}
            inputMax={Infinity}
            step={linkThresholdBounds.step}
            text={"Min Link Weight Threshold"}
            infoHeading={"Filtering Links by Threshold"}
            infoDescription={minLinkThresholdDescription}
          />
        </>
      )}
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
      <AdvancedFilters active={hasAdvancedFilters}>
        {hasLinkWeights && (
          <>
            <SelectFieldBlock
              value={filter.linkSign}
              setValue={(value) => setFilter("linkSign", value)}
              options={linkSignOptions}
              text="Link Sign"
              infoHeading="Filter by link sign"
              infoDescription={linkSignDescription}
            />
            <SliderBlock
              value={filter.topLinkPercent}
              valueText={filter.topLinkPercentText}
              setValue={(value) => setFilter("topLinkPercent", value)}
              setValueText={(value) => setFilter("topLinkPercentText", value)}
              fallbackValue={topLinkPercentInit}
              min={1}
              max={100}
              step={1}
              text="Top Weighted Links (%)"
              infoHeading="Filter by strongest links"
              infoDescription={topLinkPercentDescription}
            />
            <SliderBlock
              value={filter.maxLinkThreshold}
              valueText={filter.maxLinkThresholdText}
              setValue={(value) => setFilter("maxLinkThreshold", value)}
              setValueText={(value) => setFilter("maxLinkThresholdText", value)}
              fallbackValue={defaultMaxLinkThreshold}
              min={linkThresholdBounds.min}
              max={thresholdSliderMax}
              inputMax={Infinity}
              step={linkThresholdBounds.step}
              text={"Max Link Weight Threshold"}
              infoHeading={"Filtering Links by Maximum Threshold"}
              infoDescription={maxLinkThresholdDescription}
            />
          </>
        )}
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
      </AdvancedFilters>
    </>
  );
}
