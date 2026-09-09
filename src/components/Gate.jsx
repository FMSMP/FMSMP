import { Icon } from "./Icon.jsx";
import { Button } from "./ui.jsx";
import { navigate } from "../lib/store.js";

/** محافظ مسیر: فقط نوع کاربر مجاز محتوا را می‌بیند. */
export default function Gate({ session, type = "user", children }) {
  const allowed = type === "owner" ? session?.type === "owner" : session?.type === "user";
  if (allowed) return children;

  return (
    <main className="subpage page-transition">
      <div className="gate glass">
        <span>
          <Icon name="shield" />
        </span>
        <h1>این بخش محافظت‌شده است</h1>
        <p>برای دسترسی به این صفحه، ابتدا با حساب مناسب وارد شوید.</p>
        <Button className="btn-primary" onClick={() => navigate("auth")}>
          رفتن به صفحه ورود
          <Icon name="chevron" />
        </Button>
      </div>
    </main>
  );
}
