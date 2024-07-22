import { ReactComponent as SunIcon } from "../../icons/sun.svg";
import { ReactComponent as DataIcon } from "../../icons/data.svg";
import { ReactComponent as MoonIcon } from "../../icons/moon.svg";
import { ReactComponent as MagnetIcon } from "../../icons/magnet.svg";
import { ReactComponent as FilterIcon } from "../../icons/filter.svg";
import { ReactComponent as LogoIcon } from "../../icons/Logo.svg";

export function MainSidebar({ theme, changeTheme, handleNavItemClick }) {
  return (
    <>
      <Logo />
      <NavItem
        text={"Data"}
        icon={<DataIcon />}
        onClick={() => handleNavItemClick("Data")}
      />
      <NavItem
        text={"Filter"}
        icon={<FilterIcon />}
        onClick={() => handleNavItemClick("Filter")}
      />
      <NavItem
        text={"Physics"}
        icon={<MagnetIcon />}
        onClick={() => handleNavItemClick("Physics")}
      ></NavItem>
      <NavItem
        text={"Change Theme"}
        icon={theme === "dark" ? <SunIcon /> : <MoonIcon />}
        onClick={changeTheme}
      />
    </>
  );
}

function Logo({ onClick }) {
  return (
    <li className="logo-container" onClick={onClick}>
      <div className="nav-link">
        <img src="ddz_logo_en.png" className="link-text logo" />
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
