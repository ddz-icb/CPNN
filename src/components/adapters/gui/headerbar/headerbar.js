import { useState, useEffect, useRef } from "react";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import xSvg from "../../../../assets/icons/x.svg?raw";
import { HeaderButton } from "../reusable_components/headerbarComponents.js";
import { HeaderbarColorMapping } from "./headerbarMapping.js";
import { isTypingTarget, isPopupOpen } from "../hooks/keyboardUtils.js";

export function HeaderBar() {
  const [isMappingActive, setIsMappingActive] = useState(false);
  const overlayRef = useRef(null);
  const mappingPanelId = "headerbar-colormapping-panel";

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key?.toLowerCase();
      if (key === "m") {
        if (isTypingTarget(document.activeElement) || isPopupOpen()) return;
        e.preventDefault();
        setIsMappingActive((prev) => !prev);
        return;
      }

      if (e.key === "Escape" && isMappingActive) {
        setIsMappingActive(false);
      }
    };

    const handlePointerDown = (e) => {
      if (!isMappingActive) return;
      if (overlayRef.current?.contains(e.target)) return;
      setIsMappingActive(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMappingActive]);

  return (
    <div className="headerbar-overlay" ref={overlayRef}>
      <HeaderButton
        onClick={() => setIsMappingActive(!isMappingActive)}
        icon={isMappingActive ? <SvgIcon svg={xSvg} /> : <SvgIcon svg={eyeSvg} />}
        tooltip={isMappingActive ? "Hide Mapping" : "View Mapping"}
        tooltipId={isMappingActive ? "close-colormapping-tooltip" : "open-colormapping-tooltip"}
        shortcut="M"
        aria-controls={mappingPanelId}
        aria-expanded={isMappingActive}
      />
      {isMappingActive && (
        <div id={mappingPanelId} role="region" aria-label="Color mapping">
          <HeaderbarColorMapping />
        </div>
      )}
    </div>
  );
}
