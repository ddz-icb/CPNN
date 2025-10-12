import { ReactComponent as DataIcon } from "../../../../assets/icons/data.svg";
import { ReactComponent as MagnetIcon } from "../../../../assets/icons/magnet.svg";
import { ReactComponent as FilterIcon } from "../../../../assets/icons/filter.svg";
import { ReactComponent as PaletteIcon } from "../../../../assets/icons/colorPalette.svg";
import { ReactComponent as DownloadIcon } from "../../../../assets/icons/download.svg";

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
