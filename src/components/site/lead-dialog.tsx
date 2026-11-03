"use client";

import { CircleCheck, LoaderCircle, PhoneCall, X } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { submitLead } from "@/app/actions/lead";
import { cn } from "@/lib/utils";
import { Overlay } from "./overlay";
import { PhoneField } from "./phone-field";
import { useSite } from "./site-context";

export type LeadProduct = { id: number; name: string; variant?: string };

function LeadForm({ product, onDone }: { product?: LeadProduct; onDone: () => void }) {
  const { dict, locale } = useSite();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<"name" | "phone" | "generic" | null>(null);

  const submit = async () => {
    if (name.trim().length < 2) return setError("name");
    if (phone.length < 9) return setError("phone");
    setError(null);
    setStatus("sending");
    try {
      const res = await submitLead({
        kind: "callback",
        name,
        phone: `998${phone}`,
        message,
        locale,
        productId: product?.id ?? null,
        productName: product?.name,
        variant: product?.variant,
        pageUrl: window.location.href,
      });
      if (res.ok) setStatus("done");
      else {
        setError(res.error);
        setStatus("idle");
      }
    } catch {
      setError("generic");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="flex flex-col items-center px-6 pb-8 pt-4 text-center animate-pop-in">
        <div className="grid size-16 place-items-center rounded-full bg-ok-soft">
          <CircleCheck className="size-9 text-ok" />
        </div>
        <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.02em]">{dict.lead.success}</h3>
        <p className="mt-2 text-[15px] text-muted">{dict.lead.successHint}</p>
        <button type="button" onClick={onDone} className="btn btn-primary mt-6 w-full">
          {dict.common.close}
        </button>
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
      className="space-y-3 px-6 pb-6"
    >
      {product && (
        <div className="rounded-2xl bg-canvas px-4 py-3 text-[14px]">
          <div className="text-[12px] text-muted">{dict.lead.product}</div>
          <div className="font-medium">
            {product.name}
            {product.variant && <span className="text-muted"> · {product.variant}</span>}
          </div>
        </div>
      )}
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{dict.lead.name}</span>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          aria-invalid={error === "name"}
          maxLength={80}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{dict.lead.phone}</span>
        <PhoneField value={phone} onChange={setPhone} invalid={error === "phone"} label={dict.lead.phone} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{dict.lead.message}</span>
        <textarea className="field min-h-[80px]" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
      </label>
      {error && (
        <p className="rounded-xl bg-sale-soft px-3 py-2 text-[13px] font-medium text-sale" role="alert">
          {error === "name" ? dict.lead.errorName : error === "phone" ? dict.lead.errorPhone : dict.lead.errorGeneric}
        </p>
      )}
      <button type="submit" disabled={status === "sending"} className="btn btn-primary btn-lg w-full">
        {status === "sending" ? <LoaderCircle className="size-5 animate-spin" /> : <PhoneCall className="size-5" />}
        {status === "sending" ? dict.lead.sending : dict.lead.submit}
      </button>
      <p className="text-center text-[12px] text-subtle">{dict.lead.privacy}</p>
    </form>
  );
}

export function LeadDialog({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product?: LeadProduct;
}) {
  const { dict } = useSite();
  return (
    <Overlay open={open} onClose={onClose} side="dialog" label={dict.lead.title} className="overflow-y-auto">
      <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{dict.lead.title}</h2>
          <p className="mt-1 text-[14px] text-muted">{dict.lead.subtitle}</p>
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
      <LeadForm product={product} onDone={onClose} />
    </Overlay>
  );
}

export function LeadButton({
  product,
  className,
  children,
}: {
  product?: LeadProduct;
  className?: string;
  children?: ReactNode;
}) {
  const { dict } = useSite();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("btn btn-outline", className)}>
        {children ?? (
          <>
            <PhoneCall className="size-[18px]" /> {dict.common.requestCall}
          </>
        )}
      </button>
      <LeadDialog open={open} onClose={close} product={product} />
    </>
  );
}
