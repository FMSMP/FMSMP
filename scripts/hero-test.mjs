// ─────────────────────────────────────────────────────────────
//  node scripts/hero-test.mjs — تست انیمیشن درخشش عنوان
//
//  طبق اسپک، دو اشتباه تکرارشده را برای همیشه می‌بندد:
//  ۱) timing باید حتماً linear باشد (نه ease، نه cubic-bezier)
//  ۲) قانون prefers-reduced-motion با iteration-count:1 نباید لوپ را بکشد
// ─────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { check, finish } from "./test-env.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const layout = readFileSync(join(root, "src/styles/layout.css"), "utf8");
const base = readFileSync(join(root, "src/styles/base.css"), "utf8");
const css = layout + "\n" + base;

// ── ۱) تعریف انیمیشن ──
check("سلکتور .hero h1 span::after موجود است", /\.hero h1 span::after\s*\{/.test(layout));
check("محتوای لایه از attr(data-text) می‌آید", /content:\s*attr\(data-text\)/.test(layout));

const animDecl = layout.match(/\.hero h1 span::after\s*\{[^}]*\}/)?.[0] || "";
check("اعلان animation روی لایه درخشش هست", /animation:\s*shine\s+[\d.]+s\s+\S+\s+infinite/.test(animDecl));

// ⚠️ اصلی‌ترین بررسی اسپک: timing باید linear باشد
check("timing انیمیشن linear است", /animation:\s*shine\s+3\.5s\s+linear\s+infinite(\s*!important)?\s*;/.test(css));
check("هیچ ease یا cubic-bezier روی انیمیشن shine نیست", !/animation:\s*shine[^;]*(ease|cubic-bezier)/.test(css));
check("مدت انیمیشن دقیقاً ۳.۵ ثانیه است", /shine\s+3\.5s/.test(css));

// ── ۲) keyframes طبق اسپک (سه ایست: شروع، پایان مسیر، مکث) ──
const kf = layout.match(/@keyframes shine\s*\{[\s\S]*?\n\}/)?.[0] || "";
check("keyframes shine تعریف شده است", kf.length > 0);
check("keyframes هر دو سر مسیر را دارند (-150% و 150%)", kf.includes("-150% 0") && kf.includes("150% 0"));
check("keyframes سه ایست دارد (0% / 45% / 100%)", ["0%", "45%", "100%"].every((stop) => kf.includes(stop)));

// ── ۳) استثنای prefers-reduced-motion (لوپ نباید کشته شود) ──
const reduced = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/)?.[0] || "";
check("بلوک prefers-reduced-motion وجود دارد", reduced.length > 0);
check("قانون سراسری iteration-count:1 موجود است", /animation-iteration-count:\s*1\s*!important/.test(reduced));

// استثنا: بعد از قانون سراسری، لایه درخشش باید با iteration-count:infinite برگردد
const exemption = reduced.match(/\.hero h1 span::after\s*\{[^}]*\}/)?.[0] || "";
check(
  "استثنای درخشش در reduced-motion موجود است",
  /animation-iteration-count:\s*infinite\s*!important/.test(exemption),
  exemption.trim().slice(0, 60) + "…"
);
check(
  "استثنای درخشش linear بودن را هم حفظ می‌کند",
  /animation:\s*shine\s+3\.5s\s+linear\s+infinite\s*!important/.test(exemption)
);

// ── ۴) data-text در JSX (لایه بدون متن رندر نمی‌شود) ──
const home = readFileSync(join(root, "src/pages/Home.jsx"), "utf8");
check("span عنوان data-text دارد", home.includes('data-text={SITE.name}'));

finish("hero-test");
