import { useTooltipSettings } from "../../adapters/state/tooltipState.js";
import { ClickTooltip } from "./clickTooltip.js";
import { HoverTooltip } from "./hoverTooltip.js";

export function Tooltips() {
  const { tooltipSettings } = useTooltipSettings();
  return (
    <>
      {tooltipSettings.isClickTooltipActive && <ClickTooltip />}
      {!tooltipSettings.isClickTooltipActive && tooltipSettings.isHoverTooltipActive && <HoverTooltip />}
    </>
  );
}
