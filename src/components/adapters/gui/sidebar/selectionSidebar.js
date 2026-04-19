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

export function SelectionSidebar({ handleNavItemClick }) {
  return (
    <>
      <NavItem text={"Data"} shortcut={SIDEBAR_SHORTCUT_BY_KEY["Data"]} icon={<SvgIcon svg={dataSvg} />} onClick={() => handleNavItemClick("Data")} />
      <NavItem text={"Search"} shortcut={SIDEBAR_SHORTCUT_BY_KEY["Search"]} icon={<SvgIcon svg={searchSvg} />} onClick={() => handleNavItemClick("Search")} />
      <NavItem text={"Filter"} shortcut={SIDEBAR_SHORTCUT_BY_KEY["Filter"]} icon={<SvgIcon svg={filterSvg} />} onClick={() => handleNavItemClick("Filter")} />
      <NavItem
        text={"Additional Data"}
        shortcut={SIDEBAR_SHORTCUT_BY_KEY["Additional Data"]}
        icon={<SvgIcon svg={fileWaveformSvg} />}
        onClick={() => handleNavItemClick("Additional Data")}
      />
      <NavItem text={"Communities"} shortcut={SIDEBAR_SHORTCUT_BY_KEY["Communities"]} icon={<SvgIcon svg={piechartSvg} />} onClick={() => handleNavItemClick("Communities")} />
      <NavItem text={"Physics"} shortcut={SIDEBAR_SHORTCUT_BY_KEY["Physics"]} icon={<SvgIcon svg={magnetSvg} />} onClick={() => handleNavItemClick("Physics")} />
      <NavItem text={"Appearance"} shortcut={SIDEBAR_SHORTCUT_BY_KEY["Appearance"]} icon={<SvgIcon svg={paletteSvg} />} onClick={() => handleNavItemClick("Appearance")} />
      <NavItem text={"Export"} shortcut={SIDEBAR_SHORTCUT_BY_KEY["Export"]} icon={<SvgIcon svg={downloadSvg} />} onClick={() => handleNavItemClick("Export")} />
    </>
  );
}

function NavItem({ text, icon, onClick, shortcut, children }) {
  return (
    <li className="nav-item">
      <button type="button" className="nav-link" onClick={onClick}>
        <span className="navbar-item-logo">{icon}</span>
        <span className="link-text">{text}</span>
        {shortcut && <kbd className="nav-shortcut">{shortcut}</kbd>}
      </button>
      {children}
    </li>
  );
}
