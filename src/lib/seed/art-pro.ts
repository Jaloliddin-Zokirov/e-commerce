/**
 * Studio-style vector renders of the Apple devices in the demo catalog:
 * metallic frames, layered lens glass, lit screens. Still placeholders — real
 * photos uploaded from the admin panel replace them.
 */

function clampByte(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Lighten (pct > 0) or darken (pct < 0) a hex color. */
export function shade(hex: string, pct: number): string {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const target = pct < 0 ? 0 : 255;
  const p = Math.abs(pct) / 100;
  return `#${rgb.map((c) => clampByte(c + (target - c) * p).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}

type Stop = [number, string, number?];
const stops = (list: Stop[]) =>
  list.map(([o, c, a]) => `<stop offset="${o}%" stop-color="${c}"${a === undefined ? "" : ` stop-opacity="${a}"`}/>`).join("");
const lg = (id: string, x1: number, y1: number, x2: number, y2: number, list: Stop[]) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`;
const rg = (id: string, cx: number, cy: number, r: number, list: Stop[]) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(list)}</radialGradient>`;

function doc(content: string, defs: string, w = 1200, h = 1200) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter><filter id="tight" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>${content}</svg>`;
}

/** Wide soft shadow plus a darker contact shadow right under the object. */
function shadow(cx: number, cy: number, rx: number) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.09}" fill="#000" opacity="0.22" filter="url(#soft)"/><ellipse cx="${cx}" cy="${cy - 4}" rx="${rx * 0.8}" ry="${rx * 0.03}" fill="#000" opacity="0.35" filter="url(#tight)"/>`;
}

/** Brushed/anodized metal across the width of a frame. */
function metalDefs(id: string, c: string) {
  const dark = luminance(c) < 90;
  return lg(id, 0, 0, 1, 0, [
    [0, shade(c, dark ? -40 : -38)],
    [3, shade(c, dark ? 38 : 30)],
    [9, shade(c, dark ? 8 : -4)],
    [50, c],
    [90, shade(c, dark ? 4 : -10)],
    [97, shade(c, dark ? 30 : 24)],
    [100, shade(c, -40)],
  ]);
}

/** Vivid "lock screen" wallpaper tinted by the device color. */
function wallDefs(id: string, tint: string) {
  return `${lg(`${id}`, 0, 0, 0.3, 1, [
    [0, shade(tint, -62)],
    [55, "#140c2a"],
    [100, "#05060d"],
  ])}${rg(`${id}a`, 0.28, 0.24, 0.62, [
    [0, shade(tint, 20), 0.95],
    [100, tint, 0],
  ])}${rg(`${id}b`, 0.86, 0.6, 0.55, [
    [0, "#8b5cff", 0.85],
    [100, "#8b5cff", 0],
  ])}${rg(`${id}c`, 0.2, 0.98, 0.55, [
    [0, "#2f7bff", 0.75],
    [100, "#2f7bff", 0],
  ])}`;
}
function wallRect(id: string, x: number, y: number, w: number, h: number, r: number) {
  return ["", "a", "b", "c"].map((k) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#${id}${k})"/>`).join("");
}

function lensDefs(ring: string) {
  return `${rg("lensRing", 0.32, 0.28, 0.8, [
    [0, "#f4f4f6"],
    [40, ring],
    [100, shade(ring, -55)],
  ])}${rg("lensBarrel", 0.5, 0.5, 0.5, [
    [0, "#2b2e36"],
    [70, "#111215"],
    [100, "#050506"],
  ])}${rg("lensGlass", 0.42, 0.38, 0.62, [
    [0, "#24305a"],
    [55, "#0a0e1c"],
    [100, "#020203"],
  ])}${rg("lensCoat", 0.72, 0.74, 0.55, [
    [0, "#9a6bff", 0.6],
    [45, "#28b4ff", 0.22],
    [100, "#28b4ff", 0],
  ])}${rg("flash", 0.45, 0.42, 0.6, [
    [0, "#fffbe9"],
    [60, "#f2e3b6"],
    [100, "#a79b78"],
  ])}`;
}

function lens(cx: number, cy: number, r: number) {
  return `<circle cx="${cx}" cy="${cy + r * 0.08}" r="${r * 1.36}" fill="#000" opacity="0.28" filter="url(#tight)"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 1.32}" fill="url(#lensRing)"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 1.17}" fill="#08080a"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 1.04}" fill="url(#lensBarrel)"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.84}" fill="url(#lensGlass)"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.84}" fill="url(#lensCoat)"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.36}" fill="#030305" stroke="#6d7dbd" stroke-opacity="0.35" stroke-width="${r * 0.05}"/>
    <ellipse cx="${cx - r * 0.32}" cy="${cy - r * 0.34}" rx="${r * 0.24}" ry="${r * 0.13}" fill="#fff" opacity="0.6" transform="rotate(-38 ${cx - r * 0.32} ${cy - r * 0.34})"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 1.17}" fill="none" stroke="#fff" stroke-opacity="0.14" stroke-width="2"/>`;
}

export type PhoneStyle = "pro" | "air" | "base";

export function phoneBack(color: string, style: PhoneStyle): string {
  const x = 380;
  const y = 92;
  const w = 440;
  const h = 950;
  const r = 96;
  const light = luminance(color) > 150;
  const defs =
    metalDefs("frame", color) +
    lg("panel", 0, 0, 0, 1, [
      [0, shade(color, light ? 6 : 12)],
      [45, color],
      [100, shade(color, light ? -10 : -14)],
    ]) +
    lg("sheen", 0, 0, 1, 1, [
      [0, "#fff", 0],
      [30, "#fff", light ? 0.35 : 0.16],
      [38, "#fff", 0.03],
      [100, "#fff", 0],
    ]) +
    lg("plateau", 0, 0, 0, 1, [
      [0, shade(color, light ? -3 : 14)],
      [100, shade(color, light ? -12 : 2)],
    ]) +
    lg("button", 0, 0, 1, 0, [
      [0, shade(color, -30)],
      [50, shade(color, 22)],
      [100, shade(color, -30)],
    ]) +
    lensDefs(shade(color, light ? -18 : 18));

  let camera = "";
  if (style === "pro") {
    camera = `<rect x="${x + 14}" y="${y + 16}" width="${w - 28}" height="300" rx="82" fill="url(#plateau)"/>
      <rect x="${x + 14}" y="${y + 16}" width="${w - 28}" height="300" rx="82" fill="none" stroke="#fff" stroke-opacity="${light ? 0.5 : 0.18}" stroke-width="3"/>
      <path d="M${x + 60} ${y + 314} H${x + w - 60}" stroke="#000" stroke-opacity="0.18" stroke-width="4" stroke-linecap="round"/>
      ${lens(x + 118, y + 106, 42)}${lens(x + 118, y + 228, 42)}${lens(x + 228, y + 167, 42)}
      <circle cx="${x + 334}" cy="${y + 106}" r="21" fill="url(#flash)"/><circle cx="${x + 334}" cy="${y + 106}" r="21" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="3"/>
      <circle cx="${x + 334}" cy="${y + 228}" r="19" fill="#0b0b0e"/><circle cx="${x + 329}" cy="${y + 223}" r="5" fill="#fff" opacity="0.25"/>
      <circle cx="${x + 280}" cy="${y + 96}" r="5" fill="#000" opacity="0.5"/>`;
  } else if (style === "air") {
    camera = `<rect x="${x + 14}" y="${y + 36}" width="${w - 28}" height="176" rx="88" fill="url(#plateau)"/>
      <rect x="${x + 14}" y="${y + 36}" width="${w - 28}" height="176" rx="88" fill="none" stroke="#fff" stroke-opacity="${light ? 0.5 : 0.18}" stroke-width="3"/>
      ${lens(x + 112, y + 124, 44)}
      <circle cx="${x + 232}" cy="${y + 124}" r="18" fill="url(#flash)"/>
      <circle cx="${x + 290}" cy="${y + 124}" r="5" fill="#000" opacity="0.5"/>`;
  } else {
    camera = `<rect x="${x + 36}" y="${y + 36}" width="168" height="336" rx="84" fill="url(#plateau)"/>
      <rect x="${x + 36}" y="${y + 36}" width="168" height="336" rx="84" fill="none" stroke="#fff" stroke-opacity="${light ? 0.55 : 0.2}" stroke-width="3"/>
      ${lens(x + 120, y + 122, 44)}${lens(x + 120, y + 286, 44)}
      <circle cx="${x + 252}" cy="${y + 120}" r="17" fill="url(#flash)"/>`;
  }

  return doc(
    `${shadow(600, 1072, 240)}
    <rect x="${x - 7}" y="${y + 196}" width="10" height="62" rx="5" fill="url(#button)"/>
    <rect x="${x - 7}" y="${y + 284}" width="10" height="92" rx="5" fill="url(#button)"/>
    <rect x="${x - 7}" y="${y + 392}" width="10" height="92" rx="5" fill="url(#button)"/>
    <rect x="${x + w - 3}" y="${y + 270}" width="10" height="138" rx="5" fill="url(#button)"/>
    ${style === "base" ? "" : `<rect x="${x + w - 3}" y="${y + 590}" width="9" height="96" rx="4.5" fill="${shade(color, -22)}"/>`}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#frame)"/>
    <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="${r - 8}" fill="url(#panel)"/>
    <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="${r - 8}" fill="url(#sheen)"/>
    <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="${r - 8}" fill="none" stroke="#000" stroke-opacity="0.12" stroke-width="2"/>
    ${camera}`,
    defs,
  );
}

export function phoneFront(color: string): string {
  const x = 380;
  const y = 92;
  const w = 440;
  const h = 950;
  const font = `font-family="SF Pro Display, -apple-system, Helvetica Neue, Arial, sans-serif"`;
  return doc(
    `${shadow(600, 1072, 240)}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="96" fill="url(#frame)"/>
    <rect x="${x + 9}" y="${y + 9}" width="${w - 18}" height="${h - 18}" rx="88" fill="#040405"/>
    ${wallRect("wall", x + 21, y + 21, w - 42, h - 42, 76)}
    <text x="600" y="${y + 278}" text-anchor="middle" ${font} font-size="150" font-weight="700" fill="#fff" fill-opacity="0.95" letter-spacing="-4">9:41</text>
    <g fill="#fff" fill-opacity="0.16">
      <circle cx="${x + 132}" cy="${y + 360}" r="40"/><circle cx="${x + 228}" cy="${y + 360}" r="40"/>
      <rect x="${x + 284}" y="${y + 320}" width="96" height="80" rx="24"/>
    </g>
    <path d="M${x + 132} ${y + 330} a30 30 0 1 1 -0.1 0" fill="none" stroke="#7ef59b" stroke-width="7" stroke-linecap="round" stroke-dasharray="140 200"/>
    <path d="M${x + 228} ${y + 330} a30 30 0 1 1 -0.1 0" fill="none" stroke="#ffd166" stroke-width="7" stroke-linecap="round" stroke-dasharray="90 200"/>
    <g fill="#fff" fill-opacity="0.18"><circle cx="${x + 100}" cy="${y + h - 120}" r="40"/><circle cx="${x + w - 100}" cy="${y + h - 120}" r="40"/></g>
    <rect x="${x + 156}" y="${y + 40}" width="128" height="38" rx="19" fill="#000"/>
    <circle cx="${x + 258}" cy="${y + 59}" r="7" fill="#121424"/>
    <rect x="${x + 150}" y="${y + h - 46}" width="140" height="8" rx="4" fill="#fff" fill-opacity="0.85"/>
    <path d="M${x + 20} ${y + 20} L${x + 260} ${y + 20} L${x + 20} ${y + 520} Z" fill="#fff" opacity="0.06"/>`,
    metalDefs("frame", shade(color, luminance(color) > 150 ? -6 : 6)) + wallDefs("wall", color),
  );
}

/** macOS-like desktop: wallpaper, menu bar and dock. */
function macScreen(id: string, x: number, y: number, w: number, h: number, r = 4) {
  const dockW = Math.min(w * 0.5, 420);
  const icon = Math.max(10, Math.round(h * 0.055));
  const colors = ["#2f7bff", "#34c759", "#ff9f0a", "#ff375f", "#af52de", "#5ac8fa", "#ffd60a", "#8e8e93", "#ff453a"];
  const n = Math.floor((dockW - icon * 0.6) / (icon * 1.25));
  const dockX = x + (w - dockW) / 2;
  const dockY = y + h - icon * 1.7;
  const icons = Array.from({ length: n }, (_, i) => {
    const ix = dockX + icon * 0.45 + i * icon * 1.25;
    return `<rect x="${ix}" y="${dockY + icon * 0.28}" width="${icon}" height="${icon}" rx="${icon * 0.24}" fill="${colors[i % colors.length]}"/>`;
  }).join("");
  return `${wallRect(id, x, y, w, h, r)}
    <rect x="${x}" y="${y}" width="${w}" height="${Math.max(8, h * 0.035)}" fill="#fff" fill-opacity="0.16"/>
    <rect x="${dockX}" y="${dockY}" width="${dockW}" height="${icon * 1.56}" rx="${icon * 0.45}" fill="#fff" fill-opacity="0.22" stroke="#fff" stroke-opacity="0.3"/>
    ${icons}
    <rect x="${x + w * 0.06}" y="${y + h * 0.14}" width="${w * 0.28}" height="${h * 0.34}" rx="${Math.max(6, h * 0.025)}" fill="#fff" fill-opacity="0.1"/>
    <path d="M${x} ${y} L${x + w * 0.42} ${y} L${x} ${y + h * 0.85} Z" fill="#fff" opacity="0.05"/>`;
}

function keysRow(y0: number, y1: number, l0: number, r0: number, l1: number, r1: number, n: number, color: string) {
  let out = "";
  const gap = 0.12;
  for (let j = 0; j < n; j++) {
    const a = j / n;
    const b = (j + 1 - gap) / n;
    const xt0 = l0 + (r0 - l0) * a;
    const xt1 = l0 + (r0 - l0) * b;
    const xb0 = l1 + (r1 - l1) * a;
    const xb1 = l1 + (r1 - l1) * b;
    out += `<path d="M${xt0} ${y0} L${xt1} ${y0} L${xb1} ${y1} L${xb0} ${y1} Z" fill="${color}"/>`;
  }
  return out;
}

export function laptopOpen(color: string): string {
  const light = luminance(color) > 150;
  const deckTop = 712;
  const deckBottom = 872;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  // Keyboard well corners (trapezoid in perspective).
  const kt = 726;
  const kb = 808;
  const kl0 = 268;
  const kr0 = 932;
  const kl1 = 230;
  const kr1 = 970;
  let keys = "";
  const rows = 5;
  for (let i = 0; i < rows; i++) {
    const t0 = i / rows + 0.02;
    const t1 = (i + 1) / rows - 0.03;
    const y0 = lerp(kt, kb, t0);
    const y1 = lerp(kt, kb, t1);
    keys += keysRow(y0, y1, lerp(kl0, kl1, t0), lerp(kr0, kr1, t0), lerp(kl0, kl1, t1), lerp(kr0, kr1, t1), i === 4 ? 9 : 14, "#121214");
  }
  return doc(
    `${shadow(600, 892, 520)}
    <rect x="196" y="168" width="808" height="540" rx="28" fill="${shade(color, light ? -26 : -18)}"/>
    <rect x="202" y="174" width="796" height="528" rx="24" fill="#08080a"/>
    ${macScreen("wall", 224, 196, 752, 486, 6)}
    <rect x="562" y="190" width="76" height="20" rx="8" fill="#08080a"/>
    <circle cx="600" cy="199" r="3.5" fill="#1d2133"/>
    <rect x="206" y="704" width="788" height="10" rx="5" fill="${shade(color, -38)}"/>
    <path d="M176 ${deckTop} H1024 L1104 ${deckBottom} H96 Z" fill="url(#deck)"/>
    <path d="M176 ${deckTop} H1024" stroke="#fff" stroke-opacity="${light ? 0.7 : 0.25}" stroke-width="2"/>
    <path d="M${kl0 - 6} ${kt - 6} H${kr0 + 6} L${kr1 + 6} ${kb + 6} H${kl1 - 6} Z" fill="${shade(color, light ? -22 : -30)}"/>
    ${keys}
    <path d="M520 822 H680 L690 864 H510 Z" fill="${shade(color, light ? -5 : 6)}" stroke="#000" stroke-opacity="0.12"/>
    <path d="M96 ${deckBottom} H1104 L1094 ${deckBottom + 14} Q1090 ${deckBottom + 20} 1080 ${deckBottom + 20} H120 Q110 ${deckBottom + 20} 106 ${deckBottom + 14} Z" fill="${shade(color, -26)}"/>
    <rect x="540" y="${deckBottom}" width="120" height="7" rx="3.5" fill="${shade(color, -42)}"/>`,
    lg("deck", 0, 0, 0, 1, [
      [0, shade(color, light ? 12 : 14)],
      [100, shade(color, light ? -14 : -8)],
    ]) + wallDefs("wall", light ? "#ff7a1a" : shade(color, 40)),
  );
}

export function laptopClosed(color: string): string {
  const light = luminance(color) > 150;
  return doc(
    `${shadow(600, 930, 470)}
    <rect x="186" y="296" width="828" height="608" rx="44" fill="${shade(color, -30)}"/>
    <rect x="190" y="292" width="820" height="600" rx="42" fill="url(#lid)"/>
    <rect x="190" y="292" width="820" height="600" rx="42" fill="url(#lidSheen)"/>
    <rect x="193" y="295" width="814" height="594" rx="40" fill="none" stroke="#fff" stroke-opacity="${light ? 0.6 : 0.16}" stroke-width="3"/>
    <rect x="300" y="300" width="600" height="8" rx="4" fill="#000" opacity="0.18"/>
    <rect x="186" y="880" width="828" height="26" rx="13" fill="${shade(color, -24)}"/>`,
    rg("lid", 0.35, 0.3, 0.9, [
      [0, shade(color, light ? 14 : 18)],
      [60, color],
      [100, shade(color, light ? -12 : -10)],
    ]) +
      lg("lidSheen", 0, 0, 1, 1, [
        [0, "#fff", 0],
        [28, "#fff", light ? 0.3 : 0.1],
        [36, "#fff", 0],
        [100, "#fff", 0],
      ]),
  );
}

export function imac(color: string): string {
  return doc(
    `${shadow(600, 1018, 300)}
    <path d="M508 812 H692 L716 994 H484 Z" fill="url(#stand)"/>
    <rect x="452" y="986" width="296" height="22" rx="11" fill="${shade(color, -18)}"/>
    <rect x="124" y="136" width="952" height="716" rx="36" fill="${shade(color, -8)}"/>
    <rect x="130" y="142" width="940" height="704" rx="32" fill="#f6f6f7"/>
    <rect x="158" y="172" width="884" height="518" rx="8" fill="#0a0a0b"/>
    ${macScreen("wall", 166, 180, 868, 502, 4)}
    <path d="M130 726 H1070 V812 Q1070 846 1036 846 H164 Q130 846 130 812 Z" fill="url(#chin)"/>
    <path d="M130 726 H1070" stroke="#fff" stroke-opacity="0.5" stroke-width="2"/>
    <circle cx="600" cy="157" r="5" fill="#1d1d1f" opacity="0.7"/>`,
    lg("chin", 0, 0, 0, 1, [
      [0, shade(color, 14)],
      [55, color],
      [100, shade(color, -10)],
    ]) +
      lg("stand", 0, 0, 1, 0, [
        [0, shade(color, -22)],
        [50, shade(color, 8)],
        [100, shade(color, -22)],
      ]) +
      wallDefs("wall", color),
  );
}

export function display(stand = "#d6d7d9", bezel = "#151516", tint = "#ff8a3d"): string {
  return doc(
    `${shadow(600, 1046, 300)}
    <path d="M552 760 H648 L694 1022 H506 Z" fill="url(#alu)"/>
    <rect x="426" y="1012" width="348" height="24" rx="12" fill="${shade(stand, -16)}"/>
    <rect x="104" y="144" width="992" height="632" rx="30" fill="${shade(stand, -12)}"/>
    <rect x="110" y="150" width="980" height="620" rx="26" fill="${bezel}"/>
    ${macScreen("wall", 134, 174, 932, 572, 6)}`,
    lg("alu", 0, 0, 1, 0, [
      [0, shade(stand, -20)],
      [50, shade(stand, 12)],
      [100, shade(stand, -20)],
    ]) + wallDefs("wall", tint),
  );
}

export function tablet(color: string): string {
  return doc(
    `${shadow(600, 1068, 380)}
    <rect x="396" y="126" width="560" height="864" rx="58" fill="url(#back)"/>
    <rect x="396" y="126" width="560" height="864" rx="58" fill="url(#sheen)"/>
    <circle cx="888" cy="200" r="34" fill="url(#lensRing)"/><circle cx="888" cy="200" r="24" fill="url(#lensGlass)"/><circle cx="888" cy="200" r="24" fill="url(#lensCoat)"/>
    <rect x="244" y="188" width="560" height="864" rx="58" fill="url(#frame)"/>
    <rect x="252" y="196" width="544" height="848" rx="52" fill="#050506"/>
    ${wallRect("wall", 278, 222, 492, 796, 26)}
    <g fill="#fff" fill-opacity="0.14">
      <rect x="306" y="262" width="210" height="210" rx="34"/><rect x="532" y="262" width="210" height="96" rx="28"/><rect x="532" y="376" width="210" height="96" rx="28"/>
    </g>
    <g>${["#2f7bff", "#34c759", "#ff9f0a", "#ff375f", "#af52de", "#5ac8fa"]
      .map((c, i) => `<rect x="${330 + (i % 3) * 140}" y="${540 + Math.floor(i / 3) * 140}" width="96" height="96" rx="24" fill="${c}" fill-opacity="0.85"/>`)
      .join("")}</g>
    <rect x="320" y="930" width="408" height="62" rx="26" fill="#fff" fill-opacity="0.2"/>
    <circle cx="524" cy="209" r="5" fill="#1d2133"/>`,
    metalDefs("frame", shade(color, -4)) +
      lg("back", 0, 0, 1, 1, [
        [0, shade(color, 16)],
        [55, color],
        [100, shade(color, -16)],
      ]) +
      lg("sheen", 0, 0, 1, 1, [
        [0, "#fff", 0],
        [32, "#fff", 0.22],
        [40, "#fff", 0],
        [100, "#fff", 0],
      ]) +
      lensDefs(shade(color, -10)) +
      wallDefs("wall", color),
  );
}

export function headphones(color: string): string {
  const light = luminance(color) > 150;
  const knit = shade(color, light ? -10 : 14);
  return doc(
    `${shadow(600, 1018, 360)}
    <path d="M300 590 Q300 176 600 176 Q900 176 900 590" fill="none" stroke="url(#steel)" stroke-width="24" stroke-linecap="round"/>
    <path d="M338 470 Q352 236 600 236 Q848 236 862 470" fill="none" stroke="${knit}" stroke-width="66" stroke-linecap="round"/>
    <path d="M338 470 Q352 236 600 236 Q848 236 862 470" fill="none" stroke="url(#mesh)" stroke-width="66" stroke-linecap="round"/>
    <rect x="292" y="470" width="20" height="110" rx="10" fill="url(#steel)"/>
    <rect x="888" y="470" width="20" height="110" rx="10" fill="url(#steel)"/>
    <rect x="226" y="548" width="262" height="404" rx="116" fill="url(#cup)"/>
    <rect x="712" y="548" width="262" height="404" rx="116" fill="url(#cup)"/>
    <rect x="226" y="548" width="262" height="404" rx="116" fill="url(#cupSheen)"/>
    <rect x="712" y="548" width="262" height="404" rx="116" fill="url(#cupSheen)"/>
    <rect x="470" y="604" width="46" height="292" rx="23" fill="${shade(color, -20)}"/>
    <rect x="470" y="604" width="46" height="292" rx="23" fill="url(#mesh)"/>
    <rect x="684" y="604" width="46" height="292" rx="23" fill="${shade(color, -20)}"/>
    <rect x="684" y="604" width="46" height="292" rx="23" fill="url(#mesh)"/>
    <rect x="884" y="586" width="34" height="70" rx="12" fill="url(#steel)"/>
    ${Array.from({ length: 6 }, (_, i) => `<line x1="887" y1="${594 + i * 10}" x2="915" y2="${594 + i * 10}" stroke="#000" stroke-opacity="0.2" stroke-width="2"/>`).join("")}
    <rect x="890" y="680" width="22" height="46" rx="11" fill="${shade(color, -18)}"/>`,
    lg("steel", 0, 0, 1, 0, [
      [0, "#9a9ca2"],
      [45, "#f3f4f6"],
      [100, "#8a8c91"],
    ]) +
      lg("cup", 0, 0, 1, 1, [
        [0, shade(color, light ? 12 : 20)],
        [50, color],
        [100, shade(color, light ? -18 : -22)],
      ]) +
      lg("cupSheen", 0, 0, 1, 0, [
        [0, "#fff", 0],
        [18, "#fff", light ? 0.4 : 0.18],
        [30, "#fff", 0],
        [100, "#fff", 0],
      ]) +
      `<pattern id="mesh" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 6h12" stroke="#fff" stroke-opacity="0.16" stroke-width="2"/><path d="M6 0v12" stroke="#000" stroke-opacity="0.08" stroke-width="2"/></pattern>`,
  );
}

export function watch(caseColor: string, band: string): string {
  let ticks = "";
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const major = i % 5 === 0;
    const r1 = major ? 112 : 124;
    ticks += `<line x1="${600 + Math.cos(a) * r1}" y1="${600 + Math.sin(a) * r1}" x2="${600 + Math.cos(a) * 138}" y2="${600 + Math.sin(a) * 138}" stroke="${major ? "#ff9f0a" : "#fff"}" stroke-opacity="${major ? 1 : 0.35}" stroke-width="${major ? 7 : 2.5}" stroke-linecap="round"/>`;
  }
  return doc(
    `${shadow(600, 1122, 210)}
    <rect x="468" y="80" width="264" height="340" rx="40" fill="url(#strap)"/>
    <rect x="468" y="780" width="264" height="340" rx="40" fill="url(#strap)"/>
    ${Array.from({ length: 13 }, (_, i) => `<line x1="482" y1="${100 + i * 24}" x2="718" y2="${100 + i * 24}" stroke="#000" stroke-opacity="0.12" stroke-width="5"/><line x1="482" y1="${800 + i * 24}" x2="718" y2="${800 + i * 24}" stroke="#000" stroke-opacity="0.12" stroke-width="5"/>`).join("")}
    <rect x="388" y="364" width="424" height="472" rx="104" fill="url(#ti)"/>
    <rect x="388" y="364" width="424" height="472" rx="104" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="3"/>
    <rect x="422" y="398" width="356" height="404" rx="80" fill="#030304"/>
    ${ticks}
    <circle cx="600" cy="600" r="70" fill="none" stroke="#ff9f0a" stroke-opacity="0.25" stroke-width="2"/>
    <line x1="600" y1="600" x2="600" y2="500" stroke="#fff" stroke-width="11" stroke-linecap="round"/>
    <line x1="600" y1="600" x2="672" y2="642" stroke="#fff" stroke-width="11" stroke-linecap="round"/>
    <line x1="600" y1="600" x2="534" y2="696" stroke="#ff9f0a" stroke-width="4" stroke-linecap="round"/>
    <circle cx="600" cy="600" r="13" fill="#ff9f0a"/>
    <rect x="370" y="506" width="24" height="118" rx="11" fill="#f25c05"/>
    <rect x="806" y="472" width="38" height="92" rx="15" fill="url(#crown)"/>
    ${Array.from({ length: 7 }, (_, i) => `<line x1="810" y1="${480 + i * 11}" x2="840" y2="${480 + i * 11}" stroke="#000" stroke-opacity="0.22" stroke-width="2"/>`).join("")}
    <rect x="808" y="604" width="24" height="108" rx="11" fill="url(#crown)"/>`,
    lg("ti", 0, 0, 1, 1, [
      [0, shade(caseColor, 26)],
      [45, caseColor],
      [100, shade(caseColor, -26)],
    ]) +
      lg("strap", 0, 0, 1, 0, [
        [0, shade(band, -10)],
        [50, shade(band, 10)],
        [100, shade(band, -12)],
      ]) +
      lg("crown", 0, 0, 1, 0, [
        [0, shade(caseColor, -24)],
        [50, shade(caseColor, 24)],
        [100, shade(caseColor, -24)],
      ]),
  );
}

/** Broadcast dynamic microphone on a yoke (side view). */
export function studioMic(): string {
  return doc(
    `${shadow(600, 1016, 330)}
    <path d="M568 742 Q560 900 610 952" fill="none" stroke="url(#yoke)" stroke-width="34" stroke-linecap="round"/>
    <rect x="552" y="944" width="132" height="46" rx="14" fill="url(#body)"/>
    <path d="M420 520 Q610 372 800 520" fill="none" stroke="url(#yoke)" stroke-width="28" stroke-linecap="round"/>
    <circle cx="420" cy="540" r="26" fill="url(#knob)"/><circle cx="800" cy="540" r="26" fill="url(#knob)"/>
    <rect x="360" y="468" width="560" height="268" rx="128" fill="url(#body)"/>
    <rect x="360" y="468" width="560" height="268" rx="128" fill="url(#bodySheen)"/>
    <rect x="860" y="492" width="118" height="220" rx="58" fill="url(#cap)"/>
    <circle cx="936" cy="602" r="30" fill="#0b0b0c" stroke="#5a5b60" stroke-width="4"/>
    ${[0, 1, 2].map((i) => `<circle cx="${924 + i * 12}" cy="${596 + (i === 1 ? 14 : 0)}" r="4" fill="#9a9ca2"/>`).join("")}
    <rect x="196" y="438" width="320" height="328" rx="150" fill="#141415"/>
    <rect x="196" y="438" width="320" height="328" rx="150" fill="url(#foam)"/>
    <rect x="196" y="438" width="320" height="328" rx="150" fill="url(#foamLight)"/>`,
    lg("body", 0, 0, 0, 1, [
      [0, "#55565b"],
      [40, "#1f1f22"],
      [100, "#2c2c30"],
    ]) +
      lg("bodySheen", 0, 0, 0, 1, [
        [0, "#fff", 0],
        [16, "#fff", 0.22],
        [26, "#fff", 0],
        [100, "#fff", 0],
      ]) +
      lg("cap", 0, 0, 0, 1, [
        [0, "#6b6c71"],
        [50, "#2a2a2d"],
        [100, "#3b3b3f"],
      ]) +
      lg("yoke", 0, 0, 1, 0, [
        [0, "#1d1d20"],
        [50, "#505156"],
        [100, "#1d1d20"],
      ]) +
      rg("knob", 0.35, 0.3, 0.7, [
        [0, "#8a8b90"],
        [100, "#1b1b1d"],
      ]) +
      rg("foamLight", 0.3, 0.25, 0.8, [
        [0, "#fff", 0.18],
        [60, "#fff", 0],
      ]) +
      `<pattern id="foam" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="3" fill="#000" fill-opacity="0.55"/><circle cx="12" cy="12" r="3" fill="#000" fill-opacity="0.55"/><circle cx="12" cy="4" r="1.6" fill="#fff" fill-opacity="0.06"/></pattern>`,
  );
}

/** 27" desktop monitor with a lit desktop and taskbar. */
export function monitor(): string {
  return doc(
    `${shadow(600, 1036, 320)}
    <path d="M556 744 H644 L660 990 H540 Z" fill="url(#neck)"/>
    <path d="M384 996 Q600 950 816 996 L806 1030 H394 Z" fill="url(#base)"/>
    <rect x="96" y="164" width="1008" height="604" rx="16" fill="#1c1d21"/>
    <rect x="104" y="172" width="992" height="560" rx="8" fill="#08090c"/>
    ${wallRect("wall", 110, 178, 980, 548, 4)}
    <rect x="150" y="232" width="420" height="300" rx="12" fill="#fff" fill-opacity="0.12" stroke="#fff" stroke-opacity="0.2"/>
    <rect x="150" y="232" width="420" height="26" rx="12" fill="#fff" fill-opacity="0.16"/>
    <rect x="610" y="300" width="400" height="260" rx="12" fill="#fff" fill-opacity="0.08" stroke="#fff" stroke-opacity="0.16"/>
    <rect x="110" y="690" width="980" height="36" fill="#0b0d16" fill-opacity="0.7"/>
    ${["#2f7bff", "#34c759", "#ff9f0a", "#ff375f", "#af52de", "#5ac8fa"].map((c, i) => `<rect x="${492 + i * 38}" y="698" width="22" height="22" rx="6" fill="${c}"/>`).join("")}
    <rect x="96" y="732" width="1008" height="36" rx="10" fill="#1c1d21"/>
    <rect x="560" y="745" width="80" height="6" rx="3" fill="#3a3b40"/>
    <circle cx="1062" cy="750" r="5" fill="#9fe3ff"/>`,
    lg("neck", 0, 0, 1, 0, [
      [0, "#1d1e22"],
      [50, "#4a4b51"],
      [100, "#1d1e22"],
    ]) +
      lg("base", 0, 0, 0, 1, [
        [0, "#3a3b40"],
        [100, "#16171a"],
      ]) +
      wallDefs("wall", "#2f7bff"),
  );
}
