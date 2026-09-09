import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Button } from "../components/ui.jsx";
import { OWNER } from "../data/site.js";
import { getUsers, setUsers, setSession, log, sha256, bumpLogins, navigate } from "../lib/store.js";

const strength = (pw) => {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^\w\s]/.test(pw)) s++;
  return s;
};

export default function Auth({ onLogin, notify }) {
  const [tab, setTab] = useState("login");
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [reg, setReg] = useState({ username: "", email: "", password: "", confirm: "" });

  const doLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const email = login.email.trim().toLowerCase();

      if (email === OWNER.email && (await sha256(login.password)) === OWNER.hash) {
        const s = { type: "owner" };
        setSession(s);
        bumpLogins();
        log("مالک وارد پنل مدیریت شد");
        onLogin(s);
        notify("خوش آمدید، مالک قلمرو", "success");
        navigate("owner");
        return;
      }

      const user = getUsers().find((u) => u.email.toLowerCase() === email && u.password === login.password);
      if (!user) {
        notify("ایمیل یا رمز عبور درست نیست", "error");
        return;
      }

      const now = new Date().toISOString();
      setUsers(
        getUsers().map((u) =>
          u.id === user.id ? { ...u, lastLoginAt: now, loginCount: (u.loginCount || 0) + 1 } : u
        )
      );
      bumpLogins();
      const s = { type: "user", userId: user.id };
      setSession(s);
      log(`${user.username} وارد شد`);
      onLogin(s);
      notify(`خوش آمدی ${user.username}!`, "success");
      navigate("profile");
    } finally {
      setBusy(false);
    }
  };

  const doRegister = (e) => {
    e.preventDefault();
    if (reg.username.trim().length < 3) return notify("نام کاربری حداقل ۳ کاراکتر باشد", "error");
    if (!/^\S+@\S+\.\S+$/.test(reg.email)) return notify("ایمیل معتبر وارد کنید", "error");
    if (reg.password.length < 6) return notify("رمز باید حداقل ۶ کاراکتر باشد", "error");
    if (reg.password !== reg.confirm) return notify("تکرار رمز با رمز برابر نیست", "error");

    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === reg.email.trim().toLowerCase()))
      return notify("این ایمیل قبلاً ثبت شده است", "error");

    const user = {
      id: crypto.randomUUID(),
      username: reg.username.trim(),
      email: reg.email.trim(),
      password: reg.password,
      shards: 0,
      history: [],
      joinedAt: new Date().toISOString(),
      lastLoginAt: null,
      loginCount: 0,
    };
    setUsers([...users, user]);
    log(`${user.username} ثبت‌نام کرد`);
    notify("حساب ساخته شد؛ حالا وارد شوید", "success");
    setTab("login");
    setLogin({ email: user.email, password: "" });
    setReg({ username: "", email: "", password: "", confirm: "" });
  };

  const sc = strength(reg.password);

  return (
    <main className="subpage page-transition">
      <div className="auth-shell glass">
        <aside className="auth-aside">
          <span className="micro-label">دروازه قلمرو</span>
          <h1>
            خزانه شارد
            <em>منتظر توست.</em>
          </h1>
          <p>حساب بساز، موجودی شاردت را ببین و تاریخچه فعالیتت را در قلمرو دنبال کن.</p>
          <ul className="auth-perks">
            <li>
              <Icon name="check" />
              مشاهده لحظه‌ای موجودی شارد
            </li>
            <li>
              <Icon name="check" />
              تاریخچه کامل تراکنش‌ها
            </li>
            <li>
              <Icon name="check" />
              دسترسی سریع به پشتیبانی دیسکورد
            </li>
          </ul>
        </aside>

        <div className="auth-form-wrap">
          <div className="auth-tabs">
            <button className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>
              ورود
            </button>
            <button className={tab === "register" ? "active" : ""} onClick={() => setTab("register")}>
              ثبت‌نام
            </button>
          </div>

          {tab === "login" ? (
            <form className="form" onSubmit={doLogin}>
              <h2>خوش آمدی</h2>
              <p>برای ادامه وارد حساب خودت شو.</p>

              <label className="field">
                ایمیل
                <span className="field-input">
                  <Icon name="mail" />
                  <input
                    type="email"
                    value={login.email}
                    onChange={(e) => setLogin({ ...login, email: e.target.value })}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                  />
                </span>
              </label>

              <label className="field">
                رمز عبور
                <span className="field-input">
                  <Icon name="lock" />
                  <input
                    type="password"
                    value={login.password}
                    onChange={(e) => setLogin({ ...login, password: e.target.value })}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </span>
              </label>

              <Button type="submit" className="btn-primary btn-full" disabled={busy}>
                {busy ? "در حال بررسی..." : "ورود به حساب"}
                <Icon name="chevron" />
              </Button>

              <p className="form-hint">حساب نداری؟ از تب بالا ثبت‌نام کن.</p>
            </form>
          ) : (
            <form className="form" onSubmit={doRegister}>
              <h2>ساخت حساب</h2>
              <p>چهار قدم کوتاه تا ورود به خزانه.</p>

              <label className="field">
                نام کاربری
                <span className="field-input">
                  <Icon name="user" />
                  <input
                    value={reg.username}
                    onChange={(e) => setReg({ ...reg, username: e.target.value })}
                    placeholder="Minecraft Name"
                    autoComplete="username"
                    required
                  />
                </span>
              </label>

              <label className="field">
                ایمیل
                <span className="field-input">
                  <Icon name="mail" />
                  <input
                    type="email"
                    value={reg.email}
                    onChange={(e) => setReg({ ...reg, email: e.target.value })}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                  />
                </span>
              </label>

              <div className="form-row">
                <label className="field">
                  رمز عبور
                  <span className="field-input">
                    <Icon name="lock" />
                    <input
                      type="password"
                      value={reg.password}
                      onChange={(e) => setReg({ ...reg, password: e.target.value })}
                      placeholder="حداقل ۶ کاراکتر"
                      autoComplete="new-password"
                      required
                    />
                  </span>
                  <span className={`strength s${sc}`}>
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                </label>

                <label className="field">
                  تکرار رمز
                  <span className="field-input">
                    <Icon name="lock" />
                    <input
                      type="password"
                      value={reg.confirm}
                      onChange={(e) => setReg({ ...reg, confirm: e.target.value })}
                      placeholder="تکرار رمز"
                      autoComplete="new-password"
                      required
                    />
                  </span>
                </label>
              </div>

              <Button type="submit" className="btn-primary btn-full">
                ثبت‌نام
                <Icon name="chevron" />
              </Button>

              <p className="form-hint">اطلاعات حساب فقط روی همین مرورگر ذخیره می‌شود.</p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
