import { ReactComponent as SunIcon } from "../../icons/sun.svg";
import { ReactComponent as DataIcon } from "../../icons/data.svg";
import { ReactComponent as MoonIcon } from "../../icons/moon.svg";
import { ReactComponent as MagnetIcon } from "../../icons/magnet.svg";
import { ReactComponent as FilterIcon } from "../../icons/filter.svg";
import { ReactComponent as PaletteIcon } from "../../icons/colorPalette.svg";
import { darkTheme, lightTheme } from "../Other/appearance.js";
import { useSettings } from "../../states.js";

export function MainSidebar({ handleNavItemClick }) {
  const { settings, setSettings } = useSettings();

  const changeTheme = () => {
    const newTheme = settings.appearance.theme.name === lightTheme.name ? darkTheme : lightTheme;
    setSettings("appearance.theme", newTheme);
    localStorage.setItem("theme", JSON.stringify(newTheme));
  };

  return (
    <>
      <Logo />
      <NavItem text={"Data"} icon={<DataIcon />} onClick={() => handleNavItemClick("Data")} />
      <NavItem text={"Filter"} icon={<FilterIcon />} onClick={() => handleNavItemClick("Filter")} />
      <NavItem text={"Physics"} icon={<MagnetIcon />} onClick={() => handleNavItemClick("Physics")}></NavItem>
      <NavItem text={"Appearance"} icon={<PaletteIcon />} onClick={() => handleNavItemClick("Appearance")}></NavItem>
      <NavItem text={"Change Theme"} icon={settings.appearance.theme.name === lightTheme.name ? <MoonIcon /> : <SunIcon />} onClick={changeTheme} />
    </>
  );
}

function Logo({ onClick }) {
  return (
    <li className="logo-container" onClick={onClick}>
      <div className="nav-link">
        <img src="./logos/ddz_logo_en.png" className="logo" />
      </div>
    </li>
  );
}

function NavItem({ text, href, icon, onClick, children }) {
  return (
    <li className="nav-item">
      <a className="nav-link" {...(href && { href: href })} onClick={onClick}>
        <span className="fa-primary">{icon}</span>
        <b className="link-text">{text}</b>
      </a>
      {children}
    </li>
  );
}
