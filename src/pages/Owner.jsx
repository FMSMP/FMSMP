import { useMemo, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Button } from "../components/ui.jsx";
import Gate from "../components/Gate.jsx";
import {
  getUsers,
  setUsers,
  getActivity,
  visitorCount,
  loginCount,
  log,
  fmtNum,
  fmtDate,
  fmtDateTime,
} from "../lib/store.js";

export default function Owner({ session, notify, onLogout }) {
  const [users, setLocalUsers] = useState(getUsers());
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState(100);

  const activity = getActivity();
  const visitors = visitorCount();
  const logins = loginCount();
  const totalShards = users.reduce((s, u) => s + (u.shards || 0), 0);

  const filtered = useMemo(
    () => users.filter((u) => `${u.username} ${u.email}`.toLowerCase().includes(query.toLowerCase())),
    [users, query]
  );

  const commit = (next, message) => {
    setUsers(next);
    setLocalUsers(next);
    log(message);
    notify("تغییرات ذخیره شد", "success");
  };

  const addShards = (user) => {
    const n = Math.max(1, Number(amount) || 1);
    const at = new Date().toISOString();
    commit(
      users.map((u) =>
        u.id === user.id
          ? {
              ...u,
              shards: (u.shards || 0) + n,
              history: [{ id: crypto.randomUUID(), amount: n, type: "مدیریت", at }, ...(u.history || [])],
            }
          : u
      ),
      `مدیریت ${fmtNum(n)} شارد به ${user.username} افزود`
    );
    setSelected(null);
  };

  const removeUser = (user) => {
    if (!confirm(`کاربر ${user.username} برای همیشه حذف شود؟`)) return;
    commit(
      users.filter((u) => u.id !== user.id),
      `کاربر ${user.username} حذف شد`
    );
  };

  const STATS = [
    { icon: "users", label: "تعداد ثبت‌نام‌ها", value: users.length },
    { icon: "eye", label: "بازدیدکنندگان یکتا", value: visitors },
    { icon: "trend", label: "ورودهای ثبت‌شده", value: logins },
    { icon: "gem", label: "کل شاردها", value: totalShards },
  ];

  return (
    <Gate session={session} type="owner">
      <main className="subpage page-transition">
        <div className="page-top">
          <div>
            <span className="micro-label">فرماندهی FMSMP</span>
            <h1>پنل مدیریت</h1>
          </div>
          <Button className="btn-danger btn-sm" onClick={onLogout}>
            <Icon name="logout" />
            خروج
          </Button>
        </div>

        <div className="stats-grid">
          {STATS.map((s) => (
            <div className="stat glass" key={s.label}>
              <span>
                <Icon name={s.icon} />
              </span>
              <p>{s.label}</p>
              <strong>{fmtNum(s.value)}</strong>
            </div>
          ))}
        </div>

        <section className="admin-grid">
          <div className="admin-card glass">
            <div className="panel-head">
              <div>
                <span className="micro-label">مدیریت کاربران</span>
                <h2>ثبت‌نام‌شده‌ها</h2>
              </div>
              <label className="search">
                <Icon name="search" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجوی نام یا ایمیل..."
                />
              </label>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>کاربر</th>
                    <th>ایمیل</th>
                    <th>عضویت</th>
                    <th>ورودها</th>
                    <th>آخرین ورود</th>
                    <th>شارد</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <b>{u.username}</b>
                      </td>
                      <td style={{ direction: "ltr", textAlign: "right" }}>{u.email}</td>
                      <td>{fmtDate(u.joinedAt)}</td>
                      <td>{fmtNum(u.loginCount || 0)}</td>
                      <td>{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : "هنوز وارد نشده"}</td>
                      <td>
                        <span className="pill-shard">
                          <Icon name="gem" />
                          {fmtNum(u.shards || 0)}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => {
                              setSelected(u);
                              setAmount(100);
                            }}
                            aria-label="جزئیات و افزودن شارد"
                            title="جزئیات / افزودن شارد"
                          >
                            <Icon name="plus" />
                          </button>
                          <button
                            className="danger"
                            onClick={() => removeUser(u)}
                            aria-label="حذف کاربر"
                            title="حذف کاربر"
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!filtered.length && <div className="empty">کاربری پیدا نشد.</div>}
          </div>

          <div className="admin-card glass">
            <div className="panel-head">
              <div>
                <span className="micro-label">ردپای سیستم</span>
                <h2>آخرین فعالیت‌ها</h2>
              </div>
            </div>
            <div className="feed">
              {activity.length ? (
                activity.slice(0, 40).map((a) => (
                  <div className="feed-item" key={a.id}>
                    <span />
                    <p>
                      {a.text}
                      <small>{fmtDateTime(a.at)}</small>
                    </p>
                  </div>
                ))
              ) : (
                <p className="empty">لاگی ثبت نشده است.</p>
              )}
            </div>
          </div>
        </section>

        <section className="admin-card glass" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <div>
              <span className="micro-label">ثبت‌نام‌ها</span>
              <h2>فهرست کامل کاربران</h2>
            </div>
            <span className="count-chip">{fmtNum(users.length)} کاربر</span>
          </div>
          <div className="feed">
            {users.length ? (
              users
                .slice()
                .sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt))
                .map((u) => (
                  <div className="feed-item gold" key={u.id}>
                    <span />
                    <p>
                      <b>{u.username}</b> با ایمیل <b>{u.email}</b> در تاریخ <b>{fmtDateTime(u.joinedAt)}</b>{" "}
                      ثبت‌نام کرد
                      <small>
                        تعداد ورود: {fmtNum(u.loginCount || 0)} · موجودی: {fmtNum(u.shards || 0)} شارد
                      </small>
                    </p>
                  </div>
                ))
            ) : (
              <p className="empty">هنوز کاربری ثبت‌نام نکرده است.</p>
            )}
          </div>
        </section>

        {selected && (
          <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
            <div className="modal glass" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <button className="modal-close" onClick={() => setSelected(null)} aria-label="بستن">
                <Icon name="close" />
              </button>
              <div className="avatar sm">{selected.username.charAt(0).toUpperCase()}</div>
              <h2>{selected.username}</h2>
              <p>{selected.email}</p>

              <div className="detail-grid">
                <div>
                  <span>موجودی شارد</span>
                  <b>{fmtNum(selected.shards || 0)}</b>
                </div>
                <div>
                  <span>تاریخ عضویت</span>
                  <b>{fmtDate(selected.joinedAt)}</b>
                </div>
                <div>
                  <span>تعداد ورود</span>
                  <b>{fmtNum(selected.loginCount || 0)}</b>
                </div>
                <div>
                  <span>آخرین ورود</span>
                  <b>{selected.lastLoginAt ? fmtDate(selected.lastLoginAt) : "هنوز وارد نشده"}</b>
                </div>
              </div>

              <label className="field">
                افزودن شارد
                <span className="field-input">
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ padding: "0 14px" }}
                  />
                </span>
              </label>

              <Button className="btn-primary btn-full" onClick={() => addShards(selected)}>
                <Icon name="plus" />
                افزودن به موجودی
              </Button>
            </div>
          </div>
        )}
      </main>
    </Gate>
  );
}
