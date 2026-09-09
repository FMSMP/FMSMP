import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { Toast } from "./components/ui.jsx";
import { Icon } from "./components/Icon.jsx";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Profile from "./pages/Profile.jsx";
import Owner from "./pages/Owner.jsx";
import { STORAGE } from "./data/site.js";
import { getSession, clearSession, log, navigate } from "./lib/store.js";

const routeOf = () => location.hash.replace("#", "").split("?")[0] || "home";

/** ذرات پس‌زمینه */
function Motes() {
  const motes = useMemo(
    () =>
      Array.from({ length: 22 }, () => ({
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 18}s`,
        duration: `${16 + Math.random() * 16}s`,
        top: `${100 + Math.random() * 30}%`,
      })),
    []
  );
  return (
    <div className="motes" aria-hidden="true">
      {motes.map((m, i) => (
        <i
          key={i}
          className="mote"
          style={{ left: m.left, top: m.top, animationDelay: m.delay, animationDuration: m.duration }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(routeOf);
  const [session, setSession] = useState(getSession);
  const [toast, setToast] = useState(null);
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE.theme) || "dark");

  const notify = useCallback((text, kind = "info") => {
    setToast({ text, kind });
    window.clearTimeout(window.__fmsmpToast);
    window.__fmsmpToast = window.setTimeout(() => setToast(null), 3000);
  }, []);

  // مسیریابی هش
  useEffect(() => {
    const onHash = () => setRoute(routeOf());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // تم
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE.theme, theme);
  }, [theme]);

  // نوار پیشرفت اسکرول
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [route]);

  const logout = () => {
    clearSession();
    log("خروج از حساب انجام شد");
    setSession(null);
    notify("با موفقیت خارج شدید", "success");
    navigate("home");
  };

  const page = useMemo(() => {
    switch (route) {
      case "auth":
        return <Auth onLogin={setSession} notify={notify} />;
      case "profile":
        return <Profile session={session} onLogout={logout} />;
      case "owner":
        return <Owner session={session} notify={notify} onLogout={logout} />;
      default:
        return <Home notify={notify} />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, session, notify]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        پرش به محتوای اصلی
      </a>
      <div className="ambient" />
      <Motes />
      <div className="scroll-bar" style={{ width: `${progress}%` }} />

      <Navbar
        session={session}
        route={route}
        onLogout={logout}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      <div key={route} className="page-transition">
        {page}
      </div>

      <Footer notify={notify} />

      <button
        className={`to-top ${progress > 12 ? "show" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="بازگشت به بالا"
      >
        <Icon name="arrowUp" />
      </button>

      <Toast toast={toast} />
    </div>
  );
}

