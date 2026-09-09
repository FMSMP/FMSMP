// خروجی تک‌فایلی Vite را به ریشه مخزن کپی می‌کند تا GitHub Pages آن را سرو کند.
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "dist", "index.html");
const dest = join(root, "index.html");

if (!existsSync(src)) {
  console.error("✗ dist/index.html پیدا نشد — ابتدا `npm run build` را اجرا کنید.");
  process.exit(1);
}
copyFileSync(src, dest);
console.log("✓ index.html در ریشه بروزرسانی شد.");
