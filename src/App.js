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

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/adapters/gui/sidebar/sidebar.js";
import { HeaderBar } from "./components/adapters/gui/headerbar/headerbar.js";
import { useTheme } from "./components/adapters/state/themeState.js";
import { RenderControl } from "./components/adapters/controllers/renderControl.js";
import { PhysicsControl } from "./components/adapters/controllers/physicsControl.js";
import { InitControl } from "./components/adapters/controllers/initControl.js";
import { DownloadControl } from "./components/adapters/controllers/downloadControl.js";
import { FilterControl } from "./components/adapters/controllers/filterControl.js";
import { AppearanceControl } from "./components/adapters/controllers/appearanceControl.js";
import { Error } from "./components/adapters/gui/error/error.js";
import { useGraphSetup } from "./components/adapters/controllers/useGraphSetup.js";
import { SearchControl } from "./components/adapters/controllers/searchControl.js";
import { Lasso } from "./components/adapters/controllers/lassoControl.js";
import { Tooltips } from "./components/adapters/gui/tooltip/tooltips.js";
import { HighlightControl } from "./components/adapters/controllers/highlightControl.js";
import { AdditionalDataLoading } from "./components/adapters/gui/loading/additionalDataLoading.js";

const sidebarMobileQuery = "(max-width: 760px)";
const sidebarStorageKey = "cpnn.sidebarCollapsed";

function getStoredSidebarCollapsed() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(sidebarStorageKey);
    return stored === null ? null : stored === "true";
  } catch {
    return null;
  }
}

function getInitialSidebarCollapsed() {
  if (typeof window === "undefined") return false;
  const stored = getStoredSidebarCollapsed();
  if (stored !== null) return stored;
  return window.matchMedia?.(sidebarMobileQuery)?.matches ?? false;
}

function App() {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(getInitialSidebarCollapsed);

  const isAdditionalDataLoading = useGraphSetup();
  const setSidebarCollapsed = useCallback((collapsed) => {
    setSidebarCollapsedState(collapsed);
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia?.(sidebarMobileQuery)?.matches ?? false;
    if (isMobile) return;

    try {
      window.localStorage.setItem(sidebarStorageKey, String(collapsed));
    } catch {
      // Ignore storage failures; the live UI state is still updated.
    }
  }, []);

  useEffect(() => {
    const themeName = theme?.name === "dark" ? "dark" : "light";
    document.body.classList.remove("light", "dark");
    document.body.classList.add(themeName);
    return () => {
      document.body.classList.remove(themeName);
    };
  }, [theme?.name]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(sidebarMobileQuery);
    const syncSidebarForViewport = () => {
      if (mediaQuery.matches) {
        setSidebarCollapsedState(true);
        return;
      }

      setSidebarCollapsedState(getStoredSidebarCollapsed() ?? false);
    };

    syncSidebarForViewport();
    mediaQuery.addEventListener?.("change", syncSidebarForViewport);
    return () => {
      mediaQuery.removeEventListener?.("change", syncSidebarForViewport);
    };
  }, []);

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
      <main className={shellClassName}>
        <Lasso />
        <Tooltips />
        <HeaderBar />
        <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
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
