import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import { SIDEBAR_SHORTCUT_BY_KEY } from "../../config/sidebarConfig.js";
import dataSvg from "../../../../assets/icons/data.svg?raw";
import magnetSvg from "../../../../assets/icons/magnet.svg?raw";
import filterSvg from "../../../../assets/icons/filter.svg?raw";
import piechartSvg from "../../../../assets/icons/piechart.svg?raw";
import paletteSvg from "../../../../assets/icons/colorPalette.svg?raw";
import downloadSvg from "../../../../assets/icons/download.svg?raw";
import searchSvg from "../../../../assets/icons/search.svg?raw";
import fileWaveformSvg from "../../../../assets/icons/fileWaveform.svg?raw";

export function SelectionSidebar({ handleNavItemClick, activeNavItem }) {
  return (
    <>
      <NavItem
        text={"Data"}
        shortcut={SIDEBAR_SHORTCUT_BY_KEY["Data"]}
        icon={<SvgIcon svg={dataSvg} />}
        isActive={activeNavItem === "Data"}
        onClick={() => handleNavItemClick("Data")}
      />
      <NavItem
        text={"Search"}
        shortcut={SIDEBAR_SHORTCUT_BY_KEY["Search"]}
        icon={<SvgIcon svg={searchSvg} />}
        isActive={activeNavItem === "Search"}
        onClick={() => handleNavItemClick("Search")}
      />
      <NavItem
        text={"Filter"}
        shortcut={SIDEBAR_SHORTCUT_BY_KEY["Filter"]}
        icon={<SvgIcon svg={filterSvg} />}
        isActive={activeNavItem === "Filter"}
        onClick={() => handleNavItemClick("Filter")}
      />
      <NavItem
        text={"Additional Data"}
        shortcut={SIDEBAR_SHORTCUT_BY_KEY["Additional Data"]}
        icon={<SvgIcon svg={fileWaveformSvg} />}
        isActive={activeNavItem === "Additional Data"}
        onClick={() => handleNavItemClick("Additional Data")}
      />
      <NavItem
        text={"Communities"}
        shortcut={SIDEBAR_SHORTCUT_BY_KEY["Communities"]}
        icon={<SvgIcon svg={piechartSvg} />}
        isActive={activeNavItem === "Communities"}
        onClick={() => handleNavItemClick("Communities")}
      />
      <NavItem
        text={"Physics"}
        shortcut={SIDEBAR_SHORTCUT_BY_KEY["Physics"]}
        icon={<SvgIcon svg={magnetSvg} />}
        isActive={activeNavItem === "Physics"}
        onClick={() => handleNavItemClick("Physics")}
      />
      <NavItem
        text={"Appearance"}
        shortcut={SIDEBAR_SHORTCUT_BY_KEY["Appearance"]}
        icon={<SvgIcon svg={paletteSvg} />}
        isActive={activeNavItem === "Appearance"}
        onClick={() => handleNavItemClick("Appearance")}
      />
      <NavItem
        text={"Export"}
        shortcut={SIDEBAR_SHORTCUT_BY_KEY["Export"]}
        icon={<SvgIcon svg={downloadSvg} />}
        isActive={activeNavItem === "Export"}
        onClick={() => handleNavItemClick("Export")}
      />
    </>
  );
}

function NavItem({ text, icon, onClick, shortcut, children, isActive }) {
  const className = isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <li className="nav-item">
      <button type="button" className={className} onClick={onClick} aria-current={isActive ? "page" : undefined}>
        <span className="navbar-item-logo">{icon}</span>
        <span className="link-text">{text}</span>
        {shortcut && <kbd className="nav-shortcut">{shortcut}</kbd>}
      </button>
      {children}
    </li>
  );
}
