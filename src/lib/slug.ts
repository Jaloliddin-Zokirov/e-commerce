const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

const APOSTROPHES = /['‘’ʻʼ`´]/g;

/** Lowercase and fold Uzbek/Russian Cyrillic into Latin. */
export function transliterate(input: string): string {
  return input
    .toLowerCase()
    .replace(APOSTROPHES, "")
    .split("")
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join("");
}

export function slugify(input: string): string {
  return transliterate(input)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Normalized text used for LIKE-based search (both scripts folded). */
export function searchNormalize(input: string): string {
  const lower = input.toLowerCase().replace(APOSTROPHES, "");
  const latin = transliterate(lower);
  return lower === latin ? lower : `${lower} ${latin}`;
}
