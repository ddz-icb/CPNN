import { useState } from "react";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import xSvg from "../../../../assets/icons/x.svg?raw";
import { HeaderButton } from "../reusable_components/headerbarComponents.js";
import { HeaderbarColorMapping } from "./headerbarMapping.js";

export function HeaderBar() {
  const [isMappingActive, setIsMappingActive] = useState(false);

  return (
    <div className="headerbar-overlay">
      <HeaderButton
        onClick={() => setIsMappingActive(!isMappingActive)}
        icon={isMappingActive ? <SvgIcon svg={xSvg} /> : <SvgIcon svg={eyeSvg} />}
        tooltip={isMappingActive ? "" : "View Mapping"}
        tooltipId={isMappingActive ? "close-colormapping-tooltip" : "open-colormapping-tooltip"}
      />
      {isMappingActive && <HeaderbarColorMapping />}
    </div>
  );
}
