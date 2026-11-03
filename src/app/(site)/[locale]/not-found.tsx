"use client";

import Link from "next/link";
import { href } from "@/lib/i18n";
import { useSite } from "@/components/site/site-context";

export default function NotFound() {
  const { dict, locale } = useSite();
  return (
    <div className="container-page flex flex-col items-center py-20 text-center lg:py-28">
      <div className="text-[88px] font-bold leading-none tracking-[-0.05em] text-line-2 sm:text-[120px]">404</div>
      <h1 className="mt-4 text-[26px] font-semibold tracking-[-0.03em]">{dict.notFound.title}</h1>
      <p className="mt-2 max-w-md text-[15px] text-muted">{dict.notFound.text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={href(locale)} className="btn btn-primary">
          {dict.notFound.home}
        </Link>
        <Link href={href(locale, "/catalog")} className="btn btn-outline">
          {dict.notFound.catalog}
        </Link>
      </div>
    </div>
  );
}
