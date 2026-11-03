import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["uz", "ru"];
const COOKIE = "NEXT_LOCALE";

function preferredLocale(request: NextRequest): string {
  const saved = request.cookies.get(COOKIE)?.value;
  if (saved && LOCALES.includes(saved)) return saved;
  const accept = request.headers.get("accept-language")?.toLowerCase() ?? "";
  // Uzbek is the default; Russian only when the browser prefers it over Uzbek.
  const ru = accept.indexOf("ru");
  const uz = accept.indexOf("uz");
  return ru !== -1 && (uz === -1 || ru < uz) ? "ru" : "uz";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];
  if (LOCALES.includes(first)) {
    const response = NextResponse.next();
    if (request.cookies.get(COOKIE)?.value !== first) {
      response.cookies.set(COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return response;
  }
  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Storefront pages only: skip internals, admin, API, uploaded files and static assets.
  matcher: ["/((?!_next|api|admin|uploads|favicon\\.ico|icon|apple-icon|robots\\.txt|sitemap\\.xml|manifest|.*\\..*).*)"],
};
