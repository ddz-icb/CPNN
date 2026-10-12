import "./styles/tokens.css";
import "./styles/index.css";
import "./styles/sidebar.css";
import "./styles/canvas.css";
import "./styles/error.css";
import "./styles/codeEditor.css";
import "./styles/padding_utility.css";
import "./styles/text_utility.css";
import "./styles/themes.css";
import "./styles/headerbar.css";
import "./styles/sidebar_elements.css";
import "./styles/layout.css";
import "./styles/table.css";
import "./styles/tooltip.css";
import "./styles/popup.css";
import "./styles/colormapping_select.css";
import "./styles/buttons.css";
import "./styles/about_sidebar.css";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sidebar } from "./components/adapters/gui/sidebar/sidebar.jsx";
import { HeaderBar } from "./components/adapters/gui/headerbar/headerbar.jsx";
import { useTheme } from "./components/adapters/state/themeState.js";
import { RenderControl } from "./components/adapters/controllers/renderControl.jsx";
import { PhysicsControl } from "./components/adapters/controllers/physicsControl.js";
import { InitControl } from "./components/adapters/controllers/initControl.js";
import { DownloadControl } from "./components/adapters/controllers/downloadControl.js";
import { FilterControl } from "./components/adapters/controllers/filterControl.js";
import { AppearanceControl } from "./components/adapters/controllers/appearanceControl.js";
import { Error } from "./components/adapters/gui/error/error.jsx";
import { useGraphSetup } from "./components/adapters/controllers/useGraphSetup.js";
import { SearchControl } from "./components/adapters/controllers/searchControl.js";
import { Lasso } from "./components/adapters/controllers/lassoControl.js";
import { Tooltips } from "./components/adapters/gui/tooltip/tooltips.jsx";
import { HighlightControl } from "./components/adapters/controllers/highlightControl.js";
import { AdditionalDataLoading } from "./components/adapters/gui/loading/additionalDataLoading.jsx";

function App() {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeInsightsPanel, setActiveInsightsPanel] = useState(null);
  const shellRef = useRef(null);

  const updateSidebarWidth = useCallback((width) => {
    shellRef.current?.style.setProperty("--canvas-left-inset", `${width}px`);
  }, []);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    let panel = null;
    const updateWidth = () => {
      shell.style.setProperty("--canvas-right-inset", `${panel?.getBoundingClientRect().width ?? 0}px`);
    };
    const resizeObserver = new ResizeObserver(updateWidth);
    const observePanel = () => {
      const nextPanel = shell.querySelector(".right-sidebar");
      if (nextPanel === panel) return;
      resizeObserver.disconnect();
      panel = nextPanel;
      if (panel) resizeObserver.observe(panel);
      updateWidth();
    };
    const mutationObserver = new MutationObserver(observePanel);
    mutationObserver.observe(shell, { childList: true, subtree: true });
    observePanel();
    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  const isAdditionalDataLoading = useGraphSetup();

  useEffect(() => {
    const themeName = theme?.name === "dark" ? "dark" : "light";
    document.body.classList.remove("light", "dark");
    document.body.classList.add(themeName);
    return () => {
      document.body.classList.remove(themeName);
    };
  }, [theme?.name]);

  const shellClassName = [theme.name, "app-shell", sidebarCollapsed ? "sidebar-is-collapsed" : "sidebar-is-open"].join(" ");

  return (
    <>
      <AppearanceControl />
      <DownloadControl />
      <FilterControl />
      <HighlightControl />
      <PhysicsControl />
      <InitControl />
      <SearchControl />
      <main ref={shellRef} className={shellClassName}>
        <Lasso />
        <Tooltips
          onSelectInsightsPanel={setActiveInsightsPanel}
          onCloseInsightsPanel={() => setActiveInsightsPanel(null)}
        />
        <HeaderBar activePanel={activeInsightsPanel} setActivePanel={setActiveInsightsPanel} />
        <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} onWidthChange={updateSidebarWidth} />
        <AdditionalDataLoading isLoading={isAdditionalDataLoading} />
        <div className="canvas-container">
          <RenderControl />
          <Error />
        </div>
      </main>
    </>
  );
}
export default App;
