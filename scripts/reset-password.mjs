// Resets the admin password to ADMIN_PASSWORD from .env (for when a password changed in the panel is forgotten).
import Database from "better-sqlite3";
import path from "node:path";

const dir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const db = new Database(path.join(dir, "store.db"));
db.prepare("DELETE FROM kv WHERE key = 'auth.hash'").run();
const row = db.prepare("SELECT value FROM kv WHERE key = 'auth.version'").get();
db.prepare("INSERT OR REPLACE INTO kv (key, value) VALUES ('auth.version', ?)").run(String(Number(row?.value ?? 1) + 1));
console.log("Done: sign in with ADMIN_PASSWORD from your .env file. All old sessions were signed out.");
