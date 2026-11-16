/**
 * Placeholder logo of the no-name storefront: an "image" glyph and the word LOGO.
 * Replace it with the real mark (and src/app/icon.svg, apple-icon.png) when the brand is chosen.
 */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  const ink = inverted ? "#ffffff" : "#1D1D1F";
  const glyph = inverted ? "#1D1D1F" : "#ffffff";
  return (
    <svg className={className} viewBox="0 0 384 100" fill="none" role="img" aria-label="LOGO">
      <rect width="100" height="100" rx="24" fill={ink} />
      <circle cx="67" cy="33" r="9" fill="#ff7a1a" />
      <path d="M16 80L41 46L57 66L67 54L84 80Z" fill={glyph} />
      <path d="M124 18H139V67H166V82H124Z" fill={ink} />
      <circle cx="204" cy="50" r="24.5" stroke={ink} strokeWidth="15" />
      <path d="M295.32 32.68A24.5 24.5 0 1 0 302.5 50" stroke={ink} strokeWidth="15" />
      <rect x="281" y="50" width="22" height="15" fill={ink} />
      <circle cx="352" cy="50" r="24.5" stroke={ink} strokeWidth="15" />
    </svg>
  );
}
