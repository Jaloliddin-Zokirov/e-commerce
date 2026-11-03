// Admin parolini .env dagi ADMIN_PASSWORD ga qaytaradi (panelda o'zgartirilgan parol unutilsa).
import Database from "better-sqlite3";
import path from "node:path";

const dir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const db = new Database(path.join(dir, "store.db"));
db.prepare("DELETE FROM kv WHERE key = 'auth.hash'").run();
const row = db.prepare("SELECT value FROM kv WHERE key = 'auth.version'").get();
db.prepare("INSERT OR REPLACE INTO kv (key, value) VALUES ('auth.version', ?)").run(String(Number(row?.value ?? 1) + 1));
console.log("Tayyor: endi .env.local dagi ADMIN_PASSWORD bilan kiring. Barcha eski sessiyalar yopildi.");
