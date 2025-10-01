import { useState } from "react";
import { ReactComponent as EyeIcon } from "../../../icons/eye.svg";
import { ReactComponent as XIcon } from "../../../icons/x.svg";
import { HeaderButton } from "../reusable_components/headerbarComponents.js";
import { HeaderbarColorMapping } from "./headerbarMapping.js";

export function HeaderBar() {
  const [isMappingActive, setIsMappingActive] = useState(false);

  return (
    <div className="headerbar-overlay">
      <HeaderButton
        onClick={() => setIsMappingActive(!isMappingActive)}
        icon={isMappingActive ? <XIcon /> : <EyeIcon />}
        tooltip={isMappingActive ? "Close" : "View Mapping"}
        tooltipId={isMappingActive ? "close-colormapping-tooltip" : "open-colormapping-tooltip"}
      />
      {isMappingActive && <HeaderbarColorMapping />}
    </div>
  );
}
