"use client";

import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, CircleCheck, LoaderCircle, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { formatNumber } from "@/lib/format";
import type { Localized } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ---------- Toasts ---------- */

type Toast = { id: number; tone: "ok" | "error"; text: string };
const ToastContext = createContext<(text: string, tone?: "ok" | "error") => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[300] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl px-4 py-3 text-[14px] font-medium text-white shadow-pop animate-pop-in",
              t.tone === "ok" ? "bg-ink" : "bg-sale",
            )}
          >
            {t.tone === "ok" ? <CircleCheck className="size-5 shrink-0 text-[#7ef59b]" /> : <AlertTriangle className="size-5 shrink-0" />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/** Shows a toast once for ?saved=… style query flags, then cleans the URL. */
export function FlashToast({ message }: { message?: string }) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);
  useEffect(() => {
    if (!message || shown.current) return;
    shown.current = true;
    toast(message);
    // Drop the one-time flag from the router state too, so a reload does not repeat the toast.
    router.replace(pathname, { scroll: false });
  }, [message, toast, router, pathname]);
  return null;
}

/* ---------- Layout pieces ---------- */

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] sm:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[22px] bg-white p-5 shadow-card sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>}
            {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Label({ children, hint, required }: { children: ReactNode; hint?: ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px] font-medium text-ink-2">
      <span>
        {children}
        {required && <span className="text-sale"> *</span>}
      </span>
      {hint && <span className="text-[12px] font-normal text-subtle">{hint}</span>}
    </span>
  );
}

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <span className="mt-1 block text-[12px] font-medium text-sale">{error}</span>;
}

export function TextField({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; hint?: ReactNode; error?: string }) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <Label hint={hint} required={required}>
          {label}
        </Label>
      )}
      <input className="field" aria-invalid={Boolean(error)} {...props} />
      <FieldError error={error} />
    </label>
  );
}

const LANG_BADGE = "pointer-events-none absolute left-3 top-[11px] rounded-md bg-canvas px-1.5 py-0.5 text-[10.5px] font-bold text-muted";

/** Uzbek + Russian inputs side by side; Russian falls back to Uzbek on the site. */
export function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 6,
  required,
  error,
  placeholder,
  hint,
}: {
  label: ReactNode;
  value: Localized;
  onChange: (v: Localized) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  error?: string;
  placeholder?: Partial<Localized>;
  hint?: ReactNode;
}) {
  const common = (lang: "uz" | "ru") => ({
    value: value[lang],
    placeholder: lang === "ru" ? placeholder?.ru ?? "Boʻsh qolsa — oʻzbekchasi koʻrinadi" : placeholder?.uz,
    "aria-invalid": lang === "uz" && Boolean(error),
    "aria-label": `${typeof label === "string" ? label : ""} (${lang.toUpperCase()})`,
  });
  return (
    <div>
      <Label required={required} hint={hint}>
        {label}
      </Label>
      <div className="grid gap-2 md:grid-cols-2">
        {(["uz", "ru"] as const).map((lang) => (
          <div key={lang} className="relative">
            <span className={LANG_BADGE}>{lang.toUpperCase()}</span>
            {multiline ? (
              <textarea
                {...common(lang)}
                rows={rows}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                className="field pl-12"
              />
            ) : (
              <input
                {...common(lang)}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                className="field pl-12"
              />
            )}
          </div>
        ))}
      </div>
      <FieldError error={error} />
    </div>
  );
}

const formatMoneyText = (v: number | null) =>
  v === null || Number.isNaN(v) ? "" : formatNumber(v, 2).replace(/ /g, " ");

/** Number input that shows thousands separators ("16 255 000"). */
export function MoneyInput({
  value,
  onChange,
  placeholder,
  suffix,
  invalid,
  className,
  "aria-label": ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  suffix?: string;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [text, setText] = useState(formatMoneyText(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(formatMoneyText(value));
  }, [value]);
  return (
    <div className={cn("relative", className)}>
      <input
        inputMode="decimal"
        className={cn("field tabular", suffix && "pr-12")}
        value={text}
        placeholder={placeholder}
        aria-invalid={invalid}
        aria-label={ariaLabel}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          setText(formatMoneyText(value));
        }}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^\d.,]/g, "").replace(",", ".");
          setText(e.target.value.replace(/[^\d\s.,]/g, ""));
          if (cleaned === "") return onChange(null);
          const n = Number(cleaned);
          if (!Number.isNaN(n)) onChange(n);
        }}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-subtle">{suffix}</span>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4", disabled && "cursor-not-allowed opacity-60")}>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-[14px] font-medium text-ink">{label}</span>}
          {description && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{description}</span>}
        </span>
      )}
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-[26px] w-[44px] rounded-full bg-line-2 transition peer-checked:bg-ok peer-focus-visible:ring-4 peer-focus-visible:ring-accent/25" />
        <span className="absolute left-[3px] top-[3px] size-5 rounded-full bg-white shadow transition peer-checked:translate-x-[18px]" />
      </span>
    </label>
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("field", props.className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("size-4 animate-spin", className)} />;
}

/* ---------- Dialogs ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/45 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[26px] bg-white shadow-pop animate-pop-in sm:rounded-[26px]",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="text-[18px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-9 place-items-center rounded-full bg-canvas">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-[#fbfbfd] px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Button that asks for confirmation before running an async action. */
export function ConfirmButton({
  onConfirm,
  title,
  text,
  confirmLabel = "Oʻchirish",
  className,
  children,
  danger = true,
}: {
  onConfirm: () => Promise<unknown> | unknown;
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  className?: string;
  children: ReactNode;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const close = useCallback(() => !busy && setOpen(false), [busy]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <Modal
        open={open}
        onClose={close}
        title={title}
        footer={
          <>
            <button type="button" className="btn btn-soft" onClick={close} disabled={busy}>
              Bekor qilish
            </button>
            <button
              type="button"
              className={cn("btn", danger ? "btn-danger" : "btn-primary")}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                } finally {
                  setBusy(false);
                  setOpen(false);
                }
              }}
            >
              {busy && <Spinner />}
              {confirmLabel}
            </button>
          </>
        }
      >
        <div className="text-[15px] leading-relaxed text-ink-2">{text ?? "Bu amalni qaytarib boʻlmaydi."}</div>
      </Modal>
    </>
  );
}

export function StatusPill({ tone, children }: { tone: "ok" | "muted" | "warn" | "sale" | "accent"; children: ReactNode }) {
  const tones = {
    ok: "bg-ok-soft text-ok",
    muted: "bg-canvas text-muted",
    warn: "bg-warn-soft text-warn",
    sale: "bg-sale-soft text-sale",
    accent: "bg-accent-soft text-accent",
  };
  return (
    <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[22px] bg-white px-6 py-14 text-center shadow-card">
      <div className="grid size-14 place-items-center rounded-full bg-canvas text-muted">{icon}</div>
      <h3 className="mt-4 text-[17px] font-semibold">{title}</h3>
      {text && <p className="mt-1.5 max-w-sm text-[14px] text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
