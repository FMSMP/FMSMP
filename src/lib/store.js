import { STORAGE } from "../data/site.js";

export const fmtNum = (n) => new Intl.NumberFormat("fa-IR").format(Number(n) || 0);

export const fmtDate = (d) =>
  d ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(new Date(d)) : "—";

export const fmtDateTime = (d) =>
  d
    ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d))
    : "—";

export const sha256 = async (text) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
};

export const getUsers = () => readJSON(STORAGE.users, []);
export const setUsers = (users) => writeJSON(STORAGE.users, users);

export const getSession = () => readJSON(STORAGE.session, null);
export const setSession = (s) => writeJSON(STORAGE.session, s);
export const clearSession = () => localStorage.removeItem(STORAGE.session);

export const getActivity = () => readJSON(STORAGE.activity, []);

export function log(text) {
  const list = getActivity();
  list.unshift({ id: crypto.randomUUID(), text, at: new Date().toISOString() });
  writeJSON(STORAGE.activity, list.slice(0, 200));
}

export function trackVisitor() {
  try {
    let id = localStorage.getItem(STORAGE.visitorId);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE.visitorId, id);
      const all = readJSON(STORAGE.visitors, []);
      all.unshift({ id, at: new Date().toISOString() });
      writeJSON(STORAGE.visitors, all.slice(0, 5000));
    }
  } catch {
    /* ignore */
  }
}

export const visitorCount = () => readJSON(STORAGE.visitors, []).length;

export function bumpLogins() {
  try {
    localStorage.setItem(STORAGE.logins, String(loginCount() + 1));
  } catch {
    /* ignore */
  }
}

export const loginCount = () => Number(localStorage.getItem(STORAGE.logins) || 0);

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    el.style.insetInlineStart = "-9999px";
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, el.value.length);
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  } catch {
    return false;
  }
}

export function navigate(hash) {
  window.location.hash = hash;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
