import { bannerPalettes, docPalettes, menuPalettes, shirtPalettes } from "./palettes";
import { block, doc, logoMark, measure, r, SANS, SERIF, text, wrap } from "./svg";
import type { DesignTemplate, Palette } from "./types";

// ---------- Banners: 6 × 3 ft (1829 × 914 mm) ----------
const BW = 1829;
const BH = 914;

export const bannerPromo: DesignTemplate = {
  id: "bn-promo",
  service: "banner",
  widthMm: BW,
  heightMm: BH,
  safeMm: 30,
  fields: [
    { id: "company", maxLength: 50 },
    { id: "headline", maxLength: 60 },
    { id: "subline", maxLength: 140 },
    { id: "offer", maxLength: 40 },
    { id: "contact", maxLength: 80 },
    { id: "address", maxLength: 120 },
  ],
  palettes: bannerPalettes,
  logo: true,
  artwork: true,
  render(input) {
    const { values: v, palette: p } = input;
    const offerLines = wrap((v.offer ?? "").trim(), 84, 330, true).slice(0, 3);
    const offerTop = 420 - ((offerLines.length - 1) * 84 * 1.15) / 2 + 28;
    const body = [
      `<polygon points="0,0 70,0 0,240" fill="${p.accent}"/>`,
      logoMark(140, 140, 150, input, v.company, { bg: p.accent, fg: p.onAccent }),
      text(240, 162, v.company, { size: 66, fill: p.fg, weight: 700, maxWidth: 950 }),
      text(90, 410, v.headline, { size: 150, fill: p.fg, weight: 700, maxWidth: 1150, minSize: 70 }),
      block(90, 510, v.subline, { size: 62, fill: p.muted, maxWidth: 1120, maxLines: 3, lineHeight: 1.3 }).svg,
      v.offer?.trim()
        ? `<circle cx="1520" cy="420" r="235" fill="${p.accent}"/><circle cx="1520" cy="420" r="205" fill="none" stroke="${p.onAccent}" stroke-width="6" stroke-dasharray="18 14"/>` +
          offerLines
            .map((line, i) => text(1520, offerTop + i * 84 * 1.15, line, { size: 84, fill: p.onAccent, weight: 700, anchor: "middle", maxWidth: 360 }))
            .join("")
        : "",
      `<rect x="0" y="750" width="${BW}" height="164" fill="${p.fg}"/>`,
      text(BW / 2, 818, v.contact, { size: 56, fill: p.bg, weight: 700, anchor: "middle", maxWidth: 1700 }),
      text(BW / 2, 868, v.address, { size: 38, fill: p.bg, anchor: "middle", maxWidth: 1700 }),
    ].join("");
    return doc(BW, BH, p.bg, body, input, 30);
  },
};

export const bannerFestival: DesignTemplate = {
  id: "bn-festival",
  service: "banner",
  widthMm: BW,
  heightMm: BH,
  safeMm: 30,
  fields: [
    { id: "headline", maxLength: 60 },
    { id: "subline", maxLength: 140 },
    { id: "company", maxLength: 60 },
    { id: "contact", maxLength: 80 },
  ],
  palettes: [bannerPalettes[3], bannerPalettes[0], bannerPalettes[2]],
  artwork: true,
  render(input) {
    const { values: v, palette: p } = input;
    const sub = block(BW / 2, 450, v.subline, { size: 68, fill: p.fg, anchor: "middle", maxWidth: 1450, maxLines: 2, lineHeight: 1.3 });
    const dy = (v.subline ?? "").trim() ? sub.endY + 70 : 470;
    const diamonds = Array.from({ length: 9 }, (_, i) => {
      const x = BW / 2 + (i - 4) * 70;
      const s = i === 4 ? 22 : 14;
      return `<rect x="${x - s / 2}" y="${r(dy - s / 2)}" width="${s}" height="${s}" transform="rotate(45 ${x} ${r(dy)})" fill="${p.accent}"/>`;
    }).join("");
    const corners = [
      [80, 80],
      [BW - 80, 80],
      [80, BH - 80],
      [BW - 80, BH - 80],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" fill="${p.accent}"/><circle cx="${x}" cy="${y}" r="12" fill="${p.bg}"/>`)
      .join("");
    const body = [
      `<rect x="30" y="30" width="${BW - 60}" height="${BH - 60}" fill="none" stroke="${p.accent}" stroke-width="18"/>`,
      `<rect x="62" y="62" width="${BW - 124}" height="${BH - 124}" fill="none" stroke="${p.accent}" stroke-width="4"/>`,
      corners,
      text(BW / 2, 340, v.headline, { size: 140, fill: p.accent, weight: 700, anchor: "middle", maxWidth: 1500, minSize: 70 }),
      sub.svg,
      diamonds,
      text(BW / 2, dy + 125, v.company, { size: 76, fill: p.fg, weight: 700, anchor: "middle", maxWidth: 1450 }),
      text(BW / 2, dy + 210, v.contact, { size: 46, fill: p.muted, anchor: "middle", maxWidth: 1450 }),
    ].join("");
    return doc(BW, BH, p.bg, body, input, 30);
  },
};

// ---------- Menu cards: A4 ----------
const A4W = 210;
const A4H = 297;

type MenuRow = { kind: "heading" | "item"; name: string; price?: string };

/** "# Starters" is a heading; "Paneer Tikka | 180" is an item with a price. */
export function parseMenu(src: string | undefined): MenuRow[] {
  return (src ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      if (l.startsWith("#")) return { kind: "heading" as const, name: l.replace(/^#+\s*/, "") };
      const [name, price] = l.split("|").map((s) => s.trim());
      return { kind: "item" as const, name, price: price || undefined };
    });
}

function menuColumns(
  rows: MenuRow[],
  p: Palette,
  o: { top: number; bottom: number; cols: { x: number; w: number }[]; leaders: boolean; headingFamily: string; upperHeadings: boolean },
): string {
  const itemH = 7.2;
  const headH = 11;
  const out: string[] = [];
  let col = 0;
  let y = o.top;
  for (const row of rows) {
    const h = row.kind === "heading" ? headH : itemH;
    if (y + h > o.bottom) {
      col++;
      y = o.top;
      if (col >= o.cols.length) {
        out.push(text(A4W / 2, o.bottom + 4, "…", { size: 5, fill: p.muted, anchor: "middle" }));
        break;
      }
    }
    const { x, w } = o.cols[col];
    if (row.kind === "heading") {
      const label = o.upperHeadings ? row.name.toUpperCase() : row.name;
      out.push(text(x, y + 7, label, { size: 5.2, fill: p.accent, weight: 700, family: o.headingFamily, maxWidth: w, letterSpacing: 0.3 }));
      out.push(`<rect x="${x}" y="${r(y + 8.6)}" width="14" height="0.4" fill="${p.accent}"/>`);
    } else {
      const priceW = row.price ? measure(row.price, 3.9, true) + 2 : 0;
      const nameMax = w - priceW - (o.leaders ? 6 : 2);
      out.push(text(x, y + 5, row.name, { size: 3.9, fill: p.fg, maxWidth: nameMax, minSize: 2.8 }));
      if (row.price) {
        out.push(text(x + w, y + 5, row.price, { size: 3.9, fill: p.fg, weight: 700, anchor: "end" }));
        if (o.leaders) {
          const start = x + Math.min(measure(row.name, 3.9), nameMax) + 1.5;
          const end = x + w - priceW;
          if (end > start)
            out.push(`<line x1="${r(start)}" y1="${r(y + 5)}" x2="${r(end)}" y2="${r(y + 5)}" stroke="${p.muted}" stroke-width="0.3" stroke-dasharray="0.4 1.2"/>`);
        }
      }
    }
    y += h;
  }
  return out.join("");
}

const menuFields = [
  { id: "company", maxLength: 50 },
  { id: "tagline", maxLength: 80 },
  { id: "items", multiline: true, maxLength: 3000 },
  { id: "contact", maxLength: 100 },
];

export const menuClassic: DesignTemplate = {
  id: "mn-classic",
  service: "menuCard",
  widthMm: A4W,
  heightMm: A4H,
  safeMm: 8,
  fields: menuFields,
  palettes: menuPalettes,
  render(input) {
    const { values: v, palette: p } = input;
    const rows = parseMenu(v.items);
    const twoCols = rows.length > 26;
    const body = [
      `<rect x="8" y="8" width="${A4W - 16}" height="${A4H - 16}" fill="none" stroke="${p.accent}" stroke-width="0.8"/>`,
      `<rect x="10" y="10" width="${A4W - 20}" height="${A4H - 20}" fill="none" stroke="${p.accent}" stroke-width="0.25"/>`,
      text(A4W / 2, 36, v.company, { size: 13, fill: p.accent, weight: 700, anchor: "middle", family: SERIF, maxWidth: 170, minSize: 7 }),
      text(A4W / 2, 45, v.tagline, { size: 4, fill: p.muted, anchor: "middle", family: SERIF, italic: true, maxWidth: 170 }),
      `<rect x="${A4W / 2 - 2}" y="49" width="4" height="4" transform="rotate(45 ${A4W / 2} 51)" fill="${p.accent}"/>`,
      `<rect x="${A4W / 2 - 40}" y="50.8" width="34" height="0.35" fill="${p.accent}"/><rect x="${A4W / 2 + 6}" y="50.8" width="34" height="0.35" fill="${p.accent}"/>`,
      menuColumns(rows, p, {
        top: 58,
        bottom: 272,
        cols: twoCols ? [{ x: 18, w: 82 }, { x: 110, w: 82 }] : [{ x: 30, w: 150 }],
        leaders: true,
        headingFamily: SERIF,
        upperHeadings: false,
      }),
      text(A4W / 2, 284, v.contact, { size: 3.6, fill: p.muted, anchor: "middle", maxWidth: 180 }),
    ].join("");
    return doc(A4W, A4H, p.bg, body, input, 8);
  },
};

export const menuCafe: DesignTemplate = {
  id: "mn-cafe",
  service: "menuCard",
  widthMm: A4W,
  heightMm: A4H,
  safeMm: 8,
  fields: menuFields,
  palettes: menuPalettes,
  artwork: true,
  render(input) {
    const { values: v, palette: p } = input;
    const rows = parseMenu(v.items);
    const twoCols = rows.length > 24;
    const body = [
      `<rect x="0" y="0" width="${A4W}" height="62" fill="${p.accent}"/>`,
      text(16, 34, v.company, { size: 14, fill: p.onAccent, weight: 700, maxWidth: 178, minSize: 7 }),
      text(16, 46, v.tagline, { size: 4.4, fill: p.onAccent, maxWidth: 178 }),
      `<rect x="0" y="62" width="${A4W}" height="${A4H - 62}" fill="${p.bg}"/>`,
      menuColumns(rows, p, {
        top: 72,
        bottom: 274,
        cols: twoCols ? [{ x: 16, w: 84 }, { x: 110, w: 84 }] : [{ x: 16, w: 178 }],
        leaders: false,
        headingFamily: SANS,
        upperHeadings: true,
      }),
      `<rect x="16" y="279" width="178" height="0.3" fill="${p.muted}"/>`,
      text(16, 286, v.contact, { size: 3.6, fill: p.muted, maxWidth: 178 }),
    ].join("");
    return doc(A4W, A4H, p.bg, body, input, 8);
  },
};

// ---------- T-shirt front print (mockup) ----------
// The frame is 600 × 640 mm; the print area is 280 × 370 mm (x 160–440, y 130–500).
const TW = 600;
const TH = 640;

export const tshirtFront: DesignTemplate = {
  id: "ts-front",
  service: "tshirt",
  widthMm: TW,
  heightMm: TH,
  safeMm: 0,
  fields: [
    { id: "headline", maxLength: 40 },
    { id: "subline", maxLength: 80 },
    { id: "extra", maxLength: 20 },
  ],
  palettes: shirtPalettes,
  logo: true,
  render(input) {
    const { values: v, palette: p } = input;
    const headLines = wrap((v.headline ?? "").trim(), 56, 270, true).slice(0, 2);
    const headTop = headLines.length > 1 ? 300 : 320;
    const shirt = `<path d="M220 40 Q300 95 380 40 L500 70 L590 200 L520 245 L500 225 L500 630 L100 630 L100 225 L80 245 L10 200 L100 70 Z" fill="${p.bg}" stroke="#00000033" stroke-width="2"/>` +
      `<path d="M220 40 Q300 95 380 40" fill="none" stroke="#00000040" stroke-width="6"/>`;
    const hasLogo = !!input.logo;
    const sub = block(300, headTop + headLines.length * 62 + 14, v.subline, { size: 22, fill: p.fg, anchor: "middle", maxWidth: 270, maxLines: 3, lineHeight: 1.3 });
    const print = [
      hasLogo ? logoMark(300, 205, 110, input, undefined, { bg: p.accent, fg: p.onAccent }) : "",
      ...headLines.map((line, i) => text(300, headTop + i * 62, line, { size: 56, fill: p.fg, weight: 700, anchor: "middle", maxWidth: 275, minSize: 28 })),
      sub.svg,
      text(300, Math.min(490, ((v.subline ?? "").trim() ? sub.endY : headTop + (headLines.length - 1) * 62) + 52), v.extra, { size: 30, fill: p.accent, weight: 700, anchor: "middle", maxWidth: 270, letterSpacing: 2 }),
    ].join("");
    const guides = input.guides
      ? `<rect x="160" y="130" width="280" height="370" fill="none" stroke="#00a0e9" stroke-width="1.5" stroke-dasharray="6"/>`
      : "";
    return doc(TW, TH, "#e9e7e2", shirt + print + guides, { ...input, guides: false }, 0);
  },
};

// ---------- Book / report cover: A5 ----------
const A5W = 148;
const A5H = 210;

export const bookCover: DesignTemplate = {
  id: "bk-cover",
  service: "book",
  widthMm: A5W,
  heightMm: A5H,
  safeMm: 6,
  fields: [
    { id: "institution", maxLength: 80 },
    { id: "title", maxLength: 120 },
    { id: "subtitle", maxLength: 140 },
    { id: "author", maxLength: 80 },
    { id: "details", multiline: true, maxLength: 200 },
  ],
  palettes: docPalettes,
  logo: true,
  artwork: true,
  render(input) {
    const { values: v, palette: p } = input;
    const title = block(A5W / 2, 92, v.title, { size: 8.6, fill: p.fg, weight: 700, anchor: "middle", maxWidth: 124, maxLines: 4, lineHeight: 1.25 });
    const sub = block(A5W / 2, title.endY + 10, v.subtitle, { size: 4.4, fill: p.muted, anchor: "middle", maxWidth: 120, maxLines: 3 });
    const det = block(A5W / 2, 176, v.details, { size: 3.6, fill: p.muted, anchor: "middle", maxWidth: 124, maxLines: 3 });
    const body = [
      `<rect x="0" y="0" width="${A5W}" height="6" fill="${p.accent}"/>`,
      text(A5W / 2, 22, v.institution, { size: 4.8, fill: p.accent, weight: 700, anchor: "middle", maxWidth: 130, minSize: 3 }),
      logoMark(A5W / 2, 48, 24, input, v.institution, { bg: p.accent, fg: p.onAccent }),
      title.svg,
      sub.svg,
      `<rect x="${A5W / 2 - 15}" y="152" width="30" height="0.5" fill="${p.accent}"/>`,
      text(A5W / 2, 165, v.author, { size: 4.6, fill: p.fg, weight: 700, anchor: "middle", maxWidth: 124 }),
      det.svg,
      `<rect x="0" y="198" width="${A5W}" height="12" fill="${p.accent}"/>`,
    ].join("");
    return doc(A5W, A5H, p.bg, body, input, 6);
  },
};

// ---------- DTP: A5 flyer and invitation ----------
export const flyerEvent: DesignTemplate = {
  id: "fl-event",
  service: "dtp",
  widthMm: A5W,
  heightMm: A5H,
  safeMm: 5,
  fields: [
    { id: "headline", maxLength: 60 },
    { id: "subline", maxLength: 100 },
    { id: "date", maxLength: 60 },
    { id: "venue", maxLength: 120 },
    { id: "details", multiline: true, maxLength: 500 },
    { id: "contact", maxLength: 80 },
  ],
  palettes: bannerPalettes,
  artwork: true,
  render(input) {
    const { values: v, palette: p } = input;
    const headCount = Math.min(3, wrap((v.headline ?? "").trim() || " ", 12.5, 124, true).length);
    const head = block(12, 30 + (3 - headCount) * 9, v.headline, { size: 12.5, fill: p.onAccent, weight: 700, maxWidth: 124, maxLines: 3, lineHeight: 1.15 });
    const sub = block(12, head.endY + 10, v.subline, { size: 4.8, fill: p.onAccent, maxWidth: 124, maxLines: 2 });
    const venue = block(12, 122, v.venue, { size: 4.3, fill: p.muted, maxWidth: 124, maxLines: 2 });
    const details = block(12, venue.endY + 12, v.details, { size: 3.9, fill: p.fg, maxWidth: 124, maxLines: 9 });
    const body = [
      `<rect x="0" y="0" width="${A5W}" height="96" fill="${p.accent}"/>`,
      `<polygon points="0,96 ${A5W},96 ${A5W},84" fill="${p.bg}"/>`,
      head.svg,
      sub.svg,
      `<rect x="12" y="105.5" width="3" height="8" fill="${p.accent}"/>`,
      text(18, 112, v.date, { size: 6, fill: p.fg, weight: 700, maxWidth: 118 }),
      venue.svg,
      details.svg,
      `<rect x="0" y="192" width="${A5W}" height="18" fill="${p.fg}"/>`,
      text(A5W / 2, 203.5, v.contact, { size: 4.3, fill: p.bg, weight: 700, anchor: "middle", maxWidth: 130 }),
    ].join("");
    return doc(A5W, A5H, p.accent, `<rect x="0" y="95.5" width="${A5W}" height="${A5H - 95.5}" fill="${p.bg}"/>` + body, input, 5);
  },
};

export const invitation: DesignTemplate = {
  id: "fl-invite",
  service: "dtp",
  widthMm: A5W,
  heightMm: A5H,
  safeMm: 6,
  fields: [
    { id: "invocation", maxLength: 60 },
    { id: "headline", maxLength: 60 },
    { id: "names", multiline: true, maxLength: 120 },
    { id: "details", multiline: true, maxLength: 240 },
    { id: "venue", multiline: true, maxLength: 160 },
    { id: "contact", maxLength: 80 },
  ],
  palettes: [docPalettes[4], docPalettes[3], bannerPalettes[3], docPalettes[1]],
  artwork: true,
  render(input) {
    const { values: v, palette: p } = input;
    const names = block(A5W / 2, 70, v.names, { size: 11, fill: p.accent, weight: 700, anchor: "middle", family: SERIF, maxWidth: 118, maxLines: 4, lineHeight: 1.3 });
    const orn = names.endY + 10;
    const details = block(A5W / 2, orn + 13, v.details, { size: 4.2, fill: p.fg, anchor: "middle", family: SERIF, maxWidth: 118, maxLines: 5 });
    const venue = block(A5W / 2, details.endY + 10, v.venue, { size: 4, fill: p.muted, anchor: "middle", family: SERIF, maxWidth: 118, maxLines: 4 });
    const body = [
      `<rect x="7" y="7" width="${A5W - 14}" height="${A5H - 14}" fill="none" stroke="${p.accent}" stroke-width="1"/>`,
      `<rect x="9.5" y="9.5" width="${A5W - 19}" height="${A5H - 19}" fill="none" stroke="${p.accent}" stroke-width="0.3"/>`,
      text(A5W / 2, 25, v.invocation, { size: 4, fill: p.accent, anchor: "middle", family: SERIF, italic: true, maxWidth: 118 }),
      text(A5W / 2, 44, v.headline?.toUpperCase(), { size: 5, fill: p.muted, anchor: "middle", family: SERIF, letterSpacing: 0.8, maxWidth: 118 }),
      names.svg,
      `<rect x="${A5W / 2 - 2}" y="${r(orn - 2)}" width="4" height="4" transform="rotate(45 ${A5W / 2} ${r(orn)})" fill="${p.accent}"/>`,
      `<rect x="${A5W / 2 - 30}" y="${r(orn - 0.2)}" width="24" height="0.35" fill="${p.accent}"/><rect x="${A5W / 2 + 6}" y="${r(orn - 0.2)}" width="24" height="0.35" fill="${p.accent}"/>`,
      details.svg,
      venue.svg,
      text(A5W / 2, 194, v.contact, { size: 3.5, fill: p.muted, anchor: "middle", family: SERIF, maxWidth: 118 }),
    ].join("");
    return doc(A5W, A5H, p.bg, body, input, 6);
  },
};

