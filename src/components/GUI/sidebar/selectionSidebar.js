import { ReactComponent as SunIcon } from "../../../icons/sun.svg";
import { ReactComponent as DataIcon } from "../../../icons/data.svg";
import { ReactComponent as MoonIcon } from "../../../icons/moon.svg";
import { ReactComponent as MagnetIcon } from "../../../icons/magnet.svg";
import { ReactComponent as FilterIcon } from "../../../icons/filter.svg";
import { ReactComponent as PaletteIcon } from "../../../icons/colorPalette.svg";
import { ReactComponent as DownloadIcon } from "../../../icons/download.svg";
import { lightTheme, useTheme } from "../../adapters/state/themeState.js";
import { themeService } from "../../application_service/services/themeService.js";

export function SelectionSidebar({ handleNavItemClick }) {
  const { theme } = useTheme();

  return (
    <>
      <NavItem text={"Data"} icon={<DataIcon />} onClick={() => handleNavItemClick("Data")} />
      <NavItem text={"Filter"} icon={<FilterIcon />} onClick={() => handleNavItemClick("Filter")} />
      <NavItem text={"Physics"} icon={<MagnetIcon />} onClick={() => handleNavItemClick("Physics")}></NavItem>
      <NavItem text={"Appearance"} icon={<PaletteIcon />} onClick={() => handleNavItemClick("Appearance")}></NavItem>
      <NavItem text={"Export"} icon={<DownloadIcon />} onClick={() => handleNavItemClick("Export")} />
      <NavItem
        text={"Change Theme"}
        icon={theme.name === lightTheme.name ? <MoonIcon /> : <SunIcon />}
        onClick={() => themeService.handleChangeTheme()}
      />
    </>
  );
}

function NavItem({ text, href, icon, onClick, children }) {
  return (
    <li className="nav-item">
      <a className="nav-link" {...(href && { href: href })} onClick={onClick}>
        <span className="navbar-item-logo">{icon}</span>
        <span className="link-text">{text}</span>
      </a>
      {children}
    </li>
  );
}
