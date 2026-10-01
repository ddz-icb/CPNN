import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import { SIDEBAR_SECTIONS } from "../../config/sidebarConfig.js";
import dataSvg from "../../../../assets/icons/data.svg?raw";
import magnetSvg from "../../../../assets/icons/magnet.svg?raw";
import filterSvg from "../../../../assets/icons/filter.svg?raw";
import piechartSvg from "../../../../assets/icons/piechart.svg?raw";
import paletteSvg from "../../../../assets/icons/colorPalette.svg?raw";
import downloadSvg from "../../../../assets/icons/download.svg?raw";
import searchSvg from "../../../../assets/icons/search.svg?raw";
import fileWaveformSvg from "../../../../assets/icons/fileWaveform.svg?raw";
import playSvg from "../../../../assets/icons/play.svg?raw";

const sectionIcons = {
  Data: dataSvg,
  "Additional Data": fileWaveformSvg,
  Search: searchSvg,
  Filter: filterSvg,
  Communities: piechartSvg,
  Physics: magnetSvg,
  Appearance: paletteSvg,
  Videography: playSvg,
  Export: downloadSvg,
};

export function SelectionSidebar({ handleNavItemClick, activeNavItem }) {
  return SIDEBAR_SECTIONS.map(({ key, shortcut }) => (
    <NavItem
      key={key}
      text={key}
      shortcut={shortcut.toUpperCase()}
      icon={<SvgIcon svg={sectionIcons[key]} />}
      isActive={activeNavItem === key}
      onClick={() => handleNavItemClick(key)}
    />
  ));
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
