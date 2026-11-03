import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import { isAdmin, isPasswordConfigured } from "@/lib/auth";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-[400px] rounded-[28px] bg-white p-8 shadow-lift">
        <Logo className="h-8 w-auto" />
        <h1 className="mt-6 text-[24px] font-semibold tracking-[-0.02em]">Admin panelga kirish</h1>
        <p className="mt-1 text-[14px] text-muted">Mahsulotlar, narxlar va sozlamalarni boshqarish</p>
        {!isPasswordConfigured() && (
          <p className="mt-4 rounded-2xl bg-warn-soft px-4 py-3 text-[13px] text-warn">
            Parol hali oʻrnatilmagan. Server papkasidagi <code>.env.local</code> fayliga <code>ADMIN_PASSWORD=...</code> qoʻshing va serverni qayta ishga tushiring.
          </p>
        )}
        <LoginForm next={next ?? ""} />
      </div>
    </div>
  );
}
