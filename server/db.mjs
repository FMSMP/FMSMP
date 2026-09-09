// ─────────────────────────────────────────────────────────────
//  ذخیره‌سازی سفارش‌ها در فایل JSON
//  برای حجم کم کافی است. اگر ترافیک زیاد شد به SQLite مهاجرت کنید.
//  نوشتن اتمیک است تا در صورت قطع برق فایل خراب نشود.
// ─────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export class OrderStore {
  constructor(file) {
    this.file = file;
    this.orders = new Map();
    this._load();
  }

  _load() {
    if (!existsSync(this.file)) return;
    try {
      const raw = JSON.parse(readFileSync(this.file, "utf8"));
      for (const o of raw) this.orders.set(o.authority, o);
      console.log(`  ${this.orders.size} سفارش از دیسک بارگذاری شد`);
    } catch (e) {
      console.error("✗ خواندن فایل سفارش‌ها ناموفق بود:", e.message);
    }
  }

  _save() {
    const dir = dirname(this.file);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify([...this.orders.values()], null, 2));
    renameSync(tmp, this.file); // اتمیک
  }

  create(order) {
    this.orders.set(order.authority, order);
    this._save();
    return order;
  }

  get(authority) {
    return this.orders.get(authority);
  }

  update(authority, patch) {
    const o = this.orders.get(authority);
    if (!o) return null;
    Object.assign(o, patch, { updatedAt: new Date().toISOString() });
    this._save();
    return o;
  }

  /** سفارش‌هایی که پرداخت شده‌اند ولی تحویل نشده‌اند (برای تلاش مجدد) */
  pendingDelivery() {
    return [...this.orders.values()].filter(
      (o) => o.status === "paid" && !o.delivered
    );
  }

  all() {
    return [...this.orders.values()];
  }
}
