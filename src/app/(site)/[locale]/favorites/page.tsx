import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FavoritesView } from "@/components/site/favorites-view";
import { getDict } from "@/lib/i18n";
import { isLocale } from "@/lib/types";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDict(locale).meta.favoritesTitle, robots: { index: false } };
}

export default async function FavoritesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <FavoritesView />;
}
