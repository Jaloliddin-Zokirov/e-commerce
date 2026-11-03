import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { kvGet, kvSet } from "./repo/settings";

const COOKIE = "pd_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function secret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  let stored = kvGet("auth.secret");
  if (!stored) {
    stored = crypto.randomBytes(32).toString("hex");
    kvSet("auth.secret", stored);
  }
  return stored;
}

/** Bumped on every password change so older sessions stop working. */
function sessionVersion(): string {
  return kvGet("auth.version") ?? "1";
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function checkPassword(password: string): boolean {
  const stored = kvGet("auth.hash");
  if (stored) {
    const [, saltHex, hashHex] = stored.split("$");
    if (!saltHex || !hashHex) return false;
    const hash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
    return safeEqual(hash, Buffer.from(hashHex, "hex"));
  }
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envPassword) return false;
  const a = crypto.createHash("sha256").update(password).digest();
  const b = crypto.createHash("sha256").update(envPassword).digest();
  return safeEqual(a, b);
}

export function isPasswordConfigured(): boolean {
  return Boolean(kvGet("auth.hash") || process.env.ADMIN_PASSWORD);
}

export function setPassword(password: string): void {
  kvSet("auth.hash", hashPassword(password));
  kvSet("auth.version", String(Number(sessionVersion()) + 1));
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function createToken(): string {
  const payload = `${Date.now() + MAX_AGE_SECONDS * 1000}.${sessionVersion()}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, version, signature] = parts;
  if (!(Number(exp) > Date.now()) || version !== sessionVersion()) return false;
  return safeEqual(Buffer.from(signature), Buffer.from(sign(`${exp}.${version}`)));
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

/** Use at the top of every admin page, action and route handler. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function startSession(): Promise<void> {
  const h = await headers();
  const store = await cookies();
  store.set(COOKIE, createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: h.get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

const attempts = new Map<string, { count: number; until: number }>();

/** In-memory brute-force guard: 8 failed logins lock the IP for 10 minutes. */
export async function loginThrottle() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const now = Date.now();
  const entry = attempts.get(ip);
  return {
    blocked: Boolean(entry && entry.count >= 8 && entry.until > now),
    fail() {
      const current = attempts.get(ip);
      const fresh = !current || current.until < now;
      attempts.set(ip, { count: fresh ? 1 : current.count + 1, until: now + 10 * 60 * 1000 });
    },
    reset() {
      attempts.delete(ip);
    },
  };
}
