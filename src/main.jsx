import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import { trackVisitor } from "./lib/store.js";

import "./styles/base.css";
import "./styles/layout.css";
import "./styles/sections.css";
import "./styles/app.css";

trackVisitor();

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

// در نسخه بیلدشده، HTML از قبل پیش‌رندر شده است (برای موتورهای جستجو).
// در آن حالت hydrate می‌کنیم تا صفحه پرش نزند؛ در حالت توسعه از صفر می‌سازیم.
if (root.hasChildNodes()) {
  hydrateRoot(root, tree, {
    onRecoverableError: () => {
      /* اختلاف جزئی بین سرور و کلاینت (مثل تاریخ) طبیعی است */
    },
  });
} else {
  createRoot(root).render(tree);
}
