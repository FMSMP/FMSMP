// ─────────────────────────────────────────────────────────────
//  کلاینت RCON ماینکرفت (بدون وابستگی خارجی)
//  پروتکل: https://wiki.vg/RCON
// ─────────────────────────────────────────────────────────────
import net from "node:net";

const TYPE_AUTH = 3;
const TYPE_COMMAND = 2;

function encode(id, type, body) {
  const payload = Buffer.from(body, "utf8");
  const buf = Buffer.alloc(14 + payload.length);
  buf.writeInt32LE(10 + payload.length, 0); // length
  buf.writeInt32LE(id, 4);
  buf.writeInt32LE(type, 8);
  payload.copy(buf, 12);
  buf.writeInt16LE(0, 12 + payload.length); // دو بایت پایانی
  return buf;
}

/**
 * یک یا چند دستور را روی سرور ماینکرفت اجرا می‌کند.
 * @returns {Promise<string[]>} پاسخ هر دستور
 */
export function rconExec(
  { host, port = 25575, password, timeout = 10000 },
  commands
) {
  const list = Array.isArray(commands) ? commands : [commands];

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(timeout);

    let buffer = Buffer.alloc(0);
    let authed = false;
    let index = 0;
    const results = [];
    let settled = false;

    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      err ? reject(err) : resolve(value);
    };

    socket.on("connect", () => socket.write(encode(0, TYPE_AUTH, password)));

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      // ممکن است چند پکت در یک chunk بیاید
      while (buffer.length >= 12) {
        const len = buffer.readInt32LE(0);
        if (buffer.length < len + 4) break;

        const id = buffer.readInt32LE(4);
        const body = buffer.slice(12, len + 2).toString("utf8");
        buffer = buffer.slice(len + 4);

        if (!authed) {
          // requestId === -1 یعنی رمز RCON اشتباه است
          if (id === -1) return finish(new Error("RCON: رمز عبور اشتباه است"));
          authed = true;
          socket.write(encode(1, TYPE_COMMAND, list[0]));
          continue;
        }

        results.push(body);
        index++;

        if (index >= list.length) return finish(null, results);
        socket.write(encode(index + 1, TYPE_COMMAND, list[index]));
      }
    });

    socket.on("timeout", () => finish(new Error("RCON: پایان مهلت اتصال")));
    socket.on("error", (e) => finish(new Error(`RCON: ${e.message}`)));
    socket.on("close", () => {
      if (!settled) finish(new Error("RCON: اتصال پیش از تکمیل بسته شد"));
    });
  });
}
