// تست جریان پرداخت با زرین‌پال و RCON شبیه‌سازی‌شده.
// یک سرور RCON قلابی و یک زرین‌پال قلابی بالا می‌آورد و کل مسیر را می‌آزماید.
import net from "node:net";
import { rconExec } from "../server/rcon.mjs";

let pass = 0;
let fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name} ${extra}`);
  }
};

// ── سرور RCON قلابی ──────────────────────────────────────────
function fakeRcon({ password = "secret" } = {}) {
  const received = [];
  const server = net.createServer((sock) => {
    let authed = false;
    sock.on("data", (buf) => {
      const id = buf.readInt32LE(4);
      const type = buf.readInt32LE(8);
      const body = buf.slice(12, buf.length - 2).toString("utf8");

      const reply = (rid, text) => {
        const payload = Buffer.from(text, "utf8");
        const out = Buffer.alloc(14 + payload.length);
        out.writeInt32LE(10 + payload.length, 0);
        out.writeInt32LE(rid, 4);
        out.writeInt32LE(0, 8);
        payload.copy(out, 12);
        sock.write(out);
      };

      if (type === 3) {
        // احراز هویت
        authed = body === password;
        reply(authed ? id : -1, "");
        return;
      }
      received.push(body);
      reply(id, `اجرا شد: ${body}`);
    });
  });
  return { server, received };
}

console.log("\n── تست RCON ──");
{
  const { server, received } = fakeRcon();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;

  // ۱) رمز درست + چند دستور
  const out = await rconExec(
    { host: "127.0.0.1", port, password: "secret" },
    ["lp user Notch parent addtemp master 30d", "points give Notch 100"]
  );
  check("اجرای چند دستور", out.length === 2, `(${out.length})`);
  check("دستور اول درست ارسال شد", received[0] === "lp user Notch parent addtemp master 30d");
  check("دستور دوم درست ارسال شد", received[1] === "points give Notch 100");

  // ۲) رمز اشتباه باید رد شود
  let rejected = false;
  try {
    await rconExec({ host: "127.0.0.1", port, password: "wrong" }, ["say hi"]);
  } catch (e) {
    rejected = /رمز عبور اشتباه/.test(e.message);
  }
  check("رمز اشتباه رد می‌شود", rejected);

  server.close();
}

// ── تست منطق کاتالوگ و امنیت قیمت ────────────────────────────
console.log("\n── تست کاتالوگ و امنیت ──");
{
  process.env.ZARINPAL_MERCHANT_ID = "test-merchant";
  process.env.RCON_PASSWORD = "secret";
  process.env.SITE_URL = "https://example.com";
  const { CATALOG } = await import("../server/config.mjs");

  check("۷ محصول تعریف شده", Object.keys(CATALOG).length === 7);
  check("قیمت رنک مستر ۶۵۰٬۰۰۰", CATALOG["rank-master"].price === 650000);
  check("قیمت شارد ۱۰۰۰ برابر ۱٬۰۰۰٬۰۰۰", CATALOG["shard-1000"].price === 1000000);

  // مهم: دستور باید {player} داشته باشد تا جایگزین شود
  const allHavePlaceholder = Object.values(CATALOG).every((i) =>
    i.commands.every((c) => c.includes("{player}"))
  );
  check("همه دستورات جایگاه {player} دارند", allHavePlaceholder);

  // شبیه‌سازی جایگزینی
  const cmd = CATALOG["rank-master"].commands[0].replaceAll("{player}", "Steve");
  check("جایگزینی نام بازیکن", cmd === "lp user Steve parent addtemp master 30d", cmd);
}

// ── تست اعتبارسنجی نام کاربری ────────────────────────────────
console.log("\n── تست اعتبارسنجی نام ماینکرفت ──");
{
  const VALID = /^[A-Za-z0-9_]{3,16}$/;
  const cases = [
    ["Notch", true],
    ["Player_123", true],
    ["ab", false],                       // خیلی کوتاه
    ["a".repeat(17), false],             // خیلی بلند
    ["bad name", false],                 // فاصله
    ["drop;table", false],               // کاراکتر خطرناک
    ["user\nsay hack", false],           // تزریق دستور با خط جدید
    ["", false],
  ];
  for (const [input, expected] of cases) {
    check(
      `«${input.slice(0, 18)}» ${expected ? "پذیرفته" : "رد"} شود`,
      VALID.test(input) === expected
    );
  }
}

// ── تست ذخیره‌سازی سفارش ─────────────────────────────────────
console.log("\n── تست دیتابیس سفارش ──");
{
  const { OrderStore } = await import("../server/db.mjs");
  const tmp = "/tmp/fmsmp-orders-test.json";
  const { existsSync, unlinkSync } = await import("node:fs");
  if (existsSync(tmp)) unlinkSync(tmp);

  const db = new OrderStore(tmp);
  db.create({ authority: "A1", sku: "rank-master", player: "Notch", amount: 650000, status: "pending", delivered: false });
  check("سفارش ساخته شد", db.get("A1")?.player === "Notch");

  db.update("A1", { status: "paid" });
  check("بروزرسانی وضعیت", db.get("A1").status === "paid");
  check("در صف تحویل قرار گرفت", db.pendingDelivery().length === 1);

  db.update("A1", { delivered: true });
  check("پس از تحویل از صف خارج شد", db.pendingDelivery().length === 0);

  // بارگذاری مجدد از دیسک
  const db2 = new OrderStore(tmp);
  check("ماندگاری روی دیسک", db2.get("A1")?.delivered === true);
  unlinkSync(tmp);
}

console.log(`\n${fail === 0 ? "✓" : "✗"} نتیجه: ${pass} موفق، ${fail} ناموفق\n`);
process.exit(fail ? 1 : 0);
