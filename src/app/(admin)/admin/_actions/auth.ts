"use server";

import { redirect } from "next/navigation";
import { checkPassword, endSession, isPasswordConfigured, loginThrottle, startSession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!isPasswordConfigured()) {
    return { error: "Parol oʻrnatilmagan: .env.local faylida ADMIN_PASSWORD ni belgilang." };
  }
  const throttle = await loginThrottle();
  if (throttle.blocked) return { error: "Juda koʻp urinish. 10 daqiqadan soʻng qayta urinib koʻring." };
  const password = String(form.get("password") ?? "");
  if (!password || !checkPassword(password)) {
    throttle.fail();
    return { error: "Parol notoʻgʻri" };
  }
  throttle.reset();
  await startSession();
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}
