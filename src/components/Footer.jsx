import { Icon } from "./Icon.jsx";
import { SITE } from "../data/site.js";
import { navigate, copyText } from "../lib/store.js";

export default function Footer({ notify }) {
  const jump = (id) => {
    if (location.hash.replace("#", "").split("?")[0] !== "home") navigate(`home?section=${id}`);
    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const copyIp = async () => {
    const ok = await copyText(SITE.ip);
    notify?.(ok ? "آی‌پی سرور کپی شد" : `کپی خودکار مسدود است — IP: ${SITE.ip}`, ok ? "success" : "error");
  };

  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-col">
          <button className="brand" onClick={() => navigate("home")}>
            <span className="brand-gem">◆</span>
            <span>{SITE.name}</span>
          </button>
          <p style={{ marginTop: 12 }}>
            سرور ماینکرفت فارسی با محوریت صنعت اسلایم‌فان، اقتصاد پویا و چت صوتی زنده. قلمرویی که با تصمیم‌های تو
            ساخته می‌شود.
          </p>
          <div className="footer-ip">
            <code>{SITE.ip}</code>
            <button className="icon-btn" onClick={copyIp} aria-label="کپی آی‌پی">
              <Icon name="copy" />
            </button>
          </div>
        </div>

        <div className="footer-col">
          <h4>پیمایش</h4>
          <ul>
            <li>
              <button onClick={() => jump("about")}>درباره سرور</button>
            </li>
            <li>
              <button onClick={() => jump("ranks")}>رنک‌ها</button>
            </li>
            <li>
              <button onClick={() => jump("shards")}>بسته‌های شارد</button>
            </li>
            <li>
              <button onClick={() => jump("join")}>نحوه اتصال</button>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>پشتیبانی</h4>
          <ul>
            <li>
              <button onClick={() => jump("rules")}>قوانین سرور</button>
            </li>
            <li>
              <button onClick={() => jump("faq")}>سوالات پرتکرار</button>
            </li>
            <li>
              <a href={SITE.discord} target="_blank" rel="noreferrer">
                تیکت پشتیبانی
              </a>
            </li>
            <li>
              <button onClick={() => navigate("auth")}>ورود / ثبت‌نام</button>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>به جامعه بپیوند</h4>
          <p style={{ marginBottom: 14 }}>
            آخرین خبرها، ایونت‌ها و پشتیبانی رسمی فقط از طریق سرور دیسکورد ما اعلام می‌شود.
          </p>
          <a className="discord-btn" href={SITE.discord} target="_blank" rel="noreferrer">
            <Icon name="discord" />
            <span>ورود به دیسکورد</span>
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {SITE.year} {SITE.name} — تمامی حقوق محفوظ است.
        </span>
        <span>
          ساخته‌شده با <em>♥</em> برای جامعه ماینکرفت فارسی · {SITE.edition} {SITE.version}
        </span>
      </div>
    </footer>
  );
}
