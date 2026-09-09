import { useEffect, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Button, DiscordLink, SectionHead, Counter, useReveal, useSpotlight } from "../components/ui.jsx";
import { SITE, FEATURES, RANKS, SHARDS, STEPS, RULES, FAQ, HERO_STATS } from "../data/site.js";
import { copyText, fmtNum, navigate } from "../lib/store.js";
import { useServerStatus } from "../lib/useStatus.js";
import heroBg from "../assets/hero.jpg";

const STATUS_TEXT = {
  loading: "در حال بررسی وضعیت سرور…",
  online: "سرور آنلاین است",
  offline: "سرور موقتاً آفلاین است",
  unknown: "وضعیت سرور در دسترس نیست",
};

export default function Home({ notify }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [copied, setCopied] = useState(false);
  const spotlight = useSpotlight();
  const status = useServerStatus();

  useReveal([]);

  useEffect(() => {
    const q = new URLSearchParams(location.hash.split("?")[1]).get("section");
    if (q) setTimeout(() => document.getElementById(q)?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  const copyIp = async () => {
    const ok = await copyText(SITE.ip);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
    notify(ok ? "آی‌پی سرور کپی شد — موفق باشی!" : `کپی خودکار مسدود است — IP: ${SITE.ip}`, ok ? "success" : "error");
  };

  return (
    <main id="main">
      {/* ══ هیرو ══ */}
      <section className="hero" id="home">
        <div className="hero-bg" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="hero-inner">
          <span className={`hero-pill status-${status.state}`}>
            <i className="live-dot" />
            {STATUS_TEXT[status.state]}
            {status.state === "online" && (
              <b>
                · {fmtNum(status.players)} بازیکن آنلاین
              </b>
            )}
          </span>

          <h1>
            <span>{SITE.name}</span>
          </h1>

          <p className="hero-sub">
            قلمرو <b>صنعت</b>، <b>اقتصاد</b> و <b>رقابت</b>. ماشین‌های اسلایم‌فان بساز، امپراتوری اقتصادی راه بینداز
            و با چت صوتی زنده کنار بازیکنان واقعی ماجراجویی کن.
          </p>

          <div className="hero-actions">
            <Button className="btn-primary btn-lg" onClick={copyIp}>
              <Icon name={copied ? "check" : "copy"} />
              {copied ? "کپی شد!" : "کپی آی‌پی سرور"}
            </Button>
            <DiscordLink className="btn btn-ghost btn-lg">
              <Icon name="discord" />
              ورود به دیسکورد
            </DiscordLink>
          </div>

          <div className="ip-card">
            <div>
              <small>Server Address</small>
              <code>{SITE.ip}</code>
            </div>
            <button className="icon-btn" onClick={copyIp} aria-label="کپی آی‌پی سرور">
              <Icon name={copied ? "check" : "copy"} />
            </button>
          </div>

          <div className="hero-stats">
            <div className={`hero-stat live status-${status.state}`}>
              <Icon name="users" />
              <span>بازیکنان آنلاین</span>
              <b>
                {status.state === "online"
                  ? `${fmtNum(status.players)}${status.max ? ` / ${fmtNum(status.max)}` : ""}`
                  : status.state === "loading"
                    ? "…"
                    : "—"}
              </b>
            </div>
            {HERO_STATS.map((s) => (
              <div className="hero-stat" key={s.label}>
                <Icon name={s.icon} />
                <span>{s.label}</span>
                <b>{s.value}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="scroll-cue">
          <span>اسکرول</span>
          <Icon name="down" />
        </div>
      </section>

      {/* ══ نوار متحرک ══ */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((dup) =>
            [
              ["gear", "SLIMEFUN INDUSTRY"],
              ["coin", "DYNAMIC ECONOMY"],
              ["voice", "PROXIMITY VOICE CHAT"],
              ["sword", "SURVIVAL & PVP"],
              ["cube", "JAVA 1.21.x"],
              ["discord", "DISCORD COMMUNITY"],
              ["star", "PERSIAN SERVER"],
            ].map(([icon, text]) => (
              <span key={`${dup}-${text}`}>
                <Icon name={icon} />
                <b>{text}</b>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══ درباره ══ */}
      <section className="section" id="about">
        <div className="section-inner">
          <div className="about-panel glass reveal">
            <div className="about-visual">
              <span className="ring" />
              <span className="ring" />
              <span className="ring" />
              <div className="cube">FM</div>
            </div>
            <div className="about-copy">
              <span className="micro-label">درباره قلمرو</span>
              <h2>
                صنعت را بساز.
                <em className="grad-text">جامعه را زندگی کن.</em>
              </h2>
              <p>
                FMSMP جایی است که سیستم‌های صنعتی اسلایم‌فان با هیجان و اقتصاد سبک DonutSMP پیوند می‌خورند. از یک
                ماشین ساده شروع کن، خط تولید بساز، بازار را در دست بگیر و جایگاهت را در جدول برترین‌ها تثبیت کن. با
                Voice Mod همان لحظه با بازیکنان نزدیک صحبت می‌کنی؛ تجربه‌ای زنده‌تر، صمیمی‌تر و واقعی‌تر.
              </p>
              <div className="tags">
                <span>SLIMEFUN</span>
                <span>DONUT SMP</span>
                <span>SIMPLE VOICE</span>
                <span>SURVIVAL</span>
              </div>
              <div className="about-metrics">
                <div>
                  <strong>
                    {status.state === "online" ? (
                      <Counter to={status.players} format={fmtNum} key={status.players} />
                    ) : (
                      "—"
                    )}
                  </strong>
                  <small>بازیکن آنلاین</small>
                </div>
                <div>
                  <strong>{status.version ? status.version.replace(/[^\d.\sx-]/gi, "").trim() || SITE.version : SITE.version}</strong>
                  <small>نسخه سرور</small>
                </div>
                <div>
                  <strong>Java</strong>
                  <small>پلتفرم بازی</small>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-grid">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className={`feature-card glass reveal ${f.accent}`}
                onMouseMove={spotlight}
              >
                <span className="feature-icon">
                  <Icon name={f.icon} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <div className="feature-tags">
                  {f.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ نحوه اتصال ══ */}
      <section className="section" id="join">
        <div className="section-inner">
          <SectionHead
            eyebrow="شروع در چهار قدم"
            title="چطور وارد سرور شویم؟"
            text="کمتر از دو دقیقه تا اولین قدم در قلمرو FMSMP."
          />
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step glass reveal" key={s.n}>
                <span className="step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ رنک‌ها ══ */}
      <section className="section" id="ranks">
        <div className="section-inner">
          <SectionHead
            eyebrow="جایگاه خودت را انتخاب کن"
            title="رنک‌های سلطنتی"
            text="قدرت بیشتر، هویت متمایزتر؛ هر رنک برای ۳۰ روز فعال می‌ماند."
          />
          <div className="rank-grid">
            {RANKS.map((r) => (
              <DiscordLink key={r.name} className={`rank-card glass reveal ${r.cls}`} onPurchase>
                {r.badge && <span className="rank-badge">{r.badge}</span>}
                <div className="rank-head">
                  <span className="rank-mark">{r.mark}</span>
                  <div>
                    <h3>{r.name}</h3>
                    <small>{r.en}</small>
                  </div>
                </div>
                <div className="rank-price">
                  <strong>{fmtNum(r.price)}</strong>
                  <span>تومان / ماهانه</span>
                </div>
                <ul>
                  {r.features.map((f) => (
                    <li key={f}>
                      <Icon name="check" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="card-cta">
                  <span>خرید و تمدید از دیسکورد</span>
                  <Icon name="chevron" />
                </div>
              </DiscordLink>
            ))}
          </div>
          <div className="notice reveal">
            <Icon name="clock" />
            <span>
              <b>توجه:</b> همه رنک‌ها ماهانه، ۳۰ روزه و غیردائمی هستند و پس از پایان اعتبار باید تمدید شوند.
            </span>
          </div>
        </div>
      </section>

      {/* ══ شارد ══ */}
      <section className="section" id="shards">
        <div className="section-inner">
          <SectionHead
            eyebrow="ارز قلمرو"
            title="بسته‌های شارد"
            text="هر شارد، یک قدم به امکانات بیشتر. قیمت هر شارد ۱٬۰۰۰ تومان است."
          />
          <div className="shard-grid">
            {SHARDS.map((s) => (
              <DiscordLink key={s.amount} className="shard-card glass reveal" onPurchase>
                {s.tag && <span className="shard-tag">{s.tag}</span>}
                <span className="shard-gem">
                  <Icon name="gem" />
                </span>
                <h3>
                  <strong>{fmtNum(s.amount)}</strong>
                  شارد
                </h3>
                <p className="shard-price">{fmtNum(s.price)} تومان</p>
                <span className="shard-unit">هر دانه ۱٬۰۰۰ تومان</span>
                <div className="card-cta">
                  <span>خرید از دیسکورد</span>
                  <Icon name="chevron" />
                </div>
              </DiscordLink>
            ))}
          </div>

          <div className="purchase-box glass reveal" style={{ marginTop: 22 }}>
            <span className="purchase-icon">
              <Icon name="shield" />
            </span>
            <div>
              <span className="micro-label">مسیر امن خرید</span>
              <h2>همه خریدها فقط از دیسکورد با تیکت</h2>
              <p>
                برای خرید رنک یا شارد وارد دیسکورد شوید و یک تیکت رسمی باز کنید. هیچ روش پرداخت دیگری از سمت FMSMP
                معتبر نیست.
              </p>
            </div>
            <DiscordLink className="btn btn-primary btn-lg" onPurchase>
              <Icon name="discord" />
              رفتن به دیسکورد
            </DiscordLink>
          </div>
        </div>
      </section>

      {/* ══ قوانین ══ */}
      <section className="section" id="rules">
        <div className="section-inner">
          <SectionHead
            eyebrow="چارچوب قلمرو"
            title="قوانین سرور"
            text="رعایت این قوانین تجربه‌ای عادلانه و لذت‌بخش برای همه می‌سازد."
          />
          <div className="rules-grid">
            {RULES.map((r) => (
              <div className="rule-card glass reveal" key={r.title}>
                <div className="rule-head">
                  <span>
                    <Icon name={r.icon} />
                  </span>
                  <h3>{r.title}</h3>
                </div>
                <ul>
                  {r.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ سوالات ══ */}
      <section className="section" id="faq">
        <div className="section-inner">
          <SectionHead eyebrow="پاسخ‌های کوتاه و روشن" title="سوالات پرتکرار" />
          <div className="faq-list">
            {FAQ.map(([q, a], i) => (
              <div className={`faq-item glass reveal ${openFaq === i ? "active" : ""}`} key={q}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                  <span>
                    <b>{fmtNum(i + 1).padStart(2, "۰")}</b>
                    {q}
                  </span>
                  <i className="faq-toggle">
                    <Icon name="down" />
                  </i>
                </button>
                <div className="faq-a">
                  <div>
                    <p>{a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA پایانی ══ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-inner">
          <div className="cta-final glass reveal">
            <span className="micro-label">آماده‌ای؟</span>
            <h2>
              قلمرو منتظر <span className="grad-text">توست</span>
            </h2>
            <p>همین حالا آی‌پی را کپی کن، وارد سرور شو و اولین ماشین صنعتی‌ات را بساز.</p>
            <div className="hero-actions">
              <Button className="btn-primary btn-lg" onClick={copyIp}>
                <Icon name={copied ? "check" : "copy"} />
                {copied ? "کپی شد!" : "کپی آی‌پی سرور"}
              </Button>
              <Button className="btn-ghost btn-lg" onClick={() => navigate("auth")}>
                <Icon name="user" />
                ساخت حساب کاربری
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
