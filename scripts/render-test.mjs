// ─────────────────────────────────────────────────────────────
//  npm test — رندر SSR همه صفحات و بررسی محتوای کلیدی
//  اجرا: npm test  (با vite-node چون JSX دارد)
// ─────────────────────────────────────────────────────────────
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { installBrowserEnv, stripTags, check, finish } from "./test-env.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
installBrowserEnv();

const App = (await import(join(root, "src/App.jsx"))).default;
const { SITE } = await import(join(root, "src/data/site.js"));

const renderAt = async (hash, localStorageSeed = {}) => {
  for (const [k, v] of Object.entries(localStorageSeed)) {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
  }
  global.location.hash = hash;
  const html = renderToStaticMarkup(React.createElement(App));
  return html;
};

// ── صفحه اصلی ──
const home = await renderAt("");
check("home رندر شد", home.length > 4000, `${home.length} کاراکتر`);
check("عنوان hero با data-text (لایه درخشش)", home.includes('data-text="FMSMP"'));
check("بخش‌های اصلی", ["id=\"about\"", "id=\"join\"", "id=\"ranks\"", "id=\"shards\"", "id=\"rules\"", "id=\"faq\""].every((id) => home.includes(id)));
check("آی‌پی سرور نمایش داده شده", home.includes(SITE.ip));
check("لینک دیسکورد درست", home.includes("discord.gg/gTqTv9FqFx"));
check("قیمت رنک‌ها (تومان)", ["۶۵۰٬۰۰۰", "۴۵۰٬۰۰۰", "۲۵۰٬۰۰۰", "۱۲۰٬۰۰۰"].every((p) => home.includes(p)));
check("بسته‌های شارد", ["۱۰۰٬۰۰۰", "۵۰۰٬۰۰۰", "۱٬۰۰۰٬۰۰۰"].every((p) => home.includes(p)));
check("حالت بارگذاری: شمارنده «…» نه صفر", home.includes("…") && !home.includes(">۰<"));
check("دقیقاً یک h1 در صفحه اصلی", (home.match(/<h1[\s>]/g) || []).length === 1);

const homeText = stripTags(home);
check("متن قابل ایندکس home ≥ ۷۰۰۰", homeText.length >= 7000, `${homeText.length} کاراکتر`);

// ── صفحه ورود ──
const auth = await renderAt("#auth");
check("auth رندر شد", auth.includes("ورود") && auth.includes("ثبت‌نام"));
check("auth دقیقاً یک h1", (auth.match(/<h1[\s>]/g) || []).length === 1);

// ── پروفایل بدون نشست → Gate ──
const gate = await renderAt("#profile", { fmsmp_session: null });
check("Gate بدون نشست فعال است", gate.includes("محافظت‌شده"));
check("Gate دقیقاً یک h1", (gate.match(/<h1[\s>]/g) || []).length === 1);

// ── پروفایل با نشست کاربر ──
const profile = await renderAt("#profile", {
  fmsmp_users: [
    {
      id: "u1",
      username: "SteveFa",
      email: "steve@example.com",
      password: "x".repeat(64),
      shards: 250,
      history: [],
      joinedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      loginCount: 4,
    },
  ],
  fmsmp_session: { type: "user", userId: "u1" },
});
check("profile با نشست کاربر رندر شد", profile.includes("SteveFa"));
check("profile دقیقاً یک h1", (profile.match(/<h1[\s>]/g) || []).length === 1);

// ── پنل مالک بدون نشست → Gate ──
const ownerGate = await renderAt("#owner", { fmsmp_session: null });
check("پنل مالک بدون نشست بسته است", ownerGate.includes("محافظت‌شده"));

// ── پنل مالک با نشست مالک ──
const owner = await renderAt("#owner", {
  fmsmp_users: [
    {
      id: "u1",
      username: "SteveFa",
      email: "steve@example.com",
      shards: 250,
      history: [],
      joinedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      loginCount: 4,
    },
  ],
  fmsmp_activity: [{ id: "a1", text: "SteveFa وارد شد", at: new Date().toISOString() }],
  fmsmp_session: { type: "owner" },
});
check("پنل مالک رندر شد", owner.includes("پنل مدیریت"));
check("آمار پنل", ["ثبت‌نام‌ها", "بازدیدکنندگان", "ورودهای ثبت‌شده"].every((t) => owner.includes(t)));
check("دکمه بروزرسانی و پشتیبان", owner.includes("بروزرسانی") && owner.includes("پشتیبان"));

// ── بدون نشت مقدار undefined در خروجی ──
for (const [name, html] of [["home", home], ["auth", auth], ["profile", profile], ["owner", owner]]) {
  check(`بدون نشت undefined در ${name}`, !/>undefined</.test(html) && !/name="undefined"/.test(html));
}

// ── لینک دیسکورد قدیمی نباید هیچ‌جا باشد ──
check("لینک دیسکورد قدیمی حذف شده", !home.includes("ASFRkUgq7"));

finish("npm test");
