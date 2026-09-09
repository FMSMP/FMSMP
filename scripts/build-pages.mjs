// خروجی Vite را به ریشه مخزن کپی می‌کند تا GitHub Pages آن را سرو کند.
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

if (!existsSync(join(dist, "index.html"))) {
  console.error("✗ dist/index.html پیدا نشد — ابتدا `npm run build` را اجرا کنید.");
  process.exit(1);
}

// همه فایل‌های سطح اول dist را به ریشه کپی کن
// (index.html تک‌تکه + og.jpg + icon.png + robots.txt + sitemap.xml + manifest)
let count = 0;
for (const name of readdirSync(dist)) {
  const src = join(dist, name);
  if (!statSync(src).isFile()) continue;
  copyFileSync(src, join(root, name));
  console.log(`  ✓ ${name}`);
  count++;
}

console.log(`\n✓ ${count} فایل در ریشه مخزن بروزرسانی شد.`);
