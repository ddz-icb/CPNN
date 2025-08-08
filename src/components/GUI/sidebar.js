import "../../index.css";
import { useState } from "react";
import { ReactComponent as BackArrowIcon } from "../../icons/backArrow.svg";

import { FilterSidebar } from "./filterSidebar.js";
import { PhysicsSidebar } from "./physicsSidebar.js";
import { DataSidebar } from "./dataSidebar.js";
import { MainSidebar } from "./mainSidebar.js";
import { AppearanceSidebar } from "./appearanceSidebar.js";

export function Sidebar({
  handleSelectGraph,
  handleDeleteGraphFile,
  handleRemoveActiveGraphFile,
  handleAddFile,
  handleNewAnnotationMapping,
  handleRemoveActiveAnnotationMapping,
  handleAnnotationMappingSelect,
  handleDeleteAnnotationMapping,
  handleNewGraphFile,
  handleNewColorScheme,
  handleDeleteColorScheme,
  handleCreateDifferenceGraph,
  colorSchemes,
}) {
  const [activeNavItem, setActiveNavItem] = useState("Main");

  function handleNavItemClick(item) {
    if (activeNavItem === item) {
      setActiveNavItem("Main");
    } else {
      setActiveNavItem(item);
    }
  }

  let content = null;
  if (activeNavItem === "Main") {
    content = (
      <Navbar short={true}>
        <MainSidebar handleNavItemClick={handleNavItemClick} />
      </Navbar>
    );
  } else if (activeNavItem === "Data") {
    content = (
      <Navbar>
        <Back activeNavItem={activeNavItem} icon={<BackArrowIcon />} onClick={() => handleNavItemClick("Main")} />
        <DataSidebar
          handleRemoveActiveGraphFile={handleRemoveActiveGraphFile}
          handleSelectGraph={handleSelectGraph}
          handleDeleteGraphFile={handleDeleteGraphFile}
          handleAddFile={handleAddFile}
          handleNewAnnotationMapping={handleNewAnnotationMapping}
          handleRemoveActiveAnnotationMapping={handleRemoveActiveAnnotationMapping}
          handleAnnotationMappingSelect={handleAnnotationMappingSelect}
          handleDeleteAnnotationMapping={handleDeleteAnnotationMapping}
          handleNewGraphFile={handleNewGraphFile}
          handleCreateDifferenceGraph={handleCreateDifferenceGraph}
        />
      </Navbar>
    );
  } else if (activeNavItem === "Filter") {
    content = (
      <Navbar>
        <Back activeNavItem={activeNavItem} icon={<BackArrowIcon />} onClick={() => handleNavItemClick("Main")} />
        <FilterSidebar />
      </Navbar>
    );
  } else if (activeNavItem === "Physics") {
    content = (
      <Navbar>
        <Back activeNavItem={activeNavItem} icon={<BackArrowIcon />} onClick={() => handleNavItemClick("Main")} />
        <PhysicsSidebar />
      </Navbar>
    );
  } else if (activeNavItem === "Appearance") {
    content = (
      <Navbar>
        <Back activeNavItem={activeNavItem} icon={<BackArrowIcon />} onClick={() => handleNavItemClick("Main")} />
        <AppearanceSidebar
          handleNewColorScheme={handleNewColorScheme}
          handleDeleteColorScheme={handleDeleteColorScheme}
          colorSchemes={colorSchemes}
        />
      </Navbar>
    );
  }

  return <>{content}</>;
}

function Navbar({ short, children }) {
  return (
    <nav className={`navbar ${short ? "short" : ""}`}>
      <ul className="navbar-nav">{children}</ul>
    </nav>
  );
}

function Back({ activeNavItem, icon, onClick }) {
  return (
    <>
      <li className="back sidebar-tooltip-wrapper">
        <span data-tooltip-id={`back-tooltip`} data-tooltip-content="Go Back" className="back-icon" onClick={onClick}>
          {icon}
        </span>
        <div className="link-text-container">
          <p className="link-text back-text">{activeNavItem}</p>
        </div>
      </li>
    </>
  );
}
