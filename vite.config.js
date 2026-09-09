import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// خروجی نهایی یک فایل index.html تک‌تکه است تا روی GitHub Pages / هر هاست ساده اجرا شود.
export default defineConfig({
  root: "src",
  publicDir: "../public",
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 5000,
    reportCompressedSize: false,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
});
