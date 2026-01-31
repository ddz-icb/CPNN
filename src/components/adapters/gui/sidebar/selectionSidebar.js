import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import dataSvg from "../../../../assets/icons/data.svg?raw";
import magnetSvg from "../../../../assets/icons/magnet.svg?raw";
import filterSvg from "../../../../assets/icons/filter.svg?raw";
import piechartSvg from "../../../../assets/icons/piechart.svg?raw";
import paletteSvg from "../../../../assets/icons/colorPalette.svg?raw";
import downloadSvg from "../../../../assets/icons/download.svg?raw";
import searchSvg from "../../../../assets/icons/search.svg?raw";

export function SelectionSidebar({ handleNavItemClick }) {
  return (
    <>
      <NavItem text={"Data"} icon={<SvgIcon svg={dataSvg} />} onClick={() => handleNavItemClick("Data")} />
      <NavItem text={"Search"} icon={<SvgIcon svg={searchSvg} />} onClick={() => handleNavItemClick("Search")} />
      <NavItem text={"Filter"} icon={<SvgIcon svg={filterSvg} />} onClick={() => handleNavItemClick("Filter")} />
      <NavItem text={"Groups"} icon={<SvgIcon svg={piechartSvg} />} onClick={() => handleNavItemClick("Groups")} />
      <NavItem text={"Physics"} icon={<SvgIcon svg={magnetSvg} />} onClick={() => handleNavItemClick("Physics")}></NavItem>
      <NavItem text={"Appearance"} icon={<SvgIcon svg={paletteSvg} />} onClick={() => handleNavItemClick("Appearance")}></NavItem>
      <NavItem text={"Export"} icon={<SvgIcon svg={downloadSvg} />} onClick={() => handleNavItemClick("Export")} />
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
