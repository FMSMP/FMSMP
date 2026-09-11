# راهنمای تغییر دامنه FMSMP

این راهنما توضیح می‌دهد چطور در **دو خط** دامنه فعال سایت را عوض کنید.

## سوییچ دوخطی

فایل `src/data/domain.js` را باز کنید و دو خط پایین آن را تغییر دهید:

```js
// ←←← خط ۱: کلید دامنه فعال
export const ACTIVE_DOMAIN = "github";

// ←←← خط ۲: آدرس دامنه فعال
export const ACTIVE_URL = "https://fmsmp.github.io/FMSMP/";
```

سپس:

```bash
npm install      # فقط بار اول
npm run build    # بیلد + پیش‌رندر با دامنه جدید
npm run deploy   # کپی خروجی به ریشه مخزن برای GitHub Pages
```

آدرس `SITE.url` در `src/data/site.js` هم باید با دامنه جدید هماهنگ شود
(canonical، sitemap و JSON-LD از آن خوانده می‌شوند).

## گزینه‌های رایگان

| گزینه | آدرس نمونه | روش فعال‌سازی |
| --- | --- | --- |
| `is-a.dev` | `fmsmp.is-a.dev` | فورک مخزن is-a.dev، ساخت `domains/fmsmp.json` با رکورد CNAME، ارسال Pull Request و منتظر merge ماندن |
| `nic.eu.org` | `fmsmp.eu.org` | پر کردن فرم درخواست در nic.eu.org و سپس تنظیم CNAME |
| `dpdns.org` | `fmsmp.dpdns.org` | ثبت‌نام در dpdns.org و ساخت رکورد CNAME در پنل |

## مراحل عمومی بعد از داشتن دامنه

1. در پنل DNS سرویس‌دهنده، یک رکورد `CNAME` با مقدار `FMSMP.github.io` بسازد (برای ریشه دامنه، رکورد ALIAS/ANAME یا A به آی‌پی‌های Pages).
2. در گیت‌هاب: Settings → Pages → Custom domain را وارد کنید و بعد از تأیید DNS، گزینه Enforce HTTPS را فعال کنید.
3. یک فایل `CNAME` (فقط یک خط: نام دامنه) در ریشه مخزن بگذارید تا دامنه حذف نشود.
4. دو خط `src/data/domain.js` و `SITE.url` را بروز کنید، بیلد و دیپلوی کنید.

## ⚠️ هشدار Freenom

دامنه‌های رایگان `.tk` / `.ml` / `.ga` (Freenom) **دیگر رایگان نیستند** و ثبت/تمدیدشان
عملاً در دسترس نیست. برای دامنه رایگان از گزینه‌های جدول بالا استفاده کنید.
