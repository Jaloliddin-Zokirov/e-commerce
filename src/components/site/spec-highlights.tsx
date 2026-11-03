import {
  AudioLines,
  BatteryCharging,
  Bluetooth,
  Camera,
  Cpu,
  Droplets,
  Gpu,
  HardDrive,
  MemoryStick,
  MonitorSmartphone,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { Highlight, HighlightKind } from "@/lib/spec-highlights";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section";

const ICONS: Record<HighlightKind, LucideIcon> = {
  display: MonitorSmartphone,
  chip: Cpu,
  gpu: Gpu,
  memory: MemoryStick,
  storage: HardDrive,
  camera: Camera,
  battery: BatteryCharging,
  sound: AudioLines,
  video: Video,
  connection: Bluetooth,
  water: Droplets,
};

const COLS: Record<number, string> = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

/** "At a glance" tiles with the product's headline specs. */
export function SpecHighlights({ items, title }: { items: Highlight[]; title: string }) {
  if (items.length < 2) return null;
  return (
    <section aria-label={title}>
      <SectionHeader title={title} />
      <ul className={cn("grid grid-cols-2 gap-3 lg:gap-5 [&>li:last-child:nth-child(odd)]:col-span-2", COLS[items.length], "lg:[&>li:last-child:nth-child(odd)]:col-span-1")}>
        {items.map((h) => {
          const Icon = ICONS[h.kind];
          return (
            <li key={h.kind} className="flex min-w-0 flex-col rounded-[18px] bg-white p-5 shadow-tile sm:p-6">
              <Icon className="size-7 text-ink" strokeWidth={1.5} />
              <span className="mt-5 line-clamp-2 text-[13px] font-medium leading-snug text-muted">{h.label}</span>
              <span className="mt-1 line-clamp-2 break-words text-[18px] font-semibold leading-tight tracking-[-0.015em] sm:text-[22px]">{h.value}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
