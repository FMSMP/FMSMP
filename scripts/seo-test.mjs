// ─────────────────────────────────────────────────────────────
//  npm run test:seo — سئو و متاتگ‌ها + داده ساختاریافته + پیش‌رندر
//  اجرا: npm run test:seo  (بدون JSX — node ساده)
// ─────────────────────────────────────────────────────────────
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { check, finish, stripTags } from "./test-env.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { SITE, FAQ, RANKS, SHARDS } = await import(join(root, "src/data/site.js"));
const { buildJsonLd } = await import(join(root, "scripts/seo-data.mjs"));

const EXPECTED_TITLE = "FMSMP | سرور ماینکرفت سروایول ایرانی و فارسی";

// ── ۱) قالب HTML سورس ──
const tpl = readFileSync(join(root, "src/index.html"), "utf8");
check("عنوان دقیق صفحه", tpl.includes(`<title>${EXPECTED_TITLE}</title>`));
check("canonical به دامنه فعال", tpl.includes(`<link rel="canonical" href="${SITE.url}" />`));
check("meta description وجود دارد", /<meta[^>]*name="description"[^>]*content="[^"]{50,}"/.test(tpl));
check("meta robots index,follow", tpl.includes('name="robots" content="index, follow'));
check("og:title و og:image", tpl.includes('property="og:title"') && tpl.includes(SITE.url + "og.jpg"));
check("twitter:card", tpl.includes('name="twitter:card" content="summary_large_image"'));
check("lang=fa و dir=rtl", tpl.includes('<html lang="fa" dir="rtl">'));
check("لینک manifest", tpl.includes('rel="manifest"'));
check("بلوک JSON-LD در قالب", tpl.includes('type="application/ld+json"'));
check("noscript برای خزنده‌های غیرجاوااسکریپتی", tpl.includes("<noscript>"));

// ── ۲) داده ساختاریافته ساخته‌شده (همان که در بیلد تزریق می‌شود) ──
const ld = buildJsonLd();
const types = ld["@graph"].map((n) => n["@type"]);
const count = (t) => types.filter((x) => x === t).length;
check("JSON-LD معتبر است", typeof ld === "object" && ld["@context"] === "https://schema.org");
check("گره Organization", count("Organization") === 1);
check("گره WebSite", count("WebSite") === 1);
check("گره VideoGameServer", count("VideoGameServer") === 1);
check("گره FAQPage با همه سوالات", count("FAQPage") === 1 && ld["@graph"].find((n) => n["@type"] === "FAQPage").mainEntity.length === FAQ.length);
check("گره HowTo برای اتصال", count("HowTo") === 1);
check("Product برای هر رنک (۴ عدد)", count("Product") === RANKS.length + SHARDS.length, `${count("Product")} محصول`);
const prices = ld["@graph"]
  .filter((n) => n["@type"] === "Product")
  .map((n) => String(n.offers.price))
  .sort((a, b) => Number(a) - Number(b));
check(
  "قیمت‌ها در JSON-LD درست است",
  JSON.stringify(prices) === JSON.stringify(["100000", "120000", "250000", "450000", "500000", "650000", "1000000"]),
  prices.join(" | ")
);
check("لینک دیسکورد در JSON-LD", JSON.stringify(ld).includes("discord.gg/gTqTv9FqFx"));

// ── ۳) فایل‌های جانبی ──
const robots = readFileSync(join(root, "public/robots.txt"), "utf8");
check("robots.txt اجازه خزندگی + sitemap", robots.includes("User-agent: *") && robots.includes("Allow: /") && robots.includes("Sitemap:"));
const sitemap = readFileSync(join(root, "public/sitemap.xml"), "utf8");
check("sitemap.xml شامل دامنه فعال", sitemap.includes(SITE.url.replace(/\/$/, "")) && sitemap.includes("<urlset"));
const manifest = JSON.parse(readFileSync(join(root, "public/manifest.webmanifest"), "utf8"));
check("manifest معتبر", manifest.name?.includes("FMSMP") && Array.isArray(manifest.icons) && manifest.icons.length > 0);
for (const f of ["public/og.jpg", "public/icon.png"]) {
  const p = join(root, f);
  check(`${f} موجود و غیرخالی`, existsSync(p) && statSync(p).size > 1000, existsSync(p) ? `${Math.round(statSync(p).size / 1024)}KB` : "یافت نشد");
}
const googleFile = join(root, "google03bf9272a272cbc1.html");
check("فایل تأیید گوگل دست‌نخورده در ریشه است", existsSync(googleFile) && readFileSync(googleFile, "utf8").includes("google-site-verification: google03bf9272a272cbc1"));

// ── ۴) خروجی پیش‌رندر (بعد از build) ──
const distIndex = join(root, "dist/index.html");
if (existsSync(distIndex)) {
  const built = readFileSync(distIndex, "utf8");
  check("خروجی: عنوان درست", built.includes(`<title>${EXPECTED_TITLE}</title>`));
  check("خروجی: محتوای پیش‌رندر داخل root تزریق شده", !built.includes('<div id="root"></div>'));
  const text = stripTags(built);
  check("خروجی: متن قابل ایندکس ≥ ۷۰۰۰", text.length >= 7000, `${text.length} کاراکتر`);
  const body = built.slice(built.indexOf('<div id="root">'));
  check("خروجی: دقیقاً یک h1", (body.match(/<h1[\s>]/g) || []).length === 1);
  check("خروجی: لینک دیسکورد درست", built.includes("discord.gg/gTqTv9FqFx"));
  const ldInBuilt = built.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check("خروجی: JSON-LD تزریق‌شده معتبر", !!ldInBuilt && (() => { try { const g = JSON.parse(ldInBuilt[1]); return g["@graph"].length >= 6; } catch { return false; } })());
} else {
  console.log("→ dist/index.html موجود نیست (بیلد اجرا نشده)؛ بررسی‌های بیلد رد شد.");
}

// ── ۵) یک h1 در هر صفحه JSX ──
for (const page of ["Home", "Auth", "Profile", "Owner"]) {
  const code = readFileSync(join(root, `src/pages/${page}.jsx`), "utf8");
  check(`صفحه ${page} حداکثر یک h1`, (code.match(/<h1[\s>]/g) || []).length <= 1);
}

finish("test:seo");
