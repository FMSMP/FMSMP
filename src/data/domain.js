// ─────────────────────────────────────────────────────────────
//  تنظیمات دامنه FMSMP — سوییچ دوخطی (طبق DOMAIN.md)
//
//  برای تغییر دامنه فقط دو کار لازم است:
//  ۱) مقدار ACTIVE_DOMAIN را به کلید یکی از گزینه‌های پایین تغییر بده
//  ۲) مقدار ACTIVE_URL را با آدرس همان گزینه جایگزین کن
//  بعد از تغییر: `npm run build && npm run deploy`
//
//  گزینه‌های رایگان پیشنهادی:
//   · is-a.dev  → با Pull Request در مخزن is-a.dev (رایگان و معتبر)
//   · nic.eu.org → زیردامنه eu.org (رایگان، نیازمند فرم درخواست)
//   · dpdns.org  → زیردامنه رایگان با پنل DNS
//
//  ⚠️ هشدار: Freenom (دامنه‌های .tk / .ml / .ga) دیگر رایگان نیست؛
//  ثبت و تمدید این دامنه‌ها عملاً از دسترس خارج شده — استفاده نکنید.
// ─────────────────────────────────────────────────────────────

export const DOMAIN_OPTIONS = {
  github: {
    label: "GitHub Pages (پیش‌فرض)",
    url: "https://fmsmp.github.io/FMSMP/",
    note: "فعلاً فعال — بدون نیاز به DNS؛ سرو از ریشه مخزن",
  },
  "is-a.dev": {
    label: "is-a.dev — زیردامنه رایگان با Pull Request",
    url: "https://fmsmp.is-a.dev/",
    note: "در مخزن is-a.dev فایل domains/fmsmp.json با رکورد CNAME به FMSMP.github.io بساز و PR بزن",
  },
  "nic.eu.org": {
    label: "nic.eu.org — دامنه رایگان eu.org",
    url: "https://fmsmp.eu.org/",
    note: "فرم درخواست زیردامنه را پر کن و بعد CNAME را به FMSMP.github.io تنظیم کن",
  },
  "dpdns.org": {
    label: "dpdns.org — زیردامنه رایگان",
    url: "https://fmsmp.dpdns.org/",
    note: "ثبت‌نام کن، رکورد CNAME به FMSMP.github.io بساز و در Pages دامنه را معرفی کن",
  },
};

// ←←← خط ۱: کلید دامنه فعال (یکی از کلیدهای DOMAIN_OPTIONS)
export const ACTIVE_DOMAIN = "github";

// ←←← خط ۲: آدرس دامنه فعال (هنگام سوییچ، با url همان گزینه عوضش کن)
export const ACTIVE_URL = "https://fmsmp.github.io/FMSMP/";

// ⚠️ Freenom دیگر رایگان نیست — دامنه‌های .tk / .ml / .ga را استفاده نکن
export const FREENOM_WARNING =
  "Freenom (.tk, .ml, .ga) دیگر رایگان نیست — از گزینه‌های is-a.dev / nic.eu.org / dpdns.org استفاده کن.";
