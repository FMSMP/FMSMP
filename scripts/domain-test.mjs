// ─────────────────────────────────────────────────────────────
//  npm run test:domain — تنظیمات دامنه و سازگاری سوییچ دوخطی
//  اجرا: npm run test:domain  (بدون JSX — node ساده)
// ─────────────────────────────────────────────────────────────
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { check, finish } from "./test-env.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { DOMAIN_OPTIONS, ACTIVE_DOMAIN, ACTIVE_URL, FREENOM_WARNING } = await import(
  join(root, "src/data/domain.js")
);
const { SITE } = await import(join(root, "src/data/site.js"));

// ── ۱) ساختار domain.js ──
check("ACTIVE_DOMAIN یکی از کلیدهای شناخته‌شده است", ACTIVE_DOMAIN in DOMAIN_OPTIONS, ACTIVE_DOMAIN);
check("ACTIVE_URL یک https معتبر است", /^https:\/\/[^\s]+\.[^\s]+\/$/.test(ACTIVE_URL), ACTIVE_URL);
check("همه گزینه‌ها label و url و note دارند", Object.values(DOMAIN_OPTIONS).every((o) => o.label && /^https:\/\//.test(o.url) && o.note));

// گزینه‌های رایگان طبق اسپک
check("گزینه is-a.dev موجود است", "is-a.dev" in DOMAIN_OPTIONS);
check("گزینه nic.eu.org موجود است", "nic.eu.org" in DOMAIN_OPTIONS);
check("گزینه dpdns.org موجود است", "dpdns.org" in DOMAIN_OPTIONS);

// ── ۲) هماهنگی با SITE.url (تک‌منبع حقیقت) ──
check("SITE.url با دامنه فعال برابر است", SITE.url === ACTIVE_URL, `${SITE.url} === ${ACTIVE_URL}`);

// canonical در قالب هم باید همان دامنه باشد
const tpl = readFileSync(join(root, "src/index.html"), "utf8");
check("canonical قالب با دامنه فعال برابر است", tpl.includes(`<link rel="canonical" href="${ACTIVE_URL}" />`));

// sitemap هم باید دامنه فعال را داشته باشد
const sitemap = readFileSync(join(root, "public/sitemap.xml"), "utf8");
check("sitemap با دامنه فعال هماهنگ است", sitemap.includes(ACTIVE_URL.replace(/\/$/, "")));

// ── ۳) مستندات ──
check("DOMAIN.md موجود است", existsSync(join(root, "DOMAIN.md")));
const doc = readFileSync(join(root, "DOMAIN.md"), "utf8");
check("DOMAIN.md سوییچ دوخطی را توضیح می‌دهد", doc.includes("ACTIVE_DOMAIN") && doc.includes("ACTIVE_URL"));
check("DOMAIN.md هر سه گزینه رایگان را پوشش می‌دهد", ["is-a.dev", "nic.eu.org", "dpdns.org"].every((d) => doc.includes(d)));
check("هشدار Freenom در کد و مستندات هست", FREENOM_WARNING.includes(".tk") && doc.includes("Freenom"));

finish("test:domain");
