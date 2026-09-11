import { Icon } from "../components/Icon.jsx";
import { Button, DiscordLink } from "../components/ui.jsx";
import Gate from "../components/Gate.jsx";
import { getUsers, fmtNum, fmtDateTime, navigate } from "../lib/store.js";

export default function Profile({ session, onLogout }) {
  const user = getUsers().find((u) => u.id === session?.userId);

  return (
    <Gate session={session} type="user">
      <main className="subpage page-transition">
        <div className="page-top">
          <div>
            <span className="micro-label">حساب کاربری</span>
            <h1>پروفایل من</h1>
          </div>
          <Button className="btn-ghost btn-sm" onClick={() => navigate("home")}>
            بازگشت به خانه
            <Icon name="chevron" />
          </Button>
        </div>

        <div className="profile-grid">
          <div className="profile-card glass">
            <div className="avatar">{user?.username?.charAt(0).toUpperCase() || "؟"}</div>
            <span className="micro-label">بازیکن FMSMP</span>
            {/* h2 — صفحه فقط یک h1 مجاز دارد (اسپک سئو) */}
            <h2 className="profile-name">{user?.username || "—"}</h2>
            <p>{user?.email}</p>

            <div className="balance">
              <small>موجودی شارد</small>
              <strong>
                <Icon name="gem" />
                {fmtNum(user?.shards || 0)}
              </strong>
            </div>

            <div className="profile-actions">
              <DiscordLink className="btn btn-primary btn-full" onPurchase>
                <Icon name="discord" />
                خرید شارد و رنک
              </DiscordLink>
              <Button className="btn-danger btn-full" onClick={onLogout}>
                <Icon name="logout" />
                خروج از حساب
              </Button>
            </div>
          </div>

          <div className="profile-side">
            <div className="info-card glass">
              <h2>اطلاعات حساب</h2>
              <div className="info-rows">
                <div className="info-row">
                  <span>نام کاربری</span>
                  <b>{user?.username || "—"}</b>
                </div>
                <div className="info-row">
                  <span>ایمیل</span>
                  <b style={{ direction: "ltr" }}>{user?.email || "—"}</b>
                </div>
                <div className="info-row">
                  <span>تاریخ عضویت</span>
                  <b>{fmtDateTime(user?.joinedAt)}</b>
                </div>
                <div className="info-row">
                  <span>آخرین ورود</span>
                  <b>{user?.lastLoginAt ? fmtDateTime(user.lastLoginAt) : "اولین ورود"}</b>
                </div>
                <div className="info-row">
                  <span>تعداد ورود</span>
                  <b>{fmtNum(user?.loginCount || 0)}</b>
                </div>
              </div>
            </div>

            <div className="info-card glass">
              <h2>تاریخچه شارد</h2>
              {user?.history?.length ? (
                <div className="feed">
                  {user.history.map((h) => (
                    <div className="feed-item gold" key={h.id}>
                      <span />
                      <p>
                        <b>+{fmtNum(h.amount)}</b> شارد از طریق {h.type}
                        <small>{fmtDateTime(h.at)}</small>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty" style={{ padding: "26px 0" }}>
                  هنوز تراکنشی ثبت نشده است.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </Gate>
  );
}
