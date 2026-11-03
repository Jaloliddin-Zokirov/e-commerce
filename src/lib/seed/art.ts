/**
 * Vector product illustrations for the demo catalog. Real photos uploaded in
 * the admin panel replace them; they only keep a fresh install from looking empty.
 */

import {
  display,
  headphones,
  imac,
  laptopClosed,
  laptopOpen,
  monitor,
  phoneBack,
  phoneFront,
  studioMic,
  tablet,
  watch,
} from "./art-pro";

export { display, headphones, imac, laptopClosed, laptopOpen, monitor, phoneBack, phoneFront, studioMic, tablet, watch };

function clampByte(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Lighten (pct > 0) or darken (pct < 0) a hex color. */
export function shade(hex: string, pct: number): string {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const target = pct < 0 ? 0 : 255;
  const p = Math.abs(pct) / 100;
  return `#${rgb
    .map((c) => clampByte(c + (target - c) * p).toString(16).padStart(2, "0"))
    .join("")}`;
}

function svg(content: string, defs: string, w = 1200, h = 1200): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter></defs>${content}</svg>`;
}

function floorShadow(cx: number, cy: number, rx: number, ry = 26, opacity = 0.22) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${opacity}" filter="url(#blur)"/>`;
}

function linear(id: string, stops: string[], x2 = 1, y2 = 1) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map((c, i) => `<stop offset="${(i / (stops.length - 1)) * 100}%" stop-color="${c}"/>`)
    .join("")}</linearGradient>`;
}

/** Abstract screen wallpaper tinted with the device color. */
function wallpaperDefs(id: string, tint: string) {
  return `${linear(id, [shade(tint, -55), "#1b1f3a", shade(tint, 10)], 1, 1)}<radialGradient id="${id}r" cx="0.75" cy="0.25" r="0.7"><stop offset="0%" stop-color="${shade(tint, 35)}" stop-opacity="0.95"/><stop offset="100%" stop-color="${tint}" stop-opacity="0"/></radialGradient><radialGradient id="${id}b" cx="0.2" cy="0.85" r="0.6"><stop offset="0%" stop-color="#5b7cff" stop-opacity="0.75"/><stop offset="100%" stop-color="#5b7cff" stop-opacity="0"/></radialGradient>`;
}

function wallpaperRect(id: string, x: number, y: number, w: number, h: number, rx: number) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${id})"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${id}r)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${id}b)"/>`;
}

const glassDefs = `<radialGradient id="glass" cx="0.4" cy="0.35" r="0.7"><stop offset="0%" stop-color="#3a4a6b"/><stop offset="60%" stop-color="#0d1220"/><stop offset="100%" stop-color="#030406"/></radialGradient>`;


export function macMini(): string {
  const top = linear("top", ["#f2f3f4", "#d9dadc"], 0, 1);
  const front = linear("front", ["#c9cacc", "#a9aaad"], 0, 1);
  return svg(
    `${floorShadow(600, 800, 330, 30, 0.25)}
    <rect x="300" y="470" width="600" height="300" rx="70" fill="url(#front)"/>
    <rect x="300" y="430" width="600" height="250" rx="70" fill="url(#top)"/>
    <rect x="300" y="430" width="600" height="250" rx="70" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="3"/>
    <rect x="410" y="716" width="34" height="13" rx="6.5" fill="#2a2a2c"/>
    <rect x="462" y="716" width="34" height="13" rx="6.5" fill="#2a2a2c"/>
    <circle cx="530" cy="722" r="8" fill="#2a2a2c"/>
    <circle cx="820" cy="722" r="5" fill="#7ef59b"/>`,
    top + front,
  );
}

export function keyboard(): string {
  const deck = linear("deck", ["#f6f6f7", "#dcdddf"], 0, 1);
  let keys = "";
  const rows = [
    { y: 450, h: 34, n: 14 },
    { y: 498, h: 52, n: 14 },
    { y: 562, h: 52, n: 14 },
    { y: 626, h: 52, n: 13 },
    { y: 690, h: 52, n: 12 },
  ];
  for (const row of rows) {
    const gap = 10;
    const total = 860;
    const kw = (total - gap * (row.n - 1)) / row.n;
    for (let i = 0; i < row.n; i++) {
      keys += `<rect x="${170 + i * (kw + gap)}" y="${row.y}" width="${kw}" height="${row.h}" rx="9" fill="#fff" stroke="#d2d3d6" stroke-width="2"/>`;
    }
  }
  keys += `<rect x="170" y="754" width="110" height="52" rx="9" fill="#fff" stroke="#d2d3d6" stroke-width="2"/>
    <rect x="290" y="754" width="110" height="52" rx="9" fill="#fff" stroke="#d2d3d6" stroke-width="2"/>
    <rect x="410" y="754" width="380" height="52" rx="9" fill="#fff" stroke="#d2d3d6" stroke-width="2"/>
    <rect x="800" y="754" width="110" height="52" rx="9" fill="#fff" stroke="#d2d3d6" stroke-width="2"/>
    <rect x="920" y="754" width="110" height="52" rx="9" fill="#fff" stroke="#d2d3d6" stroke-width="2"/>
    <circle cx="1013" cy="467" r="12" fill="none" stroke="#b9babd" stroke-width="3"/>`;
  return svg(
    `${floorShadow(600, 860, 480, 26, 0.18)}
    <rect x="140" y="420" width="920" height="420" rx="34" fill="url(#deck)"/>
    ${keys}`,
    deck,
  );
}

export function trackpad(): string {
  const pad = linear("pad", ["#fafafa", "#e1e2e4"]);
  return svg(
    `${floorShadow(600, 900, 380, 26, 0.18)}
    <rect x="250" y="320" width="700" height="560" rx="56" fill="url(#pad)"/>
    <rect x="256" y="326" width="688" height="548" rx="52" fill="none" stroke="#fff" stroke-width="4"/>
    <rect x="250" y="320" width="700" height="560" rx="56" fill="none" stroke="#c9cacd" stroke-width="3"/>`,
    pad,
  );
}

export function earbudsCase(): string {
  const shell = linear("shell", ["#ffffff", "#e9e9eb"]);
  return svg(
    `${floorShadow(600, 900, 300, 24, 0.18)}
    <rect x="360" y="360" width="480" height="500" rx="150" fill="url(#shell)"/>
    <rect x="360" y="360" width="480" height="500" rx="150" fill="none" stroke="#d6d7da" stroke-width="3"/>
    <line x1="364" y1="520" x2="836" y2="520" stroke="#cfd0d3" stroke-width="4"/>
    <circle cx="600" cy="600" r="9" fill="#7ef59b"/>
    <g transform="translate(250 760) rotate(-18)"><ellipse cx="0" cy="0" rx="58" ry="52" fill="#fff" stroke="#d6d7da" stroke-width="3"/><rect x="-18" y="30" width="36" height="120" rx="18" fill="#fff" stroke="#d6d7da" stroke-width="3"/></g>
    <g transform="translate(950 760) rotate(18)"><ellipse cx="0" cy="0" rx="58" ry="52" fill="#fff" stroke="#d6d7da" stroke-width="3"/><rect x="-18" y="30" width="36" height="120" rx="18" fill="#fff" stroke="#d6d7da" stroke-width="3"/></g>`,
    shell,
  );
}

export function tvBox(): string {
  const box = linear("box", ["#3a3a3d", "#101012"], 0, 1);
  const remote = linear("remote", ["#e9eaec", "#bfc0c3"], 1, 0);
  return svg(
    `${floorShadow(560, 840, 300, 26, 0.25)}
    <rect x="260" y="540" width="560" height="260" rx="60" fill="#0b0b0c"/>
    <rect x="260" y="500" width="560" height="250" rx="60" fill="url(#box)"/>
    <ellipse cx="460" cy="560" rx="160" ry="30" fill="#fff" opacity="0.08"/>
    <g transform="rotate(10 900 640)">
      <rect x="840" y="330" width="130" height="560" rx="50" fill="url(#remote)"/>
      <circle cx="905" cy="430" r="52" fill="#d6d7d9" stroke="#a9aaad" stroke-width="4"/>
      <circle cx="905" cy="430" r="22" fill="#e9eaec"/>
      <circle cx="880" cy="540" r="16" fill="#2a2a2c"/><circle cx="930" cy="540" r="16" fill="#2a2a2c"/>
      <circle cx="880" cy="590" r="16" fill="#2a2a2c"/><circle cx="930" cy="590" r="16" fill="#2a2a2c"/>
    </g>`,
    box + remote,
  );
}

export function pcTower(accentA = "#7c4dff", accentB = "#00d4ff"): string {
  const rgb = linear("rgb", [accentA, accentB], 1, 0);
  const rgbV = linear("rgbv", [accentB, accentA], 0, 1);
  const fan = (cx: number, cy: number) =>
    `<circle cx="${cx}" cy="${cy}" r="86" fill="#0d0d12" stroke="url(#rgb)" stroke-width="12" filter="url(#glow)" opacity="0.9"/><circle cx="${cx}" cy="${cy}" r="86" fill="none" stroke="url(#rgb)" stroke-width="8"/><circle cx="${cx}" cy="${cy}" r="24" fill="#1d1d24"/>${[0, 72, 144, 216, 288]
      .map((a) => `<path d="M${cx} ${cy} Q${cx + 40} ${cy - 60} ${cx + 10} ${cy - 74}" fill="none" stroke="#2c2c36" stroke-width="12" transform="rotate(${a} ${cx} ${cy})"/>`)
      .join("")}`;
  return svg(
    `${floorShadow(600, 1090, 330, 26, 0.3)}
    <rect x="290" y="110" width="620" height="960" rx="26" fill="#121214"/>
    <rect x="318" y="138" width="564" height="904" rx="16" fill="#07070a"/>
    <rect x="360" y="180" width="380" height="520" rx="10" fill="#1b1c22"/>
    <circle cx="520" cy="330" r="74" fill="#0e0e12" stroke="url(#rgb)" stroke-width="10"/>
    <circle cx="520" cy="330" r="40" fill="#18181f"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${640 + i * 22}" y="220" width="12" height="200" rx="4" fill="url(#rgbv)"/>`).join("")}
    <rect x="350" y="540" width="400" height="120" rx="12" fill="#26272e"/>
    <rect x="350" y="640" width="400" height="10" rx="5" fill="url(#rgb)"/>
    ${fan(800, 290)}${fan(800, 520)}${fan(800, 750)}
    <rect x="318" y="880" width="564" height="162" rx="10" fill="#141418"/>
    <rect x="340" y="900" width="140" height="10" rx="5" fill="url(#rgb)" opacity="0.7"/>
    <path d="M318 138 L520 138 L318 560 Z" fill="#fff" opacity="0.04"/>`,
    rgb + rgbV,
  );
}

export function micKit(): string {
  const shell = linear("shell", ["#3a3a3d", "#151517"], 0, 1);
  const unit = linear("unit", ["#444448", "#1e1e21"], 0, 1);
  const tx = (x: number, y: number) =>
    `<rect x="${x}" y="${y}" width="210" height="230" rx="52" fill="url(#unit)"/>${Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 4 }, (_, c) => `<circle cx="${x + 60 + c * 30}" cy="${y + 60 + r * 30}" r="6" fill="#0a0a0b"/>`).join(""),
    ).join("")}<circle cx="${x + 170}" cy="${y + 196}" r="7" fill="#ff4d4d"/>`;
  return svg(
    `${floorShadow(600, 960, 380, 26, 0.25)}
    <rect x="250" y="560" width="700" height="370" rx="100" fill="url(#shell)"/>
    <rect x="250" y="560" width="700" height="80" rx="40" fill="#2a2a2d"/>
    ${tx(300, 360)}${tx(690, 360)}
    <rect x="510" y="300" width="180" height="280" rx="40" fill="url(#unit)"/>
    <rect x="530" y="330" width="140" height="110" rx="14" fill="#0c1530"/>
    <rect x="545" y="350" width="60" height="10" rx="5" fill="#4cc3ff"/>
    <rect x="545" y="372" width="100" height="10" rx="5" fill="#7ef59b"/>
    <rect x="545" y="394" width="80" height="10" rx="5" fill="#ffd166"/>`,
    shell + unit,
  );
}

export function gimbalCam(): string {
  const handle = linear("handle", ["#3a3a3d", "#151517"], 1, 0);
  return svg(
    `${floorShadow(600, 1070, 200, 22, 0.25)}
    <rect x="470" y="440" width="260" height="610" rx="100" fill="url(#handle)"/>
    ${wallpaperRect("wall", 500, 480, 200, 150, 22)}
    <circle cx="600" cy="740" r="26" fill="#1a1a1c" stroke="#ff453a" stroke-width="8"/>
    <circle cx="600" cy="830" r="30" fill="#2a2a2d" stroke="#0c0c0d" stroke-width="6"/>
    <rect x="560" y="330" width="80" height="130" rx="20" fill="#2a2a2d"/>
    <circle cx="600" cy="270" r="120" fill="#232326"/>
    <circle cx="600" cy="270" r="74" fill="#0d0d10"/>
    <circle cx="600" cy="270" r="50" fill="url(#glass)"/>
    <circle cx="584" cy="252" r="10" fill="#fff" opacity="0.35"/>`,
    handle + glassDefs + wallpaperDefs("wall", "#ff7a59"),
  );
}

export function camera(): string {
  const body = linear("body", ["#2c2c2f", "#0f0f10"], 0, 1);
  return svg(
    `${floorShadow(600, 880, 420, 28, 0.25)}
    <rect x="560" y="330" width="170" height="44" rx="10" fill="#202022"/>
    <rect x="200" y="370" width="800" height="460" rx="64" fill="url(#body)"/>
    <rect x="200" y="370" width="200" height="460" rx="64" fill="#151516"/>
    <rect x="860" y="400" width="90" height="30" rx="10" fill="#26262a"/>
    <circle cx="660" cy="610" r="215" fill="#101012" stroke="#2a2a2e" stroke-width="12"/>
    <circle cx="660" cy="610" r="176" fill="#18181a"/>
    ${Array.from({ length: 24 }, (_, i) => `<line x1="660" y1="440" x2="660" y2="458" stroke="#2e2e33" stroke-width="6" transform="rotate(${i * 15} 660 610)"/>`).join("")}
    <circle cx="660" cy="610" r="120" fill="url(#glass)"/>
    <circle cx="620" cy="570" r="26" fill="#fff" opacity="0.22"/>
    <circle cx="950" cy="470" r="9" fill="#ff453a"/>`,
    body + glassDefs,
  );
}

export function sdCard(band = "#c8102e"): string {
  return svg(
    `${floorShadow(600, 1000, 300, 22, 0.22)}
    <clipPath id="card"><path d="M370 190 H770 L880 300 V920 Q880 960 840 960 H370 Q330 960 330 920 V230 Q330 190 370 190 Z"/></clipPath>
    <g clip-path="url(#card)">
      <rect x="330" y="190" width="550" height="770" fill="#151517"/>
      <rect x="330" y="350" width="550" height="200" fill="${band}"/>
      <rect x="330" y="550" width="550" height="14" fill="#d4a017"/>
      <rect x="330" y="190" width="550" height="160" fill="#1f1f22"/>
      <path d="M330 190 L620 190 L330 640 Z" fill="#fff" opacity="0.05"/>
      <rect x="400" y="640" width="200" height="60" rx="12" fill="#fff" opacity="0.92"/>
      <rect x="620" y="640" width="200" height="60" rx="12" fill="#d4a017"/>
      <rect x="400" y="730" width="420" height="20" rx="10" fill="#fff" opacity="0.18"/>
    </g>
    <rect x="318" y="330" width="16" height="110" rx="6" fill="#77777b"/>`,
    "",
  );
}

/** Wide composition for hero banners (transparent background). */
export function bannerScene(kind: "iphone" | "setup" | "imac"): string {
  const parts: string[] = [];
  const nest = (inner: string, x: number, y: number, size: number) => {
    // Each illustration reuses ids like "body" or "wall"; namespace them per part.
    const prefix = `p${parts.length}-`;
    const body = inner
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "")
      .replace(/id="([^"]+)"/g, `id="${prefix}$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`);
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 1200 1200">${body}</svg>`;
  };
  if (kind === "iphone") {
    // Tight square framing so the phones fill the banner's image area.
    parts.push(nest(phoneFront("#d9d9db"), -190, 30, 940));
    parts.push(nest(phoneBack("#f77e2d", "pro"), 250, 80, 940));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">${parts.join("")}</svg>`;
  } else if (kind === "setup") {
    parts.push(nest(display("#d6d7d9", "#151516", "#ff8a3d"), 200, -40, 1100));
    parts.push(nest(macMini(), 0, 360, 600));
    parts.push(nest(keyboard(), 420, 440, 640));
    parts.push(nest(trackpad(), 980, 520, 420));
  } else {
    parts.push(nest(imac("#5b8fc7"), 280, 0, 1000));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000">${parts.join("")}</svg>`;
}
