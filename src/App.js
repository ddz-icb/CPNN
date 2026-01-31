import "./styles/tokens.css";
import "./styles/index.css";
import "./styles/sidebar.css";
import "./styles/canvas.css";
import "./styles/error.css";
import "./styles/codeEditor.css";
import "./styles/padding_utility.css";
import "./styles/text_utility.css";
import "./styles/pdb_viewer.css";
import "./styles/themes.css";
import "./styles/headerbar.css";
import "./styles/sidebar_elements.css";
import "./styles/layout.css";
import "./styles/table.css";
import "./styles/tooltip.css";
import "./styles/popup.css";
import "./styles/colormapping_select.css";
import "./styles/buttons.css";
import "./styles/tailwind.css";

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

function App() {
  const { theme } = useTheme();

  useGraphSetup();

  return (
    <>
      <AppearanceControl />
      <DownloadControl />
      <FilterControl />
      <HighlightControl />
      <PhysicsControl />
      <InitControl />
      <SearchControl />
      <main className={theme.name}>
        <Lasso />
        <Tooltips />
        <HeaderBar />
        <Sidebar />
        <div className="canvas-container">
          <RenderControl />
          <Error />
        </div>
      </main>
    </>
  );
}
export default App;
