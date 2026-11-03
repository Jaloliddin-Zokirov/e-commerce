"use client";

/** "901234567" -> "90 123 45 67" (the +998 prefix is shown separately). */
export function formatLocalPhone(digits: string): string {
  const d = digits.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

/** Uzbek mobile number input: fixed +998 prefix, 9 digits kept in state. */
export function PhoneField({
  value,
  onChange,
  invalid,
  autoFocus,
  label,
}: {
  value: string;
  onChange: (digits: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
  label: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] font-semibold text-ink tabular">
        +998
      </span>
      <input
        className="field h-[52px] pl-[64px] text-[17px] font-medium tracking-[0.01em] tabular"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="90 123 45 67"
        autoFocus={autoFocus}
        aria-label={label}
        value={formatLocalPhone(value)}
        onChange={(e) => {
          let digits = e.target.value.replace(/\D/g, "");
          if (digits.startsWith("998") && digits.length > 9) digits = digits.slice(3);
          onChange(digits.slice(0, 9));
        }}
        aria-invalid={invalid}
      />
    </div>
  );
}
