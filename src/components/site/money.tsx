import { splitMoney } from "@/lib/format";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Price with a large number and a smaller currency ("16 255 000 soʻm"),
 * optionally marked as a starting price ("…soʻmdan" / "от …").
 */
export function Money({
  value,
  locale,
  from = false,
  className,
  unitClassName = "text-[0.72em] font-semibold",
}: {
  value: string;
  locale: Locale;
  from?: boolean;
  className?: string;
  unitClassName?: string;
}) {
  const [amount, unit] = splitMoney(value);
  const prefix = from && locale === "ru" ? "от" : "";
  const suffix = from && locale === "uz" ? (/[a-zʻ'’]$/i.test(unit) ? "dan" : " dan") : "";
  return (
    <span className={cn("tabular", className)}>
      {prefix && <span className={cn(unitClassName, "mr-1 opacity-70")}>{prefix}</span>}
      <span className="whitespace-nowrap">{amount}</span>{" "}
      {unit && (
        <span className={cn("whitespace-nowrap", unitClassName)}>
          {unit}
          {suffix}
        </span>
      )}
    </span>
  );
}
