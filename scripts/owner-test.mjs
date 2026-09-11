// ─────────────────────────────────────────────────────────────
//  npm run test:owner — پنل مدیریت + بازرسی آیکون‌ها + منطق نشست
//  اجرا: npm run test:owner  (با vite-node چون JSX دارد)
//
//  این تست سه حادثه تاریخی را برای همیشه بسته نگه می‌دارد:
//  ۱) آیکون استفاده‌شده ولی تعریف‌نشده (دو بار بی‌سروصدا منتشر شد)
//  ۲) استفاده از کلید role به‌جای type در نشست (Gate روی type چک می‌کند)
//  ۳) خواندن داده‌های پنل فقط موقع mount (باید پولینگ + focus + storage باشد)
// ─────────────────────────────────────────────────────────────
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { installBrowserEnv, check, finish } from "./test-env.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const srcDir = join(root, "src");

installBrowserEnv();

// ── ۱) بازرسی آیکون‌ها: هر name استفاده‌شده باید در Icon.jsx تعریف شده باشد ──
const iconSource = readFileSync(join(srcDir, "components/Icon.jsx"), "utf8");
const pBlock = iconSource.slice(iconSource.indexOf("const P = {"), iconSource.indexOf("};", iconSource.indexOf("const P = {")));
const defined = new Set([...pBlock.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*):/gm)].map((m) => m[1]));
check("آیکون‌های تعریف‌شده ≥ ۳۰", defined.size >= 30, `${defined.size} آیکون`);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(jsx|js)$/.test(name) ? [p] : [];
  });

const used = new Set();
for (const file of walk(srcDir)) {
  if (file.endsWith("Icon.jsx")) continue;
  const code = readFileSync(file, "utf8");
  // name="literal"
  for (const m of code.matchAll(/<Icon\b[^>]*?name="([^"]+)"/g)) used.add(m[1]);
  // name={expression} — رشته‌های مقایسه‌ای (مثل theme === "dark") حذف می‌شوند،
  // فقط نام آیکون‌های واقعی در ternaryها باقی می‌مانند
  for (const m of code.matchAll(/<Icon\b[^>]*?name=\{([^}]+)\}/g)) {
    const expr = m[1].replace(/[!=]==?\s*"[^"]*"|\s*"[^"]*"\s*[!=]==?/g, " ");
    for (const s of expr.matchAll(/"([^"]+)"/g)) used.add(s[1]);
  }
  // آرایه‌های داده: icon: "name"
  for (const m of code.matchAll(/\bicon:\s*"([^"]+)"/g)) used.add(m[1]);
}

const undefinedIcons = [...used].filter((n) => !defined.has(n));
check(
  "همه آیکون‌های استفاده‌شده تعریف شده‌اند",
  undefinedIcons.length === 0,
  undefinedIcons.length ? `تعریف‌نشده: ${undefinedIcons.join(", ")}` : `${used.size} نام استفاده‌شده`
);
check("آیکون‌های refresh و download (دکمه‌های پنل) تعریف شده‌اند", defined.has("refresh") && defined.has("download"));

// ── ۲) Gate روی session.type چک می‌کند، نه role ──
const gateSource = readFileSync(join(srcDir, "components/Gate.jsx"), "utf8");
check("Gate از session.type استفاده می‌کند", gateSource.includes("session?.type"));
check("Gate هیچ اثری از role ندارد", !/\.role\b/.test(gateSource));

// ── ۳) پنل مدیریت: پولینگ ۵ ثانیه + focus + storage ──
const ownerSource = readFileSync(join(srcDir, "pages/Owner.jsx"), "utf8");
check("setInterval پنج‌ثانیه‌ای در پنل", /setInterval\(\s*refresh\s*,\s*5000\s*\)/.test(ownerSource));
check("شنونده focus در پنل", ownerSource.includes('window.addEventListener("focus"'));
check("شنونده storage در پنل", ownerSource.includes('window.addEventListener("storage"'));
check("پاک‌سازی listenerها هنگام unmount", ownerSource.includes("clearInterval") && ownerSource.includes("removeEventListener"));

// دکمه‌های بروزرسانی و پشتیبان
check("دکمه بروزرسانی وجود دارد", ownerSource.includes("بروزرسانی"));
check("دکمه پشتیبان (دانلود JSON) وجود دارد", ownerSource.includes("پشتیبان") && ownerSource.includes("Blob") && ownerSource.includes("fmsmp-backup-"));

// یادداشت خالی‌بودن لیست
check("یادداشت محدودیت localStorage در حالت خالی", ownerSource.includes("localStorage همین مرورگر") && ownerSource.includes("Supabase"));

// ── ۴) منطق هش مالک: sha256('farbod-1390') === OWNER.hash ──
const { SITE, OWNER, STORAGE } = await import(join(root, "src/data/site.js"));
const { sha256 } = await import(join(root, "src/lib/store.js"));
const ownerHash = await sha256("farbod-1390");
check("هش رمز مالک با مقدار اسپک برابر است", ownerHash === OWNER.hash, ownerHash.slice(0, 16) + "…");
check("ایمیل مالک مطابق اسپک", OWNER.email === "farbodmohammadian1390@gmail.com");
check("لینک دیسکورد مطابق اسپک", SITE.discord === "https://discord.gg/gTqTv9FqFx");
check("کلیدهای STORAGE مطابق اسپک", ["fmsmp_users", "fmsmp_session", "fmsmp_activity", "fmsmp_visitor_id", "fmsmp_visitors", "fmsmp_login_count", "fmsmp_theme"].every((k) => Object.values(STORAGE).includes(k)));

// ── ۵) رندر پنل با داده واقعی و بدون داده ──
const Owner = (await import(join(root, "src/pages/Owner.jsx"))).default;
const ownerProps = { session: { type: "owner" }, notify: () => {}, onLogout: () => {} };

const withData = renderToStaticMarkup(
  React.createElement(Owner, {
    ...ownerProps,
    // داده‌ها در زمان رندر از localStorage خوانده می‌شوند
  })
);
// بدون داده → باید یادداشت خالی باشد نه جدول خالی بی‌توضیح
check("حالت خالی پنل: یادداشت نمایش داده می‌شود", withData.includes("چرا این لیست خالی است"));

localStorage.setItem(
  "fmsmp_users",
  JSON.stringify([
    {
      id: "u9",
      username: "AliGamer",
      email: "ali@example.com",
      password: "a".repeat(64),
      shards: 320,
      history: [{ id: "h1", amount: 100, type: "مدیریت", at: new Date().toISOString() }],
      joinedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      loginCount: 7,
    },
  ])
);
localStorage.setItem("fmsmp_activity", JSON.stringify([{ id: "e1", text: "AliGamer وارد شد", at: new Date().toISOString() }]));
localStorage.setItem("fmsmp_visitors", JSON.stringify([{ id: "v1", at: new Date().toISOString() }]));
localStorage.setItem("fmsmp_login_count", "12");

const seeded = renderToStaticMarkup(React.createElement(Owner, ownerProps));
check("فهرست کاربران با داده رندر می‌شود", seeded.includes("AliGamer"));
check("رویدادها رندر می‌شوند", seeded.includes("AliGamer وارد شد"));
check("آمار بازدید و ورود رندر می‌شود", seeded.includes("بازدیدکنندگان یکتا") && seeded.includes("ورودهای ثبت‌شده"));

// ── ۶) نشست‌های مجاز/غیرمجاز در Gate ──
const Gate = (await import(join(root, "src/components/Gate.jsx"))).default;
const blocked = renderToStaticMarkup(React.createElement(Gate, { session: { type: "user" }, type: "owner" }, React.createElement("b", null, "SECRET-PANEL")));
check("نشست کاربر عادی وارد پنل مالک نمی‌شود", blocked.includes("محافظت‌شده") && !blocked.includes("SECRET-PANEL"));
const allowed = renderToStaticMarkup(React.createElement(Gate, { session: { type: "owner" }, type: "owner" }, React.createElement("b", null, "SECRET-PANEL")));
check("نشست مالک وارد پنل می‌شود", allowed.includes("SECRET-PANEL"));

finish("test:owner");
