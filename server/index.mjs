// ─────────────────────────────────────────────────────────────
//  سرور پرداخت و تحویل خودکار FMSMP
//
//  جریان کار:
//   ۱) کاربر نام ماینکرفت و محصول را انتخاب می‌کند  → POST /api/pay
//   ۲) به درگاه زرین‌پال هدایت می‌شود
//   ۳) پس از پرداخت به /api/callback برمی‌گردد
//   ۴) سرور تراکنش را verify می‌کند (مبلغ از کاتالوگ، نه از کاربر)
//   ۵) دستور رنک/شارد از طریق RCON روی سرور ماینکرفت اجرا می‌شود
// ─────────────────────────────────────────────────────────────
import http from "node:http";
import { CONFIG, CATALOG } from "./config.mjs";
import { OrderStore } from "./db.mjs";
import { rconExec } from "./rcon.mjs";

const db = new OrderStore(CONFIG.dbFile);

// ── ابزارها ──────────────────────────────────────────────────
const json = (res, code, body) => {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": CONFIG.siteUrl,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
};

const redirect = (res, url) => {
  res.writeHead(302, { Location: url });
  res.end();
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1e5) reject(new Error("body too large"));
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });
  });

// نام کاربری معتبر ماینکرفت: ۳ تا ۱۶ کاراکتر، حروف/عدد/آندرلاین
const VALID_NAME = /^[A-Za-z0-9_]{3,16}$/;

// ── نرخ‌گذاری ساده برای جلوگیری از سوءاستفاده ────────────────
const hits = new Map();
function rateLimit(ip, max = 20, windowMs = 60_000) {
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, reset: now + windowMs };
  if (now > rec.reset) {
    rec.count = 0;
    rec.reset = now + windowMs;
  }
  rec.count++;
  hits.set(ip, rec);
  return rec.count <= max;
}

// ── تحویل سفارش از طریق RCON ─────────────────────────────────
async function deliver(order) {
  const item = CATALOG[order.sku];
  if (!item) throw new Error(`محصول ناشناخته: ${order.sku}`);

  const commands = item.commands.map((c) => c.replaceAll("{player}", order.player));
  const output = await rconExec(CONFIG.rcon, commands);

  db.update(order.authority, {
    delivered: true,
    deliveredAt: new Date().toISOString(),
    rconOutput: output,
  });

  console.log(`✓ تحویل شد: ${item.title} → ${order.player}`);
  return output;
}

// ── مسیرها ───────────────────────────────────────────────────
const routes = {
  // فهرست محصولات (قیمت معتبر از سمت سرور)
  "GET /api/products": async (req, res) => {
    json(
      res,
      200,
      Object.entries(CATALOG).map(([sku, v]) => ({ sku, title: v.title, price: v.price }))
    );
  },

  // شروع پرداخت
  "POST /api/pay": async (req, res) => {
    const body = await readBody(req);
    const { sku, player } = body;

    const item = CATALOG[sku];
    if (!item) return json(res, 400, { error: "محصول نامعتبر است" });

    if (!VALID_NAME.test(String(player || "")))
      return json(res, 400, {
        error: "نام کاربری ماینکرفت نامعتبر است (۳ تا ۱۶ کاراکتر، فقط حروف انگلیسی، عدد و _)",
      });

    // ⚠️ مبلغ از کاتالوگ سرور خوانده می‌شود، نه از درخواست کاربر
    const amount = item.price;

    const payload = {
      merchant_id: CONFIG.zarinpal.merchantId,
      amount, // به تومان
      currency: "IRT",
      description: `${item.title} برای ${player}`,
      callback_url: `${CONFIG.siteUrl.replace(/\/$/, "")}/api/callback`,
      metadata: {},
    };

    const r = await fetch(`${CONFIG.zarinpal.base}/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();

    if (data?.data?.code !== 100) {
      console.error("✗ خطای زرین‌پال:", data?.errors || data);
      return json(res, 502, { error: "ایجاد تراکنش ناموفق بود", detail: data?.errors });
    }

    const authority = data.data.authority;
    db.create({
      authority,
      sku,
      player,
      amount,
      status: "pending",
      delivered: false,
      createdAt: new Date().toISOString(),
    });

    console.log(`→ تراکنش ساخته شد: ${item.title} / ${player} / ${amount} تومان`);
    json(res, 200, { url: CONFIG.zarinpal.startPay + authority, authority });
  },

  // بازگشت از درگاه
  "GET /api/callback": async (req, res, url) => {
    const authority = url.searchParams.get("Authority");
    const status = url.searchParams.get("Status");
    const site = CONFIG.siteUrl.replace(/\/$/, "");

    const order = authority && db.get(authority);
    if (!order) return redirect(res, `${site}/#pay-result?state=notfound`);

    if (status !== "OK") {
      db.update(authority, { status: "cancelled" });
      return redirect(res, `${site}/#pay-result?state=cancelled`);
    }

    // ⚠️ مبلغ از سفارش ذخیره‌شده خوانده می‌شود
    const r = await fetch(`${CONFIG.zarinpal.base}/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: CONFIG.zarinpal.merchantId,
        amount: order.amount,
        authority,
      }),
    });
    const data = await r.json();
    const code = data?.data?.code;

    // ۱۰۰ = تایید شد، ۱۰۱ = قبلاً تایید شده
    if (code !== 100 && code !== 101) {
      db.update(authority, { status: "failed", error: data?.errors });
      return redirect(res, `${site}/#pay-result?state=failed`);
    }

    if (order.delivered) {
      return redirect(res, `${site}/#pay-result?state=success&ref=${order.refId || ""}`);
    }

    db.update(authority, { status: "paid", refId: data.data.ref_id, paidAt: new Date().toISOString() });

    try {
      await deliver(db.get(authority));
      redirect(res, `${site}/#pay-result?state=success&ref=${data.data.ref_id}`);
    } catch (e) {
      // پول گرفته شده ولی تحویل نشده — سفارش در صف تلاش مجدد می‌ماند
      console.error("✗ تحویل ناموفق:", e.message);
      db.update(authority, { deliveryError: e.message });
      redirect(res, `${site}/#pay-result?state=delivery-failed&ref=${data.data.ref_id}`);
    }
  },

  // وضعیت یک سفارش
  "GET /api/order": async (req, res, url) => {
    const o = db.get(url.searchParams.get("authority"));
    if (!o) return json(res, 404, { error: "سفارش پیدا نشد" });
    json(res, 200, {
      sku: o.sku,
      player: o.player,
      amount: o.amount,
      status: o.status,
      delivered: o.delivered,
      refId: o.refId ?? null,
    });
  },

  "GET /api/health": async (req, res) => json(res, 200, { ok: true, orders: db.all().length }),
};

// ── سرور ─────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const key = `${req.method} ${url.pathname}`;

  if (req.method === "OPTIONS") return json(res, 204, {});

  const ip = req.socket.remoteAddress || "unknown";
  if (!rateLimit(ip)) return json(res, 429, { error: "درخواست بیش از حد" });

  const handler = routes[key];
  if (!handler) return json(res, 404, { error: "مسیر پیدا نشد" });

  try {
    await handler(req, res, url);
  } catch (e) {
    console.error(`✗ ${key}:`, e.message);
    if (!res.headersSent) json(res, 500, { error: "خطای داخلی سرور" });
  }
});

// تلاش مجدد برای سفارش‌های پرداخت‌شده ولی تحویل‌نشده
// (مثلاً وقتی سرور ماینکرفت هنگام پرداخت آفلاین بوده)
setInterval(async () => {
  for (const order of db.pendingDelivery()) {
    try {
      await deliver(order);
    } catch {
      /* دفعه بعد دوباره تلاش می‌شود */
    }
  }
}, 120_000);

server.listen(CONFIG.port, "0.0.0.0", () => {
  console.log(`\n  سرور پرداخت FMSMP روی پورت ${CONFIG.port}`);
  console.log(`  حالت زرین‌پال: ${CONFIG.zarinpal.sandbox ? "sandbox (تستی)" : "واقعی"}`);
  console.log(`  سایت: ${CONFIG.siteUrl}\n`);
});
