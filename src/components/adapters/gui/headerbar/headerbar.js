import { useState, useEffect } from "react";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import xSvg from "../../../../assets/icons/x.svg?raw";
import { HeaderButton } from "../reusable_components/headerbarComponents.js";
import { HeaderbarColorMapping } from "./headerbarMapping.js";
import { isTypingTarget, isPopupOpen } from "../hooks/keyboardUtils.js";

export function HeaderBar() {
  const [isMappingActive, setIsMappingActive] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() !== "m") return;
      if (isTypingTarget(document.activeElement) || isPopupOpen()) return;
      e.preventDefault();
      setIsMappingActive((prev) => !prev);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="headerbar-overlay">
      <HeaderButton
        onClick={() => setIsMappingActive(!isMappingActive)}
        icon={isMappingActive ? <SvgIcon svg={xSvg} /> : <SvgIcon svg={eyeSvg} />}
        tooltip={isMappingActive ? "" : "View Mapping"}
        tooltipId={isMappingActive ? "close-colormapping-tooltip" : "open-colormapping-tooltip"}
        shortcut="M"
      />
      {isMappingActive && <HeaderbarColorMapping />}
    </div>
  );
}
