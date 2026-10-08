import { useLayoutEffect, useRef, useState } from "react";

import { useTooltipSettings } from "../../state/tooltipState.js";
import { getNodeIdName } from "../../../domain/service/parsing/nodeIdParsing.js";

const TOOLTIP_GAP = 10;
const VIEWPORT_PADDING = 8;

export function HoverTooltip() {
  const { tooltipSettings } = useTooltipSettings();
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ visibility: "hidden" });
  const hoverData = tooltipSettings.hoverTooltipData;
  const nodeName = hoverData ? getNodeIdName(hoverData.node) : "";

  useLayoutEffect(() => {
    if (!tooltipSettings.isHoverTooltipActive || !hoverData || !tooltipRef.current) return;

    const positionTooltip = () => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      const { width, height } = tooltip.getBoundingClientRect();
      const pointerX = hoverData.x - window.scrollX;
      const pointerY = hoverData.y - window.scrollY;
      const fitsRight = pointerX + TOOLTIP_GAP + width <= window.innerWidth - VIEWPORT_PADDING;
      const fitsBelow = pointerY + TOOLTIP_GAP + height <= window.innerHeight - VIEWPORT_PADDING;
      const preferredLeft = fitsRight ? pointerX + TOOLTIP_GAP : pointerX - width - TOOLTIP_GAP;
      const preferredTop = fitsBelow ? pointerY + TOOLTIP_GAP : pointerY - height - TOOLTIP_GAP;
      const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING);
      const maxTop = Math.max(VIEWPORT_PADDING, window.innerHeight - height - VIEWPORT_PADDING);

      setPosition({
        left: `${Math.round(Math.min(Math.max(preferredLeft, VIEWPORT_PADDING), maxLeft))}px`,
        top: `${Math.round(Math.min(Math.max(preferredTop, VIEWPORT_PADDING), maxTop))}px`,
        visibility: "visible",
      });
    };

    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    return () => window.removeEventListener("resize", positionTooltip);
  }, [hoverData, tooltipSettings.isHoverTooltipActive]);

  return (
    <div className="tooltip hover-tooltip" style={position} ref={tooltipRef} role="tooltip">
      <p className="margin-0">{nodeName}</p>
    </div>
  );
}
