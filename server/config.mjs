// ─────────────────────────────────────────────────────────────
//  پیکربندی سرور پرداخت
//  همه مقادیر حساس از متغیرهای محیطی خوانده می‌شوند (.env)
//  هرگز این مقادیر را مستقیم در کد ننویسید.
// ─────────────────────────────────────────────────────────────

const need = (key, fallback) => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) {
    console.error(`✗ متغیر محیطی ${key} تعریف نشده است.`);
    process.exit(1);
  }
  return v;
};

export const CONFIG = {
  port: Number(process.env.PORT || 8787),

  // آدرس سایت (برای بازگشت از درگاه و CORS)
  siteUrl: need("SITE_URL", "http://localhost:5173"),

  zarinpal: {
    merchantId: need("ZARINPAL_MERCHANT_ID", ""),
    // در حالت sandbox پول واقعی جابه‌جا نمی‌شود
    sandbox: process.env.ZARINPAL_SANDBOX === "true",
    get base() {
      return this.sandbox
        ? "https://sandbox.zarinpal.com/pg/v4/payment"
        : "https://payment.zarinpal.com/pg/v4/payment";
    },
    get startPay() {
      return this.sandbox
        ? "https://sandbox.zarinpal.com/pg/StartPay/"
        : "https://payment.zarinpal.com/pg/StartPay/";
    },
  },

  rcon: {
    host: need("RCON_HOST", "127.0.0.1"),
    port: Number(process.env.RCON_PORT || 25575),
    password: need("RCON_PASSWORD", ""),
  },

  // مسیر فایل دیتابیس سفارش‌ها
  dbFile: process.env.DB_FILE || "./server/orders.json",
};

// ─────────────────────────────────────────────────────────────
//  کاتالوگ محصولات — قیمت‌ها اینجا معتبرند، نه در مرورگر.
//  هرگز به مبلغی که از سمت کاربر می‌آید اعتماد نکنید.
//  دستورات با {player} جایگزین می‌شوند.
// ─────────────────────────────────────────────────────────────
export const CATALOG = {
  "rank-master": {
    title: "رنک مستر",
    price: 650000, // تومان
    commands: ["lp user {player} parent addtemp master 30d"],
  },
  "rank-supreme": {
    title: "رنک سوپریم",
    price: 450000,
    commands: ["lp user {player} parent addtemp supreme 30d"],
  },
  "rank-prime": {
    title: "رنک پرایم",
    price: 250000,
    commands: ["lp user {player} parent addtemp prime 30d"],
  },
  "rank-plus": {
    title: "رنک پلاس",
    price: 120000,
    commands: ["lp user {player} parent addtemp plus 30d"],
  },
  "shard-100": {
    title: "۱۰۰ شارد",
    price: 100000,
    commands: ["points give {player} 100"],
  },
  "shard-500": {
    title: "۵۰۰ شارد",
    price: 500000,
    commands: ["points give {player} 500"],
  },
  "shard-1000": {
    title: "۱۰۰۰ شارد",
    price: 1000000,
    commands: ["points give {player} 1000"],
  },
};
