import { useState } from "react";
import { ReactComponent as EyeIcon } from "../../../icons/eye.svg";
import { ReactComponent as XIcon } from "../../../icons/x.svg";
import { Button } from "../reusable_components/headerbarComponents.js";
import { HeaderbarMapping } from "./headerbarMapping.js";

export function HeaderBar() {
  const [isMappingActive, setIsMappingActive] = useState(false);

  return (
    <div className="headerbar">
      <Button
        className="button"
        innerClass="icon-button"
        onClick={() => setIsMappingActive(!isMappingActive)}
        icon={isMappingActive ? <XIcon /> : <EyeIcon />}
        tooltip={isMappingActive ? "Close" : "View Mapping"}
        tooltipId={isMappingActive ? "close-view-mapping-tooltip" : "view-mapping-tooltip"}
      />
      {isMappingActive && <HeaderbarMapping />}
    </div>
  );
}
