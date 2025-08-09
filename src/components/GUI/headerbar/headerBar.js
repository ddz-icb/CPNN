import { useState } from "react";

import { Mapping } from "./headerBarMapping.js";
import { HeaderBarExport } from "./headerBarExport.js";

export function HeaderBar() {
  const [activeMenu, setActiveMenu] = useState("None");

  const handleActiveMenuClick = (item) => {
    if (activeMenu === item) {
      setActiveMenu("None");
    } else {
      setActiveMenu(item);
    }
  };

  return (
    <div className="top-right-buttons">
      <Mapping activeMenu={activeMenu} handleActiveMenuClick={handleActiveMenuClick} />
      <HeaderBarExport activeMenu={activeMenu} handleActiveMenuClick={handleActiveMenuClick} />
    </div>
  );
}
