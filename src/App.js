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

import { Sidebar } from "./components/gui/sidebar/sidebar.js";
import { HeaderBar } from "./components/gui/headerbar/headerbar.js";
import { useTheme } from "./components/adapters/state/themeState.js";
import { RenderControl } from "./components/application_service/controllers/renderControl.js";
import { PhysicsControl } from "./components/application_service/controllers/physicsControl.js";
import { InitControl } from "./components/application_service/controllers/initControl.js";
import { DownloadControl } from "./components/application_service/controllers/downloadControl.js";
import { FilterControl } from "./components/application_service/controllers/filterControl.js";
import { AppearanceControl } from "./components/application_service/controllers/appearanceControl.js";
import { Error } from "./components/gui/error/error.js";
import { useGraphLoader } from "./components/application_service/controllers/useGraphLoader.js";
import { useGraphSetup } from "./components/application_service/controllers/useGraphSetup.js";

function App() {
  const { theme } = useTheme();

  useGraphLoader();
  useGraphSetup();

  return (
    <>
      <AppearanceControl />
      <DownloadControl />
      <FilterControl />
      <PhysicsControl />
      <InitControl />
      <main className={theme.name}>
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
