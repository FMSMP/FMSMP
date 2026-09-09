// تست کامل جریان پرداخت: از درخواست تا اجرای دستور روی سرور ماینکرفت.
// زرین‌پال و RCON هر دو شبیه‌سازی می‌شوند — هیچ پول یا اتصال واقعی در کار نیست.
import net from "node:net";
import http from "node:http";

let pass = 0, fail = 0;
const check = (n, c, e = "") => (c ? (pass++, console.log(`  ✓ ${n}`)) : (fail++, console.log(`  ✗ ${n} ${e}`)));

// ── RCON قلابی ───────────────────────────────────────────────
const rconCommands = [];
const rconServer = net.createServer((sock) => {
  sock.on("data", (buf) => {
    const id = buf.readInt32LE(4), type = buf.readInt32LE(8);
    const body = buf.slice(12, buf.length - 2).toString("utf8");
    const reply = (rid, text) => {
      const p = Buffer.from(text, "utf8");
      const o = Buffer.alloc(14 + p.length);
      o.writeInt32LE(10 + p.length, 0); o.writeInt32LE(rid, 4); o.writeInt32LE(0, 8); p.copy(o, 12);
      sock.write(o);
    };
    if (type === 3) return reply(body === "rconpass" ? id : -1, "");
    rconCommands.push(body);
    reply(id, "ok");
  });
});
await new Promise((r) => rconServer.listen(0, "127.0.0.1", r));
const rconPort = rconServer.address().port;

// ── زرین‌پال قلابی ───────────────────────────────────────────
let lastRequest = null;
let verifyCalls = 0;
const zp = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const data = JSON.parse(body || "{}");
    res.setHeader("Content-Type", "application/json");
    if (req.url.includes("/request.json")) {
      lastRequest = data;
      res.end(JSON.stringify({ data: { code: 100, authority: "A-TEST-123" }, errors: [] }));
    } else if (req.url.includes("/verify.json")) {
      verifyCalls++;
      // بار اول ۱۰۰ (تایید)، بارهای بعد ۱۰۱ (قبلاً تایید شده)
      res.end(JSON.stringify({ data: { code: verifyCalls === 1 ? 100 : 101, ref_id: 55555 }, errors: [] }));
    } else res.end("{}");
  });
});
await new Promise((r) => zp.listen(0, "127.0.0.1", r));
const zpPort = zp.address().port;

// ── راه‌اندازی سرور پرداخت با تنظیمات تستی ───────────────────
const { unlinkSync, existsSync } = await import("node:fs");
const DB = "/tmp/fmsmp-e2e-orders.json";
if (existsSync(DB)) unlinkSync(DB);

process.env.ZARINPAL_MERCHANT_ID = "test-merchant";
process.env.ZARINPAL_SANDBOX = "true";
process.env.RCON_HOST = "127.0.0.1";
process.env.RCON_PORT = String(rconPort);
process.env.RCON_PASSWORD = "rconpass";
process.env.SITE_URL = "http://127.0.0.1:9999";
process.env.DB_FILE = DB;
process.env.PORT = "0";

const { CONFIG, CATALOG } = await import("../server/config.mjs");
// آدرس زرین‌پال را به سرور قلابی تغییر می‌دهیم
const base = `http://127.0.0.1:${zpPort}/pg/v4/payment`;
Object.defineProperty(CONFIG.zarinpal, "base", { get: () => base });
Object.defineProperty(CONFIG.zarinpal, "startPay", { get: () => `http://127.0.0.1:${zpPort}/pg/StartPay/` });

const { OrderStore } = await import("../server/db.mjs");
const { rconExec } = await import("../server/rcon.mjs");
const db = new OrderStore(CONFIG.dbFile);

// بازسازی منطق سرور (بدون بالا آوردن HTTP، مستقیم توابع را می‌آزماییم)
async function apiPay({ sku, player }) {
  const item = CATALOG[sku];
  if (!item) return { code: 400, body: { error: "محصول نامعتبر است" } };
  if (!/^[A-Za-z0-9_]{3,16}$/.test(String(player || "")))
    return { code: 400, body: { error: "نام نامعتبر" } };

  const amount = item.price; // از کاتالوگ، نه از کاربر
  const r = await fetch(`${CONFIG.zarinpal.base}/request.json`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchant_id: CONFIG.zarinpal.merchantId, amount, currency: "IRT",
      description: `${item.title} برای ${player}`, callback_url: `${CONFIG.siteUrl}/api/callback` }),
  });
  const d = await r.json();
  if (d?.data?.code !== 100) return { code: 502, body: { error: "fail" } };
  db.create({ authority: d.data.authority, sku, player, amount, status: "pending", delivered: false, createdAt: new Date().toISOString() });
  return { code: 200, body: { url: CONFIG.zarinpal.startPay + d.data.authority, authority: d.data.authority } };
}

async function deliver(order) {
  const item = CATALOG[order.sku];
  const cmds = item.commands.map((c) => c.replaceAll("{player}", order.player));
  const out = await rconExec(CONFIG.rcon, cmds);
  db.update(order.authority, { delivered: true, deliveredAt: new Date().toISOString() });
  return out;
}

async function apiCallback({ Authority, Status }) {
  const order = db.get(Authority);
  if (!order) return "notfound";
  if (Status !== "OK") { db.update(Authority, { status: "cancelled" }); return "cancelled"; }
  const r = await fetch(`${CONFIG.zarinpal.base}/verify.json`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchant_id: CONFIG.zarinpal.merchantId, amount: order.amount, authority: Authority }),
  });
  const d = await r.json();
  const code = d?.data?.code;
  if (code !== 100 && code !== 101) { db.update(Authority, { status: "failed" }); return "failed"; }
  if (order.delivered) return "success";
  db.update(Authority, { status: "paid", refId: d.data.ref_id });
  try { await deliver(db.get(Authority)); return "success"; }
  catch { return "delivery-failed"; }
}

// ── سناریوها ─────────────────────────────────────────────────
console.log("\n── جریان کامل خرید رنک ──");
{
  const pay = await apiPay({ sku: "rank-master", player: "Notch" });
  check("درخواست پرداخت موفق", pay.code === 200);
  check("لینک درگاه برگشت", pay.body.url?.includes("StartPay"));
  check("مبلغ از کاتالوگ سرور خوانده شد (۶۵۰٬۰۰۰)", lastRequest.amount === 650000, `(${lastRequest.amount})`);
  check("واحد تومان است", lastRequest.currency === "IRT");

  const result = await apiCallback({ Authority: pay.body.authority, Status: "OK" });
  check("پرداخت تایید و تحویل شد", result === "success", `(${result})`);
  check("دستور رنک روی سرور اجرا شد",
    rconCommands.includes("lp user Notch parent addtemp master 30d"),
    JSON.stringify(rconCommands));
  check("سفارش تحویل‌شده علامت خورد", db.get(pay.body.authority).delivered === true);
  check("شماره پیگیری ذخیره شد", db.get(pay.body.authority).refId === 55555);
}

console.log("\n── امنیت: دستکاری مبلغ از سمت کاربر ──");
{
  lastRequest = null;
  // کاربر تلاش می‌کند مبلغ ۱۰۰۰ تومان بفرستد
  const pay = await apiPay({ sku: "rank-master", player: "Hacker", amount: 1000, price: 1000 });
  check("مبلغ کاربر نادیده گرفته شد", lastRequest.amount === 650000, `(${lastRequest.amount})`);
}

console.log("\n── امنیت: محصول و نام نامعتبر ──");
{
  check("محصول جعلی رد شد", (await apiPay({ sku: "rank-free", player: "Notch" })).code === 400);
  check("نام با فاصله رد شد", (await apiPay({ sku: "shard-100", player: "bad name" })).code === 400);
  check("تزریق دستور رد شد", (await apiPay({ sku: "shard-100", player: "a\nop x" })).code === 400);
}

console.log("\n── لغو پرداخت ──");
{
  const pay = await apiPay({ sku: "shard-100", player: "Steve" });
  const before = rconCommands.length;
  const result = await apiCallback({ Authority: pay.body.authority, Status: "NOK" });
  check("وضعیت لغو ثبت شد", result === "cancelled");
  check("هیچ دستوری اجرا نشد", rconCommands.length === before);
  check("سفارش تحویل نشد", db.get(pay.body.authority).delivered === false);
}

console.log("\n── جلوگیری از تحویل دوباره (کلیک مجدد کاربر) ──");
{
  const pay = await apiPay({ sku: "shard-500", player: "Alex" });
  await apiCallback({ Authority: pay.body.authority, Status: "OK" });
  const after1 = rconCommands.filter((c) => c.includes("Alex")).length;
  // کاربر همان لینک بازگشت را دوباره باز می‌کند
  await apiCallback({ Authority: pay.body.authority, Status: "OK" });
  const after2 = rconCommands.filter((c) => c.includes("Alex")).length;
  check("شارد فقط یک‌بار داده شد", after1 === 1 && after2 === 1, `(${after1}/${after2})`);
}

console.log("\n── تلاش مجدد وقتی سرور ماینکرفت آفلاین است ──");
{
  const pay = await apiPay({ sku: "rank-plus", player: "Bob" });
  rconServer.close();                       // سرور ماینکرفت خاموش می‌شود
  const result = await apiCallback({ Authority: pay.body.authority, Status: "OK" });
  check("تحویل ناموفق گزارش شد", result === "delivery-failed", `(${result})`);
  check("پول ثبت شد ولی تحویل نشده", db.get(pay.body.authority).status === "paid" && !db.get(pay.body.authority).delivered);
  check("در صف تلاش مجدد قرار گرفت", db.pendingDelivery().some((o) => o.player === "Bob"));
}

zp.close();
if (existsSync(DB)) unlinkSync(DB);
console.log(`\n${fail === 0 ? "✓" : "✗"} نتیجه: ${pass} موفق، ${fail} ناموفق\n`);
process.exit(fail ? 1 : 0);
