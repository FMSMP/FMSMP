import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon.jsx";
import { SITE } from "../data/site.js";
import { getSession, getUsers, setUsers, log } from "../lib/store.js";

/** دکمه با افکت موج */
export function Button({ children, className = "", onClick, type = "button", disabled }) {
  const handle = (e) => {
    const el = e.currentTarget;
    const size = Math.max(el.clientWidth, el.clientHeight);
    const box = el.getBoundingClientRect();
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${e.clientX - box.left - size / 2}px`;
    span.style.top = `${e.clientY - box.top - size / 2}px`;
    el.appendChild(span);
    setTimeout(() => span.remove(), 640);
    onClick?.(e);
  };
  return (
    <button type={type} className={`btn ${className}`} onClick={handle} disabled={disabled}>
      {children}
    </button>
  );
}

/** لینک دیسکورد (با رفتار خرید) */
export function DiscordLink({ children, className = "", onPurchase }) {
  const handle = () => {
    if (!onPurchase) return;
    const s = getSession();
    if (s?.type === "user" && s.userId) {
      const user = getUsers().find((u) => u.id === s.userId);
      if (user) log(`${user.username} برای خرید به دیسکورد رفت`);
    }
  };
  return (
    <a href={SITE.discord} target="_blank" rel="noreferrer" className={className} onClick={handle}>
      {children}
    </a>
  );
}

/** عنوان بخش */
export function SectionHead({ eyebrow, title, text }) {
  return (
    <div className="section-head reveal">
      {eyebrow && <span className="micro-label">{eyebrow}</span>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

/** توست اعلان */
export function Toast({ toast }) {
  const icon = toast?.kind === "error" ? "shield" : toast?.kind === "success" ? "check" : "spark";
  return (
    <div className={`toast ${toast ? "show" : ""} ${toast?.kind || ""}`} role="status" aria-live="polite">
      <Icon name={icon} />
      <span>{toast?.text}</span>
    </div>
  );
}

/** شمارنده انیمیشنی */
export function Counter({ to, duration = 1400, format = (v) => v }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // ⚠️ طبق اسپک: اگر فقط به IntersectionObserver تکیه کنیم، در بعضی حالت‌ها
    // (تب‌های پس‌زمینه، باگ مرورگر، عناصر مخفی) شمارش روی عدد اولیه گیر می‌کند.
    // پس یک setTimeout پشتیبان هم می‌گذاریم تا شمارش همیشه شروع شود.
    let fallbackTimer = null;

    const start = () => {
      if (started.current) return;
      started.current = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    let io = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(([entry]) => entry.isIntersecting && start(), { threshold: 0.4 });
      io.observe(node);
    }
    fallbackTimer = setTimeout(start, 1100);

    return () => {
      if (io) io.disconnect();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [to, duration]);

  return <span ref={ref}>{format(val)}</span>;
}

/** فعال‌سازی انیمیشن reveal روی همه عناصر */
export function useReveal(deps = []) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    const nodes = document.querySelectorAll(".reveal:not(.visible)");
    nodes.forEach((n, i) => {
      n.style.transitionDelay = `${Math.min(i % 6, 5) * 70}ms`;
      io.observe(n);
    });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** ردیابی موقعیت موس برای درخشش کارت */
export function useSpotlight() {
  return (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
}

export { setUsers };
