import { useState, useEffect } from "react";
import { useTooltipSettings } from "../../../adapters/state/tooltipState.js";
import { getNodeIdName } from "../../../domain/service/parsing/nodeIdParsing.js";

export function HoverTooltip() {
  const { tooltipSettings } = useTooltipSettings();
  const [style, setStyle] = useState({});
  const [gene, setGene] = useState("");

  useEffect(() => {
    if (!tooltipSettings.hoverTooltipData) return;

    setGene(getNodeIdName(tooltipSettings.hoverTooltipData.node));
  }, [tooltipSettings.hoverTooltipData]);

  useEffect(() => {
    if (!tooltipSettings.isHoverTooltipActive || !tooltipSettings.hoverTooltipData) return;
    const { x, y } = tooltipSettings.hoverTooltipData;
    setStyle({ left: `${x + 15}px`, top: `${y}px` });
  }, [tooltipSettings.isHoverTooltipActive, tooltipSettings.hoverTooltipData]);

  return (
    <div className="tooltip" style={style}>
      <p className="margin-0">{gene}</p>
    </div>
  );
}
