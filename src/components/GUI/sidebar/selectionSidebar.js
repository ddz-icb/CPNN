import { ReactComponent as SunIcon } from "../../../icons/sun.svg";
import { ReactComponent as DataIcon } from "../../../icons/data.svg";
import { ReactComponent as MoonIcon } from "../../../icons/moon.svg";
import { ReactComponent as MagnetIcon } from "../../../icons/magnet.svg";
import { ReactComponent as FilterIcon } from "../../../icons/filter.svg";
import { ReactComponent as PaletteIcon } from "../../../icons/colorPalette.svg";
import { ReactComponent as DownloadIcon } from "../../../icons/download.svg";
import { darkTheme, lightTheme } from "../../adapters/state/appearanceState.js";
import { useAppearance } from "../../adapters/state/appearanceState.js";
import { themeService } from "../../application_service/themeService.js";

export function SelectionSidebar({ handleNavItemClick }) {
  const { appearance, setAppearance } = useAppearance();

  return (
    <>
      <LogoBar />
      <NavItem text={"Data"} icon={<DataIcon />} onClick={() => handleNavItemClick("Data")} />
      <NavItem text={"Filter"} icon={<FilterIcon />} onClick={() => handleNavItemClick("Filter")} />
      <NavItem text={"Physics"} icon={<MagnetIcon />} onClick={() => handleNavItemClick("Physics")}></NavItem>
      <NavItem text={"Appearance"} icon={<PaletteIcon />} onClick={() => handleNavItemClick("Appearance")}></NavItem>
      <NavItem text={"Export"} icon={<DownloadIcon />} onClick={() => handleNavItemClick("Export")} />
      <NavItem
        text={"Change Theme"}
        icon={appearance.theme.name === lightTheme.name ? <MoonIcon /> : <SunIcon />}
        onClick={() => themeService.handleChangeTheme()}
      />
    </>
  );
}

function LogoBar({ onClick }) {
  return (
    <li className="logo-container" onClick={onClick}>
      <img src="./logos/ddz_logo_en.png" className="logo" />
    </li>
  );
}

function NavItem({ text, href, icon, onClick, children }) {
  return (
    <li className="nav-item">
      <a className="nav-link" {...(href && { href: href })} onClick={onClick}>
        <span className="fa-primary">{icon}</span>
        <p className="link-text">{text}</p>
      </a>
      {children}
    </li>
  );
}
