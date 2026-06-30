import { useTooltipSettings } from "../../../adapters/state/tooltipState.js";
import { ClickTooltip } from "./clickTooltip.jsx";
import { HoverTooltip } from "./hoverTooltip.jsx";

export function Tooltips() {
  const { tooltipSettings } = useTooltipSettings();
  return (
    <>
      {tooltipSettings.isClickTooltipActive && <ClickTooltip />}
      {!tooltipSettings.isClickTooltipActive && tooltipSettings.isHoverTooltipActive && <HoverTooltip />}
    </>
  );
}
