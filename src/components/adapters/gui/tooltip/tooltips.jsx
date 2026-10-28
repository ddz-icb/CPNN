import { useTooltipSettings } from "../../../adapters/state/tooltipState.js";
import { ClickTooltip } from "./clickTooltip.jsx";
import { NodeFocus } from "./nodeFocus.jsx";
import { ViewFocusControl } from "./viewFocusControl.jsx";
import { HoverTooltip } from "./hoverTooltip.jsx";

export function Tooltips({ onSelectInsightsPanel, onCloseInsightsPanel }) {
  const { tooltipSettings } = useTooltipSettings();
  return (
    <>
      <NodeFocus />
      <ViewFocusControl />
      {tooltipSettings.isClickTooltipActive && (
        <ClickTooltip
          onSelectInsightsPanel={onSelectInsightsPanel}
          onCloseInsightsPanel={onCloseInsightsPanel}
        />
      )}
      {!tooltipSettings.isClickTooltipActive && tooltipSettings.isHoverTooltipActive && <HoverTooltip />}
    </>
  );
}
