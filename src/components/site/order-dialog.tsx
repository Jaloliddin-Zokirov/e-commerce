"use client";

import { CircleCheck, LoaderCircle, ShoppingBag, X } from "lucide-react";
import { useCallback, useState } from "react";
import { submitLead } from "@/app/actions/lead";
import { TelegramIcon } from "@/components/brand-icons";
import { Img } from "@/components/img";
import { telegramChatUrl } from "@/lib/links";
import type { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Overlay } from "./overlay";
import { PhoneField } from "./phone-field";
import { useSite } from "./site-context";

export type OrderProduct = {
  id: number;
  name: string;
  variant?: string;
  price?: string;
  image?: ImageAsset | null;
  tint?: string | null;
};

function OrderForm({ product, onDone }: { product: OrderProduct; onDone: () => void }) {
  const { dict, locale, telegramUser } = useSite();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<"name" | "phone" | "generic" | null>(null);

  const submit = async () => {
    if (name.trim().length < 2) return setError("name");
    if (phone.length < 9) return setError("phone");
    setError(null);
    setStatus("sending");
    try {
      // TODO(order-delivery): orders are stored in Admin → Soʻrovlar (Requests) and also go to the Telegram bot if one is set up.
      // Decide the final destination (bot DM, channel or group) when wiring the integrations.
      const res = await submitLead({
        kind: "order",
        name: name.trim(),
        phone: `998${phone}`,
        message: comment,
        locale,
        productId: product.id,
        productName: product.name,
        variant: product.variant,
        pageUrl: window.location.href,
      });
      if (res.ok) setStatus("done");
      else {
        setError(res.error === "generic" ? "generic" : res.error);
        setStatus("idle");
      }
    } catch {
      setError("generic");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="flex flex-col items-center px-6 pb-7 pt-2 text-center animate-pop-in">
        <div className="grid size-16 place-items-center rounded-full bg-ok-soft">
          <CircleCheck className="size-9 text-ok" />
        </div>
        <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.02em]">{dict.order.success}</h3>
        <p className="mt-2 max-w-xs text-[15px] text-muted">{dict.order.successHint}</p>
        <div className="mt-6 grid w-full gap-2">
          <button type="button" onClick={onDone} className="btn btn-primary">
            {dict.common.close}
          </button>
          {telegramUser && (
            <a href={telegramChatUrl(telegramUser)} target="_blank" rel="noopener" className="btn btn-soft">
              <TelegramIcon className="size-4 text-telegram" /> {dict.common.writeTelegram}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-4 px-6 pb-6"
    >
      <div className="flex items-center gap-3 rounded-[18px] bg-canvas p-2.5 pr-4">
        <span className="size-16 shrink-0 overflow-hidden rounded-xl bg-white">
          {product.image && <Img asset={product.image} alt="" width={320} sizes="64px" className="size-full object-contain p-1.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[15px] font-semibold leading-snug">{product.name}</span>
          {product.variant && <span className="mt-0.5 block text-[13px] leading-snug text-muted">{product.variant}</span>}
          {product.price && <span className="mt-1 block text-[15px] font-bold tracking-[-0.02em] tabular">{product.price}</span>}
        </span>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{dict.lead.name}</span>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={error === "name"}
          autoComplete="name"
          autoFocus
          maxLength={80}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{dict.order.phone}</span>
        <PhoneField value={phone} onChange={setPhone} invalid={error === "phone"} label={dict.order.phone} />
      </label>
      <label className="block">
        <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-ink-2">
          {dict.order.comment}
          <span className="text-[12px] font-normal text-subtle">{dict.order.optional}</span>
        </span>
        <textarea
          className="field min-h-[84px]"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          placeholder={dict.order.commentPlaceholder}
        />
      </label>
      {error && (
        <p className="rounded-xl bg-sale-soft px-3 py-2 text-[13px] font-medium text-sale" role="alert">
          {error === "name" ? dict.lead.errorName : error === "phone" ? dict.lead.errorPhone : dict.lead.errorGeneric}
        </p>
      )}
      <button type="submit" disabled={status === "sending"} className="btn btn-primary btn-lg w-full">
        {status === "sending" ? <LoaderCircle className="size-5 animate-spin" /> : <ShoppingBag className="size-5" />}
        {status === "sending" ? dict.order.sending : dict.order.submit}
      </button>
      <p className="text-center text-[12px] leading-relaxed text-subtle">{dict.order.note}</p>
    </form>
  );
}

export function OrderDialog({ open, onClose, product }: { open: boolean; onClose: () => void; product: OrderProduct }) {
  const { dict } = useSite();
  return (
    <Overlay open={open} onClose={onClose} side="dialog" label={dict.order.title} className="overflow-y-auto">
      <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{dict.order.title}</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">{dict.order.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.common.close}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-canvas"
        >
          <X className="size-5" />
        </button>
      </div>
      <OrderForm product={product} onDone={onClose} />
    </Overlay>
  );
}

/** "Buyurtma berish" button that opens the order dialog for a product. */
export function OrderButton({
  product,
  className,
  label,
  icon = true,
}: {
  product: OrderProduct;
  className?: string;
  label?: string;
  icon?: boolean;
}) {
  const { dict } = useSite();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("btn btn-primary", className)}>
        {icon && <ShoppingBag className="size-[18px] shrink-0" />}
        {label ?? dict.order.button}
      </button>
      <OrderDialog open={open} onClose={close} product={product} />
    </>
  );
}
