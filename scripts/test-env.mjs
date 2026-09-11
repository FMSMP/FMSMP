// ─────────────────────────────────────────────────────────────
//  محیط مشترک شبیه‌سازی مرورگر برای تست‌های SSR
//  طبق اسپک: querySelectorAll (آرایه خالی)، matchMedia،
//  requestAnimationFrame (بی‌اثر) باید در محیط تست موجود باشند.
// ─────────────────────────────────────────────────────────────
import { webcrypto } from "node:crypto";

export function installBrowserEnv() {
  const noop = () => {};

  const makeStorage = () => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
      clear: () => m.clear(),
      key: (i) => [...m.keys()][i] ?? null,
      get length() {
        return m.size;
      },
    };
  };

  if (!global.localStorage) global.localStorage = makeStorage();
  if (!global.sessionStorage) global.sessionStorage = makeStorage();

  if (!global.location) {
    global.location = { hash: "", href: "https://fmsmp.github.io/FMSMP/", assign: noop, replace: noop };
  }

  if (!global.window) {
    global.window = {
      location: global.location,
      addEventListener: noop,
      removeEventListener: noop,
      scrollTo: noop,
      scrollY: 0,
      innerHeight: 900,
      setTimeout,
      clearTimeout,
      setInterval: () => 0,
      clearInterval: noop,
      isSecureContext: true,
    };
  }

  if (!global.document) {
    global.document = {
      documentElement: { dataset: {}, scrollHeight: 3000, classList: { add: noop, remove: noop } },
      getElementById: () => null,
      // طبق اسپک: querySelectorAll آرایه خالی برگرداند
      querySelectorAll: () => [],
      addEventListener: noop,
      removeEventListener: noop,
      visibilityState: "visible",
      createElement: () => ({
        style: {},
        setAttribute() {},
        remove() {},
        select() {},
        setSelectionRange() {},
        focus() {},
        appendChild() {},
        click() {},
      }),
      body: { appendChild: noop },
      execCommand: () => true,
    };
  }

  // طبق اسپک: matchMedia باید موجود باشد
  if (!global.matchMedia) {
    global.matchMedia = (q) => ({
      matches: false,
      media: q || "",
      onchange: null,
      addListener: noop,
      removeListener: noop,
      addEventListener: noop,
      removeEventListener: noop,
      dispatchEvent: () => false,
    });
  }

  if (!global.navigator) {
    Object.defineProperty(global, "navigator", {
      value: { clipboard: { writeText: async () => {} } },
      configurable: true,
    });
  }

  if (!global.IntersectionObserver) {
    global.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // طبق اسپک: requestAnimationFrame بی‌اثر (no-op)
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = () => 0;
  }

  if (!global.crypto) global.crypto = webcrypto;
}

/** کمکی‌های کوچک تست */
export const stripTags = (html) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function check(label, ok, extra = "") {
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${label}${ok || extra ? (extra ? ` — ${extra}` : "") : ""}`);
  if (!ok) process.exitCode = 1;
  return ok;
}

export function finish(name) {
  if (process.exitCode) {
    console.error(`\n✗ ${name}: حداقل یک بررسی رد شد`);
    process.exit(1);
  }
  console.log(`\n✓ ${name}: همه بررسی‌ها سبز است`);
}
