import { SITE } from "../data/site.js";

/**
 * وضعیت زنده سرور ماینکرفت.
 * از دو سرویس عمومی استفاده می‌کند؛ اگر اولی جواب نداد، دومی امتحان می‌شود.
 * هر دو سرویس CORS باز دارند، پس مستقیم از مرورگر بازدیدکننده صدا زده می‌شوند.
 */

const CACHE_KEY = "fmsmp_status_cache";
const CACHE_TTL = 60_000; // یک دقیقه

const readCache = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (raw && Date.now() - raw.at < CACHE_TTL) return raw.data;
  } catch {
    /* ignore */
  }
  return null;
};

const writeCache = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* ignore */
  }
};

/** api.mcsrvstat.us — نسخه ۳ */
async function fromMcsrvstat(signal) {
  const res = await fetch(`https://api.mcsrvstat.us/3/${SITE.ip}`, { signal });
  if (!res.ok) throw new Error(`mcsrvstat ${res.status}`);
  const d = await res.json();
  return {
    online: Boolean(d.online),
    players: d.players?.online ?? 0,
    max: d.players?.max ?? 0,
    version: d.version || null,
    motd: d.motd?.clean?.join(" ") || null,
    source: "mcsrvstat.us",
  };
}

/** api.mcstatus.io — نسخه ۲ */
async function fromMcstatus(signal) {
  const res = await fetch(`https://api.mcstatus.io/v2/status/java/${SITE.ip}`, { signal });
  if (!res.ok) throw new Error(`mcstatus ${res.status}`);
  const d = await res.json();
  return {
    online: Boolean(d.online),
    players: d.players?.online ?? 0,
    max: d.players?.max ?? 0,
    version: d.version?.name_clean || d.version?.name || null,
    motd: d.motd?.clean || null,
    source: "mcstatus.io",
  };
}

/**
 * وضعیت سرور را می‌گیرد.
 * @returns {Promise<{online:boolean,players:number,max:number,version:string|null,motd:string|null,source:string}|null>}
 *          در صورت شکست هر دو سرویس، null برمی‌گرداند (یعنی «نامشخص»، نه «آفلاین»).
 */
export async function fetchStatus({ useCache = true } = {}) {
  if (useCache) {
    const cached = readCache();
    if (cached) return cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    for (const provider of [fromMcsrvstat, fromMcstatus]) {
      try {
        const data = await provider(controller.signal);
        writeCache(data);
        return data;
      } catch {
        /* سرویس بعدی را امتحان کن */
      }
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
