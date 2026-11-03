import { Inter } from "next/font/google";

/** Fallback for non-Apple devices; Apple devices render SF Pro via the system stack. */
export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});
