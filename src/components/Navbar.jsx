import { useEffect, useState } from "react";
import { Icon } from "./Icon.jsx";
import { SITE } from "../data/site.js";
import { navigate } from "../lib/store.js";

const LINKS = [
  ["home", "خانه"],
  ["about", "درباره"],
  ["ranks", "رنک‌ها"],
  ["shards", "شارد"],
  ["rules", "قوانین"],
  ["faq", "سوالات"],
];

export default function Navbar({ session, route, onLogout, theme, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      if (route !== "home") return;
      let current = "home";
      for (const [id] of LINKS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [route]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goSection = (id) => {
    setOpen(false);
    if (route !== "home") {
      navigate(id === "home" ? "home" : `home?section=${id}`);
      return;
    }
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="nav-wrap">
      <nav className={`nav ${scrolled ? "scrolled" : ""}`} aria-label="ناوبری اصلی">
        <button className="brand" onClick={() => navigate("home")} aria-label={`خانه ${SITE.name}`}>
          <span className="brand-gem">◆</span>
          <span>{SITE.name}</span>
        </button>

        <div className={`nav-links ${open ? "open" : ""}`}>
          {LINKS.map(([id, label]) => (
            <button
              key={id}
              className={route === "home" && active === id ? "active" : ""}
              onClick={() => goSection(id)}
            >
              {label}
            </button>
          ))}
          {session ? (
            <button
              className={route === "profile" || route === "owner" ? "active" : ""}
              onClick={() => {
                setOpen(false);
                navigate(session.type === "owner" ? "owner" : "profile");
              }}
            >
              حساب من
            </button>
          ) : (
            <button
              className={route === "auth" ? "active" : ""}
              onClick={() => {
                setOpen(false);
                navigate("auth");
              }}
            >
              ورود / ثبت‌نام
            </button>
          )}
        </div>

        <div className="nav-actions">
          <button
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
            title={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>

          {session && (
            <button className="icon-btn" onClick={onLogout} aria-label="خروج از حساب" title="خروج">
              <Icon name="logout" />
            </button>
          )}

          <a className="discord-btn" href={SITE.discord} target="_blank" rel="noreferrer">
            <Icon name="discord" />
            <span>دیسکورد</span>
          </a>

          <button
            className="icon-btn menu-btn"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "بستن منو" : "باز کردن منو"}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </nav>
    </header>
  );
}
