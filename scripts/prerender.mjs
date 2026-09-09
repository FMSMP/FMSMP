// ─────────────────────────────────────────────────────────────
//  پیش‌رندر (Pre-render)
//  کل صفحه اصلی را در زمان بیلد به HTML استاتیک تبدیل می‌کند و
//  داخل <div id="root"> می‌گذارد. بدون این کار، موتورهای جستجو
//  فقط یک div خالی می‌بینند و سایت ایندکس نمی‌شود.
// ─────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── شبیه‌سازی حداقلی محیط مرورگر ─────────────────────────────
const mem = new Map();
const storage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};

global.localStorage = storage;
Object.defineProperty(global, "sessionStorage", { value: storage, configurable: true });
global.location = { hash: "", href: "https://fmsmp.github.io/FMSMP/" };
global.window = {
  location: global.location,
  addEventListener() {},
  removeEventListener() {},
  scrollTo() {},
  setTimeout,
  clearTimeout,
  scrollY: 0,
  innerHeight: 900,
};
global.document = {
  documentElement: { dataset: {}, scrollHeight: 3000, classList: { add() {}, remove() {} } },
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
  visibilityState: "visible",
  createElement: () => ({ style: {}, setAttribute() {}, remove() {} }),
  body: { appendChild() {} },
};
Object.defineProperty(global, "navigator", { value: { clipboard: null }, configurable: true });
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
global.AbortController = class {
  constructor() {
    this.signal = {};
  }
  abort() {}
};
global.setInterval = () => 0;
global.clearInterval = () => {};
global.requestAnimationFrame = () => 0;
global.fetch = async () => {
  throw new Error("no network during prerender");
};
if (!global.crypto) global.crypto = webcrypto;

// ── رندر ─────────────────────────────────────────────────────
const { renderToStaticMarkup } = await import("react-dom/server");
const React = (await import("react")).default;
const App = (await import(join(root, "src/App.jsx"))).default;

const markup = renderToStaticMarkup(React.createElement(App));

const file = join(root, "dist", "index.html");
let html = readFileSync(file, "utf8");

if (!html.includes('<div id="root"></div>')) {
  console.error("✗ جای <div id=\"root\"></div> پیدا نشد.");
  process.exit(1);
}

html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);

// ── تزریق داده‌های ساختاریافته ساخته‌شده از محتوای واقعی ─────
const { buildJsonLd } = await import(join(root, "scripts/seo-data.mjs"));
const jsonLd = JSON.stringify(buildJsonLd());

const ldPattern = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
if (!ldPattern.test(html)) {
  console.error("✗ بلوک JSON-LD در قالب پیدا نشد.");
  process.exit(1);
}
html = html.replace(ldPattern, `<script type="application/ld+json">${jsonLd}</script>`);

writeFileSync(file, html);

// گزارش میزان متن قابل ایندکس
const text = markup
  .replace(/<(script|style)[\s\S]*?<\/\1>/g, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

console.log(`✓ پیش‌رندر انجام شد — ${markup.length.toLocaleString("en")} کاراکتر HTML`);
console.log(`  متن قابل ایندکس برای موتورهای جستجو: ${text.length.toLocaleString("en")} کاراکتر`);
