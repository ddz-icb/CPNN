import { ReactComponent as DataIcon } from "../../../../icons/data.svg";
import { ReactComponent as MagnetIcon } from "../../../../icons/magnet.svg";
import { ReactComponent as FilterIcon } from "../../../../icons/filter.svg";
import { ReactComponent as PaletteIcon } from "../../../../icons/colorPalette.svg";
import { ReactComponent as DownloadIcon } from "../../../../icons/download.svg";

export function SelectionSidebar({ handleNavItemClick }) {
  return (
    <>
      <NavItem text={"Data"} icon={<DataIcon />} onClick={() => handleNavItemClick("Data")} />
      <NavItem text={"Filter"} icon={<FilterIcon />} onClick={() => handleNavItemClick("Filter")} />
      <NavItem text={"Physics"} icon={<MagnetIcon />} onClick={() => handleNavItemClick("Physics")}></NavItem>
      <NavItem text={"Appearance"} icon={<PaletteIcon />} onClick={() => handleNavItemClick("Appearance")}></NavItem>
      <NavItem text={"Export"} icon={<DownloadIcon />} onClick={() => handleNavItemClick("Export")} />
    </>
  );
}

function NavItem({ text, icon, onClick, children }) {
  return (
    <li className="nav-item">
      <a className="nav-link" onClick={onClick}>
        <span className="navbar-item-logo">{icon}</span>
        <span className="link-text">{text}</span>
      </a>
      {children}
    </li>
  );
}
