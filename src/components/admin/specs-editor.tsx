"use client";

import { ArrowDown, ArrowUp, Copy, LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { productSpecsAction } from "@/app/(admin)/admin/_actions/products";
import type { SpecGroup } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { Spinner, useToast } from "./ui";

type T = [string, string];
const g = (title: T, labels: T[]): SpecGroup => ({
  id: uid(6),
  title: { uz: title[0], ru: title[1] },
  items: labels.map(([uz, ru]) => ({ label: { uz, ru }, value: { uz: "", ru: "" } })),
});

const TEMPLATES: { name: string; build: () => SpecGroup[] }[] = [
  {
    name: "Smartfon",
    build: () => [
      g(["Ekran", "Экран"], [["Diagonal", "Диагональ"], ["Turi", "Тип"], ["Yangilanish chastotasi", "Частота обновления"]]),
      g(["Unumdorlik", "Производительность"], [["Chip", "Чип"], ["Operativ xotira", "Оперативная память"]]),
      g(["Kamera", "Камера"], [["Asosiy", "Основная"], ["Ultra keng", "Сверхширокая"], ["Telefoto", "Телефото"], ["Old kamera", "Фронтальная"]]),
      g(["Korpus va ulanish", "Корпус и связь"], [["Korpus", "Корпус"], ["Port", "Разъём"], ["Aloqa", "Связь"], ["SIM", "SIM"]]),
      g(["Batareya", "Батарея"], [["Ishlash vaqti", "Время работы"], ["Zaryadlash", "Зарядка"]]),
    ],
  },
  {
    name: "Noutbuk / Kompyuter",
    build: () => [
      g(["Ekran", "Экран"], [["Diagonal", "Диагональ"], ["Turi", "Тип"], ["Ruxsat", "Разрешение"]]),
      g(["Unumdorlik", "Производительность"], [["Protsessor / Chip", "Процессор / Чип"], ["Videokarta", "Видеокарта"], ["Operativ xotira", "Оперативная память"], ["SSD", "SSD"]]),
      g(["Portlar va batareya", "Порты и батарея"], [["Portlar", "Порты"], ["Batareya", "Батарея"], ["Ogʻirligi", "Вес"]]),
    ],
  },
  {
    name: "PK yigʻma",
    build: () => [
      g(["Konfiguratsiya", "Конфигурация"], [
        ["Protsessor", "Процессор"],
        ["Videokarta", "Видеокарта"],
        ["Operativ xotira", "Оперативная память"],
        ["SSD", "SSD"],
        ["Ona plata", "Материнская плата"],
        ["Sovutish", "Охлаждение"],
        ["Quvvat bloki", "Блок питания"],
        ["Korpus", "Корпус"],
        ["OT", "ОС"],
      ]),
    ],
  },
  {
    name: "Planshet",
    build: () => [
      g(["Asosiy", "Основное"], [["Displey", "Дисплей"], ["Chip", "Чип"], ["Xotira", "Память"], ["Kamera", "Камера"], ["Port", "Разъём"], ["Stilus", "Стилус"]]),
    ],
  },
  {
    name: "Quloqchin / Audio",
    build: () => [
      g(["Ovoz", "Звук"], [["Turi", "Тип"], ["Shovqin bekor qilish", "Шумоподавление"], ["Chastota diapazoni", "Частотный диапазон"]]),
      g(["Batareya va ulanish", "Батарея и подключение"], [["Ishlash vaqti", "Время работы"], ["Ulanish", "Подключение"], ["Zaryadlash", "Зарядка"]]),
    ],
  },
  {
    name: "Kamera",
    build: () => [
      g(["Asosiy", "Основное"], [["Sensor", "Сенсор"], ["Video", "Видео"], ["Stabilizatsiya", "Стабилизация"], ["Ekran", "Экран"], ["Obyektiv", "Объектив"], ["Batareya", "Батарея"]]),
    ],
  },
  {
    name: "Monitor",
    build: () => [
      g(["Ekran", "Экран"], [["Diagonal", "Диагональ"], ["Ruxsat", "Разрешение"], ["Panel", "Матрица"], ["Yangilanish chastotasi", "Частота обновления"], ["Rang qamrovi", "Цветовой охват"]]),
      g(["Portlar", "Порты"], [["Video kirishlar", "Видеовходы"], ["USB-C", "USB-C"]]),
    ],
  },
  { name: "Boʻsh guruh", build: () => [g(["", ""], [["", ""]])] },
];

const input = "field h-10 min-h-0 rounded-[10px] px-3 text-[14px]";

export function SpecsEditor({
  specs,
  onChange,
  products,
}: {
  specs: SpecGroup[];
  onChange: (next: SpecGroup[]) => void;
  products: { id: number; name: string }[];
}) {
  const toast = useToast();
  const [copyFrom, setCopyFrom] = useState("");
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState(false);

  const updateGroup = (id: string, patch: Partial<SpecGroup>) => onChange(specs.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const moveGroup = (index: number, dir: -1 | 1) => {
    const next = [...specs];
    const t = index + dir;
    if (t < 0 || t >= next.length) return;
    [next[index], next[t]] = [next[t], next[index]];
    onChange(next);
  };

  const copy = async () => {
    if (!copyFrom) return;
    setLoading(true);
    try {
      const groups = await productSpecsAction(Number(copyFrom));
      if (groups.length === 0) toast("Bu mahsulotda xarakteristika yoʻq", "error");
      else {
        onChange([...specs, ...groups.map((grp) => ({ ...grp, id: uid(6) }))]);
        toast(`${groups.length} ta guruh nusxalandi`);
      }
    } finally {
      setLoading(false);
      setCopyFrom("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button type="button" onClick={() => setMenu((v) => !v)} className="btn btn-outline btn-sm">
            <LayoutTemplate className="size-4" /> Shablondan qoʻshish
          </button>
          {menu && (
            <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-56 rounded-2xl bg-white p-1.5 shadow-pop ring-1 ring-black/5 animate-pop-in">
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => {
                    onChange([...specs, ...t.build()]);
                    setMenu(false);
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-[14px] hover:bg-canvas"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {products.length > 0 && (
          <div className="flex items-center gap-1.5">
            <select className="field h-9 min-h-0 w-56 rounded-full py-0 text-[13.5px]" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} aria-label="Mahsulotdan nusxalash">
              <option value="">Boshqa mahsulotdan nusxalash…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={copy} disabled={!copyFrom || loading} className="btn btn-soft btn-sm">
              {loading ? <Spinner /> : <Copy className="size-4" />} Nusxalash
            </button>
          </div>
        )}
      </div>

      {specs.length === 0 && (
        <p className="rounded-2xl bg-canvas px-4 py-6 text-center text-[13.5px] text-muted">
          Hali xarakteristika yoʻq. Shablon tanlang — maydon nomlari tayyor boʻladi, faqat qiymatlarni yozasiz.
        </p>
      )}

      {specs.map((grp, gi) => (
        <div key={grp.id} className="rounded-2xl bg-[#fafafc] p-4 ring-1 ring-line">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={cn(input, "w-48 font-semibold")}
              value={grp.title.uz}
              placeholder="Guruh nomi (UZ)"
              aria-label="Guruh nomi (UZ)"
              onChange={(e) => updateGroup(grp.id, { title: { ...grp.title, uz: e.target.value } })}
            />
            <input
              className={cn(input, "w-48")}
              value={grp.title.ru}
              placeholder="Guruh nomi (RU)"
              aria-label="Guruh nomi (RU)"
              onChange={(e) => updateGroup(grp.id, { title: { ...grp.title, ru: e.target.value } })}
            />
            <div className="ml-auto flex gap-0.5">
              <button type="button" onClick={() => moveGroup(gi, -1)} disabled={gi === 0} aria-label="Guruhni yuqoriga" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-white disabled:opacity-30">
                <ArrowUp className="size-4" />
              </button>
              <button type="button" onClick={() => moveGroup(gi, 1)} disabled={gi === specs.length - 1} aria-label="Guruhni pastga" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-white disabled:opacity-30">
                <ArrowDown className="size-4" />
              </button>
              <button type="button" onClick={() => onChange(specs.filter((s) => s.id !== grp.id))} aria-label="Guruhni oʻchirish" className="grid size-9 place-items-center rounded-lg text-sale hover:bg-sale-soft">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 hidden grid-cols-[1fr_1fr_1.3fr_1.3fr_auto] gap-2 px-0.5 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-subtle lg:grid">
            <span>Nomi (UZ)</span>
            <span>Nomi (RU)</span>
            <span>Qiymati (UZ)</span>
            <span>Qiymati (RU)</span>
            <span className="w-[108px]" />
          </div>
          <div className="mt-1.5 space-y-2">
            {grp.items.map((item, ii) => {
              const setItem = (patch: Partial<typeof item>) =>
                updateGroup(grp.id, { items: grp.items.map((x, j) => (j === ii ? { ...x, ...patch } : x)) });
              const moveItem = (dir: -1 | 1) => {
                const items = [...grp.items];
                const t = ii + dir;
                if (t < 0 || t >= items.length) return;
                [items[ii], items[t]] = [items[t], items[ii]];
                updateGroup(grp.id, { items });
              };
              return (
                <div key={ii} className="grid grid-cols-2 gap-2 rounded-xl bg-white p-2 ring-1 ring-line lg:grid-cols-[1fr_1fr_1.3fr_1.3fr_auto] lg:bg-transparent lg:p-0 lg:ring-0">
                  <input className={input} value={item.label.uz} placeholder="Masalan: Diagonal" aria-label="Nomi (UZ)" onChange={(e) => setItem({ label: { ...item.label, uz: e.target.value } })} />
                  <input className={input} value={item.label.ru} placeholder="Диагональ" aria-label="Nomi (RU)" onChange={(e) => setItem({ label: { ...item.label, ru: e.target.value } })} />
                  <input className={input} value={item.value.uz} placeholder="Masalan: 6,3″" aria-label="Qiymati (UZ)" onChange={(e) => setItem({ value: { ...item.value, uz: e.target.value } })} />
                  <input className={input} value={item.value.ru} placeholder="Boʻsh = UZ bilan bir xil" aria-label="Qiymati (RU)" onChange={(e) => setItem({ value: { ...item.value, ru: e.target.value } })} />
                  <div className="col-span-2 flex justify-end gap-0.5 lg:col-span-1">
                    <button type="button" onClick={() => moveItem(-1)} disabled={ii === 0} aria-label="Yuqoriga" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-white disabled:opacity-30">
                      <ArrowUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => moveItem(1)} disabled={ii === grp.items.length - 1} aria-label="Pastga" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-white disabled:opacity-30">
                      <ArrowDown className="size-4" />
                    </button>
                    <button type="button" onClick={() => updateGroup(grp.id, { items: grp.items.filter((_, j) => j !== ii) })} aria-label="Qatorni oʻchirish" className="grid size-9 place-items-center rounded-lg text-sale hover:bg-sale-soft">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => updateGroup(grp.id, { items: [...grp.items, { label: { uz: "", ru: "" }, value: { uz: "", ru: "" } }] })}
            className="mt-3 inline-flex h-8 items-center gap-1 rounded-full bg-ink px-3 text-[12.5px] font-semibold text-white"
          >
            <Plus className="size-3.5" /> Qator qoʻshish
          </button>
        </div>
      ))}

      {specs.length > 0 && (
        <button type="button" onClick={() => onChange([...specs, g(["", ""], [["", ""]])])} className="chip min-h-9 gap-1">
          <Plus className="size-3.5" /> Yangi guruh
        </button>
      )}
    </div>
  );
}
