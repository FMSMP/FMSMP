import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { trackVisitor } from "./lib/store.js";

import "./styles/base.css";
import "./styles/layout.css";
import "./styles/sections.css";
import "./styles/app.css";

trackVisitor();

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
