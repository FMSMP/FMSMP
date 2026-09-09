import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

// شبیه‌سازی محیط مرورگر
const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
global.location = { hash: "", href: "http://localhost/" };
global.window = {
  location: global.location,
  addEventListener() {}, removeEventListener() {},
  scrollTo() {}, scrollY: 0, innerHeight: 900,
  setTimeout, clearTimeout, matchMedia: () => ({ matches: false, addEventListener() {} }),
};
global.document = {
  documentElement: { dataset: {}, scrollHeight: 3000 },
  getElementById: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, setAttribute() {}, remove() {}, select() {}, setSelectionRange() {}, focus() {} }),
  body: { appendChild() {} },
  execCommand: () => true,
};
Object.defineProperty(global, "navigator", { value: { clipboard: null }, configurable: true });
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.requestAnimationFrame = (fn) => setTimeout(() => fn(performance.now()), 0);
global.performance = { now: () => Date.now() };
if (!global.crypto) global.crypto = (await import("node:crypto")).webcrypto;

const pages = {
  Home: (await import("/home/user/FMSMP/src/pages/Home.jsx")).default,
  Auth: (await import("/home/user/FMSMP/src/pages/Auth.jsx")).default,
  Profile: (await import("/home/user/FMSMP/src/pages/Profile.jsx")).default,
  Owner: (await import("/home/user/FMSMP/src/pages/Owner.jsx")).default,
};
const Navbar = (await import("/home/user/FMSMP/src/components/Navbar.jsx")).default;
const Footer = (await import("/home/user/FMSMP/src/components/Footer.jsx")).default;

const props = {
  Home: { notify: () => {} },
  Auth: { onLogin: () => {}, notify: () => {} },
  Profile: { session: { type: "user", userId: "x" }, onLogout: () => {} },
  Owner: { session: { type: "owner" }, notify: () => {}, onLogout: () => {} },
};

let fail = 0;
for (const [name, Comp] of Object.entries(pages)) {
  try {
    const html = renderToStaticMarkup(React.createElement(Comp, props[name]));
    console.log(`✓ ${name.padEnd(8)} ${html.length} chars`);
  } catch (e) { fail++; console.error(`✗ ${name}:`, e.message); }
}
for (const [name, Comp, p] of [["Navbar", Navbar, { session: null, route: "home", onLogout(){}, theme: "dark", onToggleTheme(){} }], ["Footer", Footer, { notify(){} }]]) {
  try {
    const html = renderToStaticMarkup(React.createElement(Comp, p));
    console.log(`✓ ${name.padEnd(8)} ${html.length} chars`);
  } catch (e) { fail++; console.error(`✗ ${name}:`, e.message); }
}
// تست پنل مالک با داده واقعی
store.set("fmsmp_users", JSON.stringify([{ id:"1", username:"Ali", email:"a@b.com", shards: 250, history:[{id:"h1",amount:100,type:"مدیریت",at:new Date().toISOString()}], joinedAt:new Date().toISOString(), lastLoginAt:new Date().toISOString(), loginCount: 3 }]));
try {
  const html = renderToStaticMarkup(React.createElement(pages.Owner, props.Owner));
  console.log(`✓ Owner+data ${html.length} chars, has Ali:`, html.includes("Ali"));
  const h2 = renderToStaticMarkup(React.createElement(pages.Profile, { session:{type:"user",userId:"1"}, onLogout(){} }));
  console.log(`✓ Profile+data ${h2.length} chars, has Ali:`, h2.includes("Ali"));
} catch (e) { fail++; console.error("✗ with data:", e.message); }
process.exit(fail);
