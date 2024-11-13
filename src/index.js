import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.js";
import * as serviceWorker from "./serviceWorker.js";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App tab="home" />);

serviceWorker.unregister();
