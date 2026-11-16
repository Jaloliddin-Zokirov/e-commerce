import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../../globals.css";
import { inter } from "../../fonts";
import { ToastProvider } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin panel", template: "%s — Admin panel" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f5f5f7", width: "device-width", initialScale: 1 };

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" className={inter.variable}>
      <body className="min-h-dvh bg-canvas">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
