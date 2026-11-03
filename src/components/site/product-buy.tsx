"use client";

import { Check, ChevronRight, Info, MessagesSquare, Phone, Share2, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { TelegramIcon } from "@/components/brand-icons";
import { discountPercent, displayPrice, monthlyPayment, telHref } from "@/lib/format";
import { fmt, href } from "@/lib/i18n";
import { telegramChatUrl } from "@/lib/links";
import type { ImageAsset, StockStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { STOCK_TONE, type BadgeTone } from "@/lib/view";
import { FavoriteButton } from "./favorite-button";
import { Gallery } from "./gallery";
import { Money } from "./money";
import { OpenStatus } from "./open-status";
import { OrderDialog } from "./order-dialog";
import { STOCK_DOT } from "./product-card";
import { useSite } from "./site-context";

export type BuyOption = {
  id: string;
  name: string;
  kind: "color" | "text";
  values: { id: string; label: string; hex?: string }[];
};
export type BuyVariant = {
  id: string;
  values: Record<string, string>;
  price: number;
  oldPrice: number | null;
  stock: StockStatus;
};

export type BuyProps = {
  id: number;
  name: string;
  tagline: string;
  brand?: { name: string; href: string };
  sku: string;
  warranty: string;
  badges: { label: string; tone: BadgeTone }[];
  url: string;
  images: ImageAsset[];
  options: BuyOption[];
  variants: BuyVariant[];
  base: { price: number; oldPrice: number | null; stock: StockStatus };
  initialVariantId?: string;
  store: { address: string; hours: string };
};

function matches(v: BuyVariant, selection: Record<string, string>) {
  return Object.entries(selection).every(([opt, val]) => v.values[opt] === val);
}

export function ProductBuy(props: BuyProps) {
  const { dict, price: ctx, phones, telegramUser, locale } = useSite();
  const { options, variants } = props;
  const hasVariants = options.length > 0 && variants.length > 0;

  const initial = useMemo(() => {
    if (!hasVariants) return {};
    const chosen =
      variants.find((v) => v.id === props.initialVariantId) ??
      variants.find((v) => v.stock === "in_stock") ??
      variants[0];
    return { ...chosen.values };
  }, [hasVariants, variants, props.initialVariantId]);

  const [selection, setSelection] = useState<Record<string, string>>(initial);
  const [copied, setCopied] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const closeOrder = useCallback(() => setOrdering(false), []);

  const current = hasVariants ? variants.find((v) => matches(v, selection)) : undefined;
  const offer = current ?? (hasVariants ? null : props.base);

  const pick = (optionId: string, valueId: string) => {
    const wanted = { ...selection, [optionId]: valueId };
    let next = variants.find((v) => matches(v, wanted));
    if (!next) {
      // Keep as many of the other choices as possible, preferring stock.
      const candidates = variants.filter((v) => v.values[optionId] === valueId);
      next = candidates
        .map((v) => ({
          v,
          score:
            Object.entries(selection).filter(([o, val]) => o !== optionId && v.values[o] === val).length * 2 +
            (v.stock === "in_stock" ? 1 : 0),
        }))
        .sort((a, b) => b.score - a.score)[0]?.v;
    }
    if (!next) return;
    setSelection({ ...next.values });
    const url = new URL(window.location.href);
    url.searchParams.set("v", next.id);
    window.history.replaceState(window.history.state, "", url);
  };

  const variantText = options
    .map((o) => o.values.find((v) => v.id === selection[o.id])?.label)
    .filter(Boolean)
    .join(" · ");

  const colorOpt = options.find((o) => o.kind === "color");
  const selectedColor = colorOpt ? selection[colorOpt.id] : undefined;
  const tint = colorOpt?.values.find((v) => v.id === selectedColor)?.hex ?? null;
  const galleryImages = useMemo(() => {
    if (!selectedColor) return props.images;
    const own = props.images.filter((img) => img.color === selectedColor);
    if (own.length === 0) return props.images.filter((img) => !img.color);
    return [...own, ...props.images.filter((img) => !img.color)];
  }, [props.images, selectedColor]);

  const pct = offer ? discountPercent(offer.price, offer.oldPrice) : 0;
  const shown = offer && offer.price > 0 ? displayPrice(offer.price, ctx) : null;
  const old = offer && pct > 0 && offer.oldPrice ? displayPrice(offer.oldPrice, ctx) : null;
  const saving = offer && pct > 0 && offer.oldPrice ? displayPrice(offer.oldPrice - offer.price, ctx) : null;
  const monthly = offer ? monthlyPayment(offer.price, ctx) : null;
  const stock: StockStatus = offer?.stock ?? "out_of_stock";

  const fullName = variantText ? `${props.name} (${variantText})` : props.name;
  const pageUrl = current ? `${props.url}?v=${current.id}` : props.url;
  const tgLink = telegramUser
    ? telegramChatUrl(telegramUser, fmt(dict.product.telegramMessage, { product: fullName, url: pageUrl }))
    : null;
  const phone = phones[0];
  const orderProduct = {
    id: props.id,
    name: props.name,
    variant: variantText || undefined,
    price: shown?.main,
    image: galleryImages[0] ?? null,
    tint,
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: fullName, url: pageUrl });
        return;
      }
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed.
    }
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-12">
        <div className="lg:sticky lg:top-[132px] lg:self-start">
          <Gallery
            // A different color brings a different photo set: start again from its first photo.
            key={selectedColor ?? "all"}
            images={galleryImages}
            alt={props.name}
            overlay={
              pct > 0 ? (
                <span className="pointer-events-none absolute left-4 top-4 inline-flex h-7 items-center rounded-md bg-sale px-2.5 text-[13px] font-semibold text-white sm:left-5 sm:top-5">
                  −{pct}%
                </span>
              ) : null
            }
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {(props.badges.length > 0 || props.brand) && (
                <p className="flex flex-wrap items-center gap-x-2 text-[12px] font-semibold uppercase tracking-[0.06em]">
                  {props.badges.length > 0 && <span className="text-new">{props.badges.map((b) => b.label).join(" · ")}</span>}
                  {props.brand && (
                    <Link href={props.brand.href} className="text-muted transition hover:text-ink">
                      {props.brand.name}
                    </Link>
                  )}
                </p>
              )}
              <h1 className="mt-2 text-balance text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[34px] lg:text-[40px]">
                {props.name}
              </h1>
              {props.tagline && <p className="mt-2 text-[17px] leading-snug text-ink-2 sm:text-[19px]">{props.tagline}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              <FavoriteButton id={props.id} size="lg" />
              <button
                type="button"
                onClick={share}
                aria-label={dict.common.share}
                title={copied ? dict.common.linkCopied : dict.common.share}
                className="grid size-12 place-items-center rounded-full bg-white shadow-tile transition hover:shadow-tile-hover"
              >
                {copied ? <Check className="size-5 text-ok" /> : <Share2 className="size-5" />}
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-[18px] bg-white p-5 shadow-tile sm:p-6">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              {shown ? (
                <Money
                  value={shown.main}
                  locale={locale}
                  className={cn("text-[30px] font-semibold leading-none tracking-[-0.022em] sm:text-[34px]", old ? "text-sale" : "text-ink")}
                  unitClassName="text-[17px] font-medium sm:text-[19px]"
                />
              ) : (
                <div className="text-[22px] font-semibold text-accent">
                  {hasVariants && !current ? dict.product.unavailable : dict.price.onRequest}
                </div>
              )}
              {old && <div className="pb-0.5 text-[17px] text-subtle line-through decoration-2 tabular">{old.main}</div>}
            </div>
            {(saving || shown?.alt || monthly) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {saving && (
                  <span className="inline-flex h-7 items-center rounded-md bg-sale-soft px-2.5 text-[13px] font-semibold text-sale tabular">
                    {fmt(dict.price.save, { amount: saving.main })}
                  </span>
                )}
                {shown?.alt && <span className="text-[14px] text-muted tabular">{fmt(dict.price.approx, { amount: shown.alt })}</span>}
                {monthly && (
                  <span className="inline-flex h-7 items-center rounded-md bg-canvas px-2.5 text-[13px] font-medium tabular">
                    {fmt(dict.price.installment, { amount: monthly })}
                  </span>
                )}
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 text-[14px] font-medium">
              <span className={cn("size-2 rounded-full", STOCK_DOT[STOCK_TONE[stock]])} />
              <span className={stock === "in_stock" ? "text-ok" : stock === "out_of_stock" ? "text-muted" : "text-warn"}>
                {dict.stock[stock]}
              </span>
              {props.sku && (
                <span className="ml-auto text-[13px] font-normal text-subtle">
                  {dict.product.sku}: {props.sku}
                </span>
              )}
            </div>

            {options.map((opt) => {
              const selected = opt.values.find((v) => v.id === selection[opt.id]);
              return (
                <div key={opt.id} className="mt-6">
                  <div className="text-[14px] text-muted">
                    {opt.name}
                    {selected && <span className="font-semibold text-ink">: {selected.label}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {opt.values.map((val) => {
                      const isSelected = selection[opt.id] === val.id;
                      const exists = variants.some(
                        (v) =>
                          v.values[opt.id] === val.id &&
                          Object.entries(selection).every(([o, sv]) => o === opt.id || v.values[o] === sv),
                      );
                      const any = variants.some((v) => v.values[opt.id] === val.id);
                      if (!any) return null;
                      return opt.kind === "color" ? (
                        <button
                          key={val.id}
                          type="button"
                          onClick={() => pick(opt.id, val.id)}
                          aria-pressed={isSelected}
                          aria-label={val.label}
                          title={val.label}
                          className={cn(
                            "grid size-12 place-items-center rounded-full border-2 bg-white transition",
                            isSelected ? "border-ink" : "border-transparent hover:border-line-2",
                            !exists && "opacity-40",
                          )}
                        >
                          <span
                            className="size-9 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]"
                            style={{ backgroundColor: val.hex ?? "#ccc" }}
                          />
                        </button>
                      ) : (
                        <button
                          key={val.id}
                          type="button"
                          onClick={() => pick(opt.id, val.id)}
                          aria-pressed={isSelected}
                          className={cn(
                            "min-h-12 rounded-xl border-2 bg-white px-4 text-[15px] font-medium transition",
                            isSelected ? "border-ink text-ink" : "border-line text-ink-2 hover:border-line-2",
                            !exists && "text-subtle line-through decoration-1",
                          )}
                        >
                          {val.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mt-7 grid gap-2.5">
              <button type="button" onClick={() => setOrdering(true)} className="btn btn-primary btn-lg w-full text-[17px]">
                {dict.order.button}
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                {tgLink ? (
                  <a href={tgLink} target="_blank" rel="noopener" className="btn btn-outline w-full px-3">
                    <TelegramIcon className="size-[18px] shrink-0 text-telegram" />
                    Telegram
                  </a>
                ) : null}
                {phone && (
                  <a href={telHref(phone)} className={cn("btn btn-outline w-full px-3", !tgLink && "col-span-2")}>
                    <Phone className="size-[18px] shrink-0" />
                    {dict.common.call}
                  </a>
                )}
              </div>
            </div>
            <p className="mt-4 flex gap-2.5 rounded-xl bg-canvas px-4 py-3 text-[13px] leading-relaxed text-muted">
              <Info className="mt-0.5 size-4 shrink-0" />
              {dict.order.note}
            </p>
          </div>

          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[18px] bg-white shadow-tile">
            <li className="flex items-start gap-3.5 px-5 py-4">
              <ShieldCheck className="mt-0.5 size-6 shrink-0 text-ok" strokeWidth={1.7} />
              <span className="min-w-0 text-[14px] leading-snug">
                <span className="block font-semibold text-ink">{dict.product.perks.official}</span>
                {props.warranty && <span className="mt-0.5 block text-muted">{props.warranty}</span>}
              </span>
            </li>
            <li>
              <Link href={href(locale, "/contacts")} className="group flex items-start gap-3.5 px-5 py-4 transition hover:bg-[#fbfbfd]">
                <Store className="mt-0.5 size-6 shrink-0 text-accent" strokeWidth={1.7} />
                <span className="min-w-0 flex-1 text-[14px] leading-snug">
                  <span className="block font-semibold text-ink">{dict.product.perks.store}</span>
                  {props.store.address && <span className="mt-0.5 block text-muted">{props.store.address}</span>}
                  {props.store.hours && <OpenStatus hours={props.store.hours} className="mt-2 px-2.5 py-0.5 text-[12px]" />}
                </span>
                <ChevronRight className="mt-0.5 size-5 shrink-0 text-subtle transition group-hover:translate-x-0.5" />
              </Link>
            </li>
            <li className="flex items-start gap-3.5 px-5 py-4">
              <MessagesSquare className="mt-0.5 size-6 shrink-0 text-new" strokeWidth={1.7} />
              <span className="min-w-0 text-[14px] font-semibold leading-snug text-ink">{dict.product.perks.consult}</span>
            </li>
          </ul>

          <div className="mt-4 rounded-[18px] bg-white p-5 shadow-tile sm:p-6">
            <h2 className="text-[15px] font-semibold">{dict.order.howTitle}</h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-3 sm:gap-3">
              {dict.order.steps.map((step, i) => (
                <li key={step.title} className="flex gap-3 sm:flex-col sm:gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold leading-snug">{step.title}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Phone sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            {shown ? (
              <Money
                value={shown.main}
                locale={locale}
                className={cn("block truncate text-[17px] font-semibold leading-tight tracking-[-0.015em]", old ? "text-sale" : "text-ink")}
                unitClassName="text-[13px] font-medium"
              />
            ) : (
              <div className="truncate text-[15px] font-semibold text-accent">{dict.price.onRequest}</div>
            )}
            {old && <div className="truncate text-[12px] text-subtle line-through tabular">{old.main}</div>}
          </div>
          {phone && (
            <a href={telHref(phone)} aria-label={dict.common.call} className="btn btn-outline size-12 shrink-0 p-0">
              <Phone className="size-5" />
            </a>
          )}
          <button type="button" onClick={() => setOrdering(true)} className="btn btn-primary h-12 shrink-0 px-5">
            {dict.order.short}
          </button>
        </div>
      </div>

      <OrderDialog open={ordering} onClose={closeOrder} product={orderProduct} />
    </>
  );
}
