"use client";

import { useRouter } from "next/navigation";
import { Download, KeyRound, Plus, RefreshCw, Save, Send, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  changePasswordAction,
  cleanupImagesAction,
  deleteDemoDataAction,
  fetchCbuRateAction,
  saveSettingsAction,
  testTelegramAction,
} from "@/app/(admin)/admin/_actions/settings";
import { displayPrice, type PriceCtx } from "@/lib/format";
import { yandexEmbedUrl } from "@/lib/links";
import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, ConfirmButton, Label, LocalizedField, MoneyInput, Spinner, TextField, Toggle, useToast } from "./ui";

const SECTIONS = [
  ["store", "Doʻkon"],
  ["contacts", "Aloqa"],
  ["location", "Manzil va xarita"],
  ["currency", "Narx va valyuta"],
  ["announcement", "Eʼlon paneli"],
  ["telegram", "Telegram bildirishnomalar"],
  ["seo", "SEO"],
  ["security", "Xavfsizlik"],
  ["data", "Maʼlumotlar"],
] as const;

export function SettingsForm({ initial, demoCount }: { initial: SiteSettings; demoCount: number }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [rateBusy, setRateBusy] = useState(false);
  const [tgBusy, setTgBusy] = useState(false);
  const [convert, setConvert] = useState(true);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const patch = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setS((prev) => ({ ...prev, [key]: value }));
  const baseChanged = s.currency.base !== initial.currency.base;

  const save = async () => {
    setSaving(true);
    setErrors({});
    const res = await saveSettingsAction(s, { convertPrices: baseChanged && convert });
    setSaving(false);
    if (!res.ok) {
      setErrors(res.errors ?? {});
      return toast(res.message, "error");
    }
    toast(res.message ?? "Saqlandi");
    router.refresh();
  };

  const ctx: PriceCtx = { ...s.currency, locale: "uz", installment: s.installment };
  const sample = s.currency.base === "USD" ? 1299 : 15_990_000;
  const samplePrice = displayPrice(sample, ctx);

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav className="hidden lg:block">
        <ul className="sticky top-8 space-y-0.5 text-[14px]">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="block rounded-xl px-3 py-2 font-medium text-ink-2 hover:bg-white">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-5">
        <Card title="Doʻkon" className="scroll-mt-6" >
          <div id="store" className="scroll-mt-24 space-y-4">
            <TextField label="Doʻkon nomi" value={s.storeName} onChange={(e) => patch("storeName", e.target.value)} error={errors.storeName} />
            <LocalizedField label="Shior (tagline)" value={s.tagline} onChange={(v) => patch("tagline", v)} />
            <LocalizedField label="Biz haqimizda" multiline rows={5} value={s.about} onChange={(v) => patch("about", v)} hint="«Aloqa» sahifasida chiqadi" />
          </div>
        </Card>

        <Card title="Aloqa">
          <div id="contacts" className="scroll-mt-24 space-y-4">
            <div>
              <Label>Telefon raqamlar</Label>
              <div className="space-y-2">
                {s.phones.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="field tabular"
                      value={p}
                      placeholder="+998 90 000 00 00"
                      onChange={(e) => patch("phones", s.phones.map((x, j) => (j === i ? e.target.value : x)))}
                      aria-label={`Telefon ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => patch("phones", s.phones.filter((_, j) => j !== i))}
                      aria-label="Oʻchirish"
                      className="grid size-11 shrink-0 place-items-center rounded-xl text-sale hover:bg-sale-soft"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                {s.phones.length < 6 && (
                  <button type="button" onClick={() => patch("phones", [...s.phones, ""])} className="chip min-h-9 gap-1">
                    <Plus className="size-3.5" /> Raqam qoʻshish
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[12px] text-muted">Birinchi raqam sarlavha va «Qoʻngʻiroq qilish» tugmalarida ishlatiladi.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Telegram menejer (username)"
                hint="mijozlar yozadi"
                placeholder="username"
                value={s.telegramUser}
                onChange={(e) => patch("telegramUser", e.target.value)}
              />
              <TextField label="Telegram kanal" placeholder="https://t.me/…" value={s.telegramChannel} onChange={(e) => patch("telegramChannel", e.target.value)} error={errors.telegramChannel} />
              <TextField label="Instagram" placeholder="https://www.instagram.com/…" value={s.instagram} onChange={(e) => patch("instagram", e.target.value)} error={errors.instagram} />
              <TextField label="YouTube" placeholder="https://www.youtube.com/@…" value={s.youtube} onChange={(e) => patch("youtube", e.target.value)} error={errors.youtube} />
              <TextField label="Email" placeholder="ixtiyoriy" value={s.email} onChange={(e) => patch("email", e.target.value)} />
            </div>
          </div>
        </Card>

        <Card title="Manzil va xarita">
          <div id="location" className="scroll-mt-24 space-y-4">
            <LocalizedField label="Manzil" value={s.address} onChange={(v) => patch("address", v)} />
            <LocalizedField label="Moʻljal" value={s.landmark} onChange={(v) => patch("landmark", v)} placeholder={{ uz: "ixtiyoriy" }} />
            <LocalizedField label="Ish vaqti" value={s.workHours} onChange={(v) => patch("workHours", v)} />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Kenglik (lat)" type="number" step="any" value={s.map.lat} onChange={(e) => patch("map", { ...s.map, lat: Number(e.target.value) })} />
              <TextField label="Uzunlik (lng)" type="number" step="any" value={s.map.lng} onChange={(e) => patch("map", { ...s.map, lng: Number(e.target.value) })} />
              <TextField label="Masshtab" type="number" min={3} max={19} value={s.map.zoom} onChange={(e) => patch("map", { ...s.map, zoom: Number(e.target.value) })} />
            </div>
            <p className="text-[12.5px] text-muted">
              Koordinatani olish: Yandex yoki Google xaritada doʻkon ustiga bosing — pastda «41.31110, 69.27970» koʻrinishidagi raqamlar chiqadi.
            </p>
            <div className="h-64 overflow-hidden rounded-2xl ring-1 ring-line">
              <iframe src={yandexEmbedUrl(s.map.lat, s.map.lng, s.map.zoom)} title="Xarita" className="size-full border-0" loading="lazy" />
            </div>
          </div>
        </Card>

        <Card title="Narx va valyuta">
          <div id="currency" className="scroll-mt-24 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <Label>Narxlar qaysi valyutada kiritiladi</Label>
                <select className="field" value={s.currency.base} onChange={(e) => patch("currency", { ...s.currency, base: e.target.value as "USD" | "UZS" })}>
                  <option value="USD">Dollarda ($ / y.e.)</option>
                  <option value="UZS">Soʻmda</option>
                </select>
              </label>
              <label className="block">
                <Label>Saytda qanday koʻrsatiladi</Label>
                <select className="field" value={s.currency.display} onChange={(e) => patch("currency", { ...s.currency, display: e.target.value as SiteSettings["currency"]["display"] })}>
                  <option value="UZS">Soʻmda</option>
                  <option value="USD">Dollarda ($)</option>
                  <option value="both">Soʻm + dollar (≈)</option>
                </select>
              </label>
            </div>
            {baseChanged && (
              <div className="rounded-2xl bg-warn-soft p-4 text-[13.5px] text-warn">
                <b>Diqqat:</b> kiritish valyutasi oʻzgaryapti.
                <label className="mt-2 flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={convert} onChange={(e) => setConvert(e.target.checked)} className="size-4" />
                  Mavjud barcha narxlarni joriy kurs boʻyicha avtomatik qayta hisoblash
                </label>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <label className="block">
                <Label>Kurs: 1 $ =</Label>
                <MoneyInput value={s.currency.rate} onChange={(v) => patch("currency", { ...s.currency, rate: v ?? 0 })} suffix="soʻm" aria-label="Kurs" />
              </label>
              <button
                type="button"
                disabled={rateBusy}
                onClick={async () => {
                  setRateBusy(true);
                  const res = await fetchCbuRateAction();
                  setRateBusy(false);
                  if (!res.ok) return toast(res.message, "error");
                  patch("currency", { ...s.currency, rate: res.rate });
                  toast(`Markaziy bank kursi (${res.date}): ${res.rate.toLocaleString("ru-RU")} soʻm. Saqlashni unutmang.`);
                }}
                className="btn btn-soft h-11"
              >
                {rateBusy ? <Spinner /> : <Download className="size-4" />} MB kursini olish
              </button>
              <label className="block">
                <Label hint="soʻm narxlar uchun">Yaxlitlash</Label>
                <select className="field" value={s.currency.roundTo} onChange={(e) => patch("currency", { ...s.currency, roundTo: Number(e.target.value) })}>
                  <option value={1}>Yaxlitlamaslik</option>
                  <option value={100}>100 soʻmgacha</option>
                  <option value={1000}>1 000 soʻmgacha</option>
                  <option value={10000}>10 000 soʻmgacha</option>
                </select>
              </label>
            </div>
            <div className="rounded-2xl bg-canvas px-4 py-3 text-[13.5px]">
              Namuna: {s.currency.base === "USD" ? "1 299 $" : "15 990 000 soʻm"} → saytda <b className="tabular">{samplePrice.main}</b>
              {samplePrice.alt && <span className="text-muted"> (≈ {samplePrice.alt})</span>}
            </div>
            <div className="space-y-3 rounded-2xl ring-1 ring-line p-4">
              <Toggle
                checked={s.installment.enabled}
                onChange={(enabled) => patch("installment", { ...s.installment, enabled })}
                label="Muddatli toʻlov narxini koʻrsatish"
                description="Mahsulot sahifasida «Oyiga … dan» yozuvi chiqadi (faqat maʼlumot uchun)"
              />
              {s.installment.enabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Necha oyga" type="number" min={2} max={60} value={s.installment.months} onChange={(e) => patch("installment", { ...s.installment, months: Number(e.target.value) })} />
                  <TextField label="Ustama, %" type="number" min={0} max={300} step="any" value={s.installment.markup} onChange={(e) => patch("installment", { ...s.installment, markup: Number(e.target.value) })} />
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card title="Eʼlon paneli" description="Saytning eng yuqorisidagi qora chiziq: aksiya, yangilik yoki taqdimot haqida qisqa xabar.">
          <div id="announcement" className="scroll-mt-24 space-y-4">
            <Toggle checked={s.announcement.enabled} onChange={(enabled) => patch("announcement", { ...s.announcement, enabled })} label="Koʻrsatish" />
            <LocalizedField label="Matn" value={s.announcement.text} onChange={(text) => patch("announcement", { ...s.announcement, text })} />
            <TextField label="Havola" hint="ixtiyoriy" placeholder="/sale yoki https://t.me/…" value={s.announcement.link} onChange={(e) => patch("announcement", { ...s.announcement, link: e.target.value })} />
          </div>
        </Card>

        <Card
          title="Telegram bildirishnomalar"
          description="Saytdan «Qayta qoʻngʻiroq» soʻrovi kelganda darhol Telegramga xabar keladi."
        >
          <div id="telegram" className="scroll-mt-24 space-y-4">
            <ol className="list-decimal space-y-1 rounded-2xl bg-canvas py-3 pl-9 pr-4 text-[13px] leading-relaxed text-ink-2">
              <li>Telegramda @BotFather ga yozing → /newbot → bot tokenini oling.</li>
              <li>Yangi botga /start yozing (yoki botni guruhga qoʻshing).</li>
              <li>Chat ID: @userinfobot dan oling (guruh uchun «-100…» bilan boshlanadi).</li>
            </ol>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Bot token" placeholder="123456789:AA…" value={s.telegramBot.token} onChange={(e) => patch("telegramBot", { ...s.telegramBot, token: e.target.value })} autoComplete="off" />
              <TextField label="Chat ID" placeholder="123456789" value={s.telegramBot.chatId} onChange={(e) => patch("telegramBot", { ...s.telegramBot, chatId: e.target.value })} />
            </div>
            <button
              type="button"
              disabled={tgBusy || !s.telegramBot.token || !s.telegramBot.chatId}
              onClick={async () => {
                setTgBusy(true);
                const res = await testTelegramAction(s.telegramBot.token, s.telegramBot.chatId);
                setTgBusy(false);
                toast(res.message ?? "", res.ok ? "ok" : "error");
              }}
              className="btn btn-soft btn-sm"
            >
              {tgBusy ? <Spinner /> : <Send className="size-4" />} Test xabar yuborish
            </button>
          </div>
        </Card>

        <Card title="SEO" description="Google va Yandex qidiruvida chiqadigan sarlavha va tavsif.">
          <div id="seo" className="scroll-mt-24 space-y-4">
            <LocalizedField label="Sarlavha (title)" value={s.seo.title} onChange={(title) => patch("seo", { ...s.seo, title })} />
            <LocalizedField label="Tavsif (description)" multiline rows={3} value={s.seo.description} onChange={(description) => patch("seo", { ...s.seo, description })} />
          </div>
        </Card>

        <Card title="Xavfsizlik" description="Admin panel parolini almashtirish. Boshqa qurilmalardagi sessiyalar yopiladi.">
          <div id="security" className="scroll-mt-24 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <TextField label="Joriy parol" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            <TextField label="Yangi parol" hint="kamida 8 belgi" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            <button
              type="button"
              disabled={pwBusy || !pw.current || !pw.next}
              onClick={async () => {
                setPwBusy(true);
                const res = await changePasswordAction(pw.current, pw.next);
                setPwBusy(false);
                toast(res.message ?? "", res.ok ? "ok" : "error");
                if (res.ok) setPw({ current: "", next: "" });
              }}
              className="btn btn-primary h-11"
            >
              {pwBusy ? <Spinner /> : <KeyRound className="size-4" />} Almashtirish
            </button>
          </div>
        </Card>

        <Card title="Maʼlumotlar">
          <div id="data" className="scroll-mt-24 space-y-3">
            <div className={cn("flex flex-wrap items-center gap-4 rounded-2xl p-4", demoCount ? "bg-warn-soft" : "bg-canvas")}>
              <Sparkles className={cn("size-5 shrink-0", demoCount ? "text-warn" : "text-muted")} />
              <div className="min-w-0 flex-1 text-[13.5px]">
                <b>Demo mahsulotlar va bannerlar</b>
                <div className="text-muted">
                  {demoCount ? `Hozir saytda ${demoCount} ta demo mahsulot bor. Kategoriyalar va brendlar saqlanib qoladi.` : "Demo mahsulotlar yoʻq."}
                </div>
              </div>
              {demoCount > 0 && (
                <ConfirmButton
                  className="btn btn-sm btn-danger"
                  title="Demo maʼlumotlarni oʻchirish"
                  text="Barcha demo mahsulotlar va demo bannerlar oʻchiriladi. Siz qoʻshgan mahsulotlar oʻchirilmaydi."
                  onConfirm={async () => {
                    const res = await deleteDemoDataAction();
                    toast(res.message ?? "Oʻchirildi");
                    router.refresh();
                  }}
                >
                  <Trash2 className="size-4" /> Demolarni oʻchirish
                </ConfirmButton>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-canvas p-4">
              <RefreshCw className="size-5 shrink-0 text-muted" />
              <div className="min-w-0 flex-1 text-[13.5px]">
                <b>Keraksiz rasmlarni tozalash</b>
                <div className="text-muted">Hech bir mahsulotga bogʻlanmagan eski rasm fayllarini oʻchiradi.</div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const res = await cleanupImagesAction();
                  toast(res.message ?? "Tayyor");
                }}
                className="btn btn-sm btn-outline"
              >
                Tozalash
              </button>
            </div>
          </div>
        </Card>

        <div className="sticky bottom-4 z-20 flex justify-end">
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-lg shadow-pop">
            {saving ? <Spinner /> : <Save className="size-5" />} Sozlamalarni saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
