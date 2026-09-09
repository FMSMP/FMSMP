import { useEffect, useState } from "react";
import { fetchStatus } from "./status.js";

/**
 * وضعیت زنده سرور را می‌گیرد و هر ۶۰ ثانیه تازه می‌کند.
 * state: "loading" | "online" | "offline" | "unknown"
 */
export function useServerStatus(refreshMs = 60_000) {
  const [status, setStatus] = useState({ state: "loading", players: 0, max: 0, version: null });

  useEffect(() => {
    let alive = true;

    const load = async (useCache = true) => {
      const data = await fetchStatus({ useCache });
      if (!alive) return;
      if (!data) {
        setStatus({ state: "unknown", players: 0, max: 0, version: null });
        return;
      }
      setStatus({
        state: data.online ? "online" : "offline",
        players: data.players,
        max: data.max,
        version: data.version,
        motd: data.motd,
      });
    };

    load();
    const id = setInterval(() => load(false), refreshMs);

    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshMs]);

  return status;
}
