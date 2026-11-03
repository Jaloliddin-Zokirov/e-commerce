import Link from "next/link";
import { ArrowRight, BadgePercent, Eye, Inbox, Package, PackageX, Plus, Sparkles, TrendingUp } from "lucide-react";
import { Img } from "@/components/img";
import { StatusPill } from "@/components/admin/ui";
import { displayPrice, formatDateTime, priceCtx } from "@/lib/format";
import { listLeads } from "@/lib/repo/leads";
import { productStats, queryProducts } from "@/lib/repo/products";
import { getSettings } from "@/lib/repo/settings";

export default function DashboardPage() {
  const stats = productStats();
  const settings = getSettings();
  const ctx = priceCtx(settings, "uz");
  const leads = listLeads({ limit: 6 });
  const newLeads = leads.items.filter((l) => l.status === "new").length;
  const recent = queryProducts({ includeDrafts: true, sort: "new", limit: 6 }).items;
  const popular = queryProducts({ limit: 500 })
    .items.sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const cards = [
    { label: "Saytdagi mahsulotlar", value: stats.published ?? 0, sub: `${stats.drafts ?? 0} ta qoralama`, icon: Package, href: "/admin/products" },
    { label: "Chegirmada", value: stats.onSale ?? 0, sub: "eski narxi chizilgan", icon: BadgePercent, href: "/admin/products?filter=sale" },
    { label: "Sotuvda yoʻq", value: stats.outOfStock ?? 0, sub: "mavjud boʻlmaganlar", icon: PackageX, href: "/admin/products?filter=out" },
    { label: "Yangi soʻrovlar", value: newLeads, sub: "buyurtma va qoʻngʻiroqlar", icon: Inbox, href: "/admin/leads" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Xush kelibsiz 👋</h1>
          <p className="mt-1 text-[14px] text-muted">Doʻkoningiz holati bir qarashda</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/new" className="btn btn-primary">
            <Plus className="size-[18px]" /> Yangi mahsulot
          </Link>
          <a href="/uz" target="_blank" className="btn btn-outline">
            <Eye className="size-[18px]" /> Saytni koʻrish
          </a>
        </div>
      </div>

      {(stats.demo ?? 0) > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-[22px] bg-gradient-to-r from-[#fff4e5] to-[#fdecec] p-5">
          <Sparkles className="size-6 shrink-0 text-new" />
          <div className="min-w-0 flex-1 text-[14px] leading-relaxed">
            <b>Saytda {stats.demo} ta demo mahsulot bor.</b> Ular dizaynni koʻrsatish uchun qoʻshilgan. Oʻz mahsulotlaringizni qoʻshgach,
            demolarni <b>Sozlamalar → Maʼlumotlar</b> boʻlimida bir tugma bilan oʻchirishingiz mumkin.
          </div>
          <Link href="/admin/settings#data" className="btn btn-sm btn-outline">
            Sozlamalarga oʻtish
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, sub, icon: Icon, href }) => (
          <Link key={label} href={href} className="group rounded-[22px] bg-white p-5 shadow-card transition hover:shadow-lift">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted">{label}</span>
              <Icon className="size-5 text-subtle transition group-hover:text-ink" />
            </div>
            <div className="mt-3 text-[34px] font-bold leading-none tracking-[-0.03em] tabular">{value}</div>
            <div className="mt-2 text-[12.5px] text-muted">{sub}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className="rounded-[22px] bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold">Soʻnggi soʻrovlar</h2>
            <Link href="/admin/leads" className="inline-flex items-center gap-1 text-[13.5px] font-medium text-accent">
              Barchasi <ArrowRight className="size-4" />
            </Link>
          </div>
          {leads.items.length === 0 ? (
            <p className="rounded-2xl bg-canvas px-4 py-8 text-center text-[13.5px] text-muted">
              Hozircha soʻrov yoʻq. Mijoz saytda «Qayta qoʻngʻiroq» tugmasini bossa, shu yerda paydo boʻladi.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {leads.items.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[14px] font-semibold">
                      {l.kind === "order" ? "🛒 Buyurtma" : l.name || "Qayta qoʻngʻiroq"}
                      {l.status === "new" && <StatusPill tone="sale">Yangi</StatusPill>}
                    </div>
                    <div className="truncate text-[13px] text-muted">
                      {l.productName || "Umumiy savol"} · {formatDateTime(l.createdAt)}
                    </div>
                  </div>
                  <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} className="shrink-0 text-[14px] font-semibold text-accent tabular">
                    {l.phone}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[22px] bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold">Oxirgi qoʻshilganlar</h2>
            <Link href="/admin/products" className="inline-flex items-center gap-1 text-[13.5px] font-medium text-accent">
              Barchasi <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {recent.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                  <span className="size-11 shrink-0 overflow-hidden rounded-xl bg-canvas">
                    {p.images[0] && <Img asset={p.images[0]} alt="" width={320} sizes="44px" className="size-full object-contain p-1" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{p.name.uz}</span>
                    <span className="block text-[12.5px] text-muted tabular">
                      {p.minPrice > 0 ? displayPrice(p.minPrice, ctx).main : "Narxini soʻrang"}
                    </span>
                  </span>
                  {p.status === "draft" ? <StatusPill tone="muted">Qoralama</StatusPill> : <StatusPill tone="ok">Saytda</StatusPill>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-[22px] bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[17px] font-semibold">
            <TrendingUp className="size-5 text-ok" /> Eng koʻp koʻrilganlar
          </h2>
          <ul className="space-y-2">
            {popular.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 text-[14px]">
                <span className="grid size-7 place-items-center rounded-full bg-canvas text-[12px] font-bold tabular">{i + 1}</span>
                <Link href={`/admin/products/${p.id}`} className="min-w-0 flex-1 truncate hover:text-accent">
                  {p.name.uz}
                </Link>
                <span className="text-[13px] text-muted tabular">{p.views} marta</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[22px] bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-[17px] font-semibold">Valyuta kursi</h2>
          <p className="mt-1 text-[13.5px] text-muted">
            Narxlar {settings.currency.base === "USD" ? "dollarda" : "soʻmda"} kiritiladi, saytda{" "}
            {settings.currency.display === "USD" ? "dollarda" : settings.currency.display === "both" ? "soʻm va dollarda" : "soʻmda"} koʻrsatiladi.
          </p>
          <div className="mt-4 flex items-end justify-between gap-3 rounded-2xl bg-canvas px-4 py-4">
            <div>
              <div className="text-[12.5px] text-muted">1 $ =</div>
              <div className="text-[28px] font-bold tracking-[-0.02em] tabular">{settings.currency.rate.toLocaleString("ru-RU")} soʻm</div>
            </div>
            <Link href="/admin/settings#currency" className="btn btn-sm btn-primary">
              Yangilash
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
