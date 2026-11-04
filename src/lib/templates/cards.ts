import { cardPalettes, docPalettes } from "./palettes";
import { doc, logoMark, r, SERIF, text } from "./svg";
import type { DesignTemplate } from "./types";

// Indian / US standard visiting card: 3.5 × 2 in.
const W = 88.9;
const H = 50.8;

const cardFields = [
  { id: "name", maxLength: 40 },
  { id: "title", maxLength: 50 },
  { id: "company", maxLength: 50 },
  { id: "phone", maxLength: 40 },
  { id: "email", maxLength: 60 },
  { id: "address", maxLength: 90 },
  { id: "website", maxLength: 50 },
];

export const visitingCardClassic: DesignTemplate = {
  id: "vc-classic",
  service: "visitingCard",
  widthMm: W,
  heightMm: H,
  safeMm: 3,
  fields: cardFields,
  palettes: cardPalettes,
  render(input) {
    const { values: v, palette: p } = input;
    const cx = W / 2;
    const mw = W - 10;
    const body = [
      text(cx, 9.5, v.company?.toUpperCase(), { size: 2.6, fill: p.accent, weight: 700, anchor: "middle", maxWidth: mw, letterSpacing: 0.25 }),
      text(cx, 20.5, v.name, { size: 5.4, fill: p.fg, weight: 700, anchor: "middle", maxWidth: mw }),
      text(cx, 25.6, v.title, { size: 2.7, fill: p.muted, anchor: "middle", maxWidth: mw }),
      `<rect x="${r(cx - 9)}" y="28.4" width="18" height="0.45" fill="${p.accent}"/>`,
      text(cx, 34.2, v.phone, { size: 2.5, fill: p.fg, anchor: "middle", maxWidth: mw }),
      text(cx, 38.0, v.email, { size: 2.4, fill: p.fg, anchor: "middle", maxWidth: mw }),
      text(cx, 41.8, v.address, { size: 2.25, fill: p.muted, anchor: "middle", maxWidth: mw, minSize: 1.6 }),
      text(cx, 45.6, v.website, { size: 2.3, fill: p.accent, anchor: "middle", maxWidth: mw }),
    ].join("");
    return doc(W, H, p.bg, body, input, 3);
  },
};

export const visitingCardModern: DesignTemplate = {
  id: "vc-modern",
  service: "visitingCard",
  widthMm: W,
  heightMm: H,
  safeMm: 3,
  fields: cardFields,
  palettes: cardPalettes,
  logo: true,
  render(input) {
    const { values: v, palette: p } = input;
    const band = 30;
    const x = band + 6;
    const mw = W - x - 4;
    const rows: string[] = [];
    const contacts = [v.phone, v.email, v.address, v.website].filter((s) => s?.trim());
    contacts.forEach((c, i) => {
      const y = 29.5 + i * 4.3;
      rows.push(`<rect x="${x}" y="${r(y - 1.7)}" width="1.3" height="1.3" fill="${p.accent}"/>`);
      rows.push(text(x + 2.6, y, c, { size: 2.3, fill: p.fg, maxWidth: mw - 2.6, minSize: 1.6 }));
    });
    const body = [
      `<rect x="0" y="0" width="${band}" height="${H}" fill="${p.accent}"/>`,
      logoMark(band / 2, 21, 15, input, v.company || v.name, { bg: p.onAccent, fg: p.accent }),
      text(band / 2, 38, v.company, { size: 2.5, fill: p.onAccent, weight: 700, anchor: "middle", maxWidth: band - 4, minSize: 1.6 }),
      text(x, 14.5, v.name, { size: 4.8, fill: p.fg, weight: 700, maxWidth: mw }),
      text(x, 19.4, v.title, { size: 2.6, fill: p.muted, maxWidth: mw }),
      `<rect x="${x}" y="22.2" width="10" height="0.45" fill="${p.accent}"/>`,
      ...rows,
    ].join("");
    return doc(W, H, p.bg, body, input, 3);
  },
};

export const visitingCardBold: DesignTemplate = {
  id: "vc-bold",
  service: "visitingCard",
  widthMm: W,
  heightMm: H,
  safeMm: 3,
  fields: cardFields,
  palettes: cardPalettes,
  artwork: true,
  render(input) {
    const { values: v, palette: p } = input;
    const x = 6;
    const mw = W - 12;
    const body = [
      text(x, 9.5, v.company?.toUpperCase(), { size: 2.5, fill: p.onAccent, weight: 700, maxWidth: mw, letterSpacing: 0.3 }),
      text(x, 22.5, v.name, { size: 6.4, fill: p.onAccent, weight: 700, maxWidth: mw }),
      text(x, 28, v.title, { size: 2.9, fill: p.onAccent, maxWidth: mw }),
      `<rect x="0" y="33" width="${W}" height="${r(H - 33)}" fill="${p.bg}"/>`,
      text(x, 38.4, v.phone, { size: 2.4, fill: p.fg, weight: 600, maxWidth: mw / 2 - 1 }),
      text(W - x, 38.4, v.email, { size: 2.3, fill: p.fg, anchor: "end", maxWidth: mw / 2 - 1 }),
      text(x, 42.4, v.address, { size: 2.2, fill: p.muted, maxWidth: mw, minSize: 1.6 }),
      text(x, 46.2, v.website, { size: 2.2, fill: p.accent, weight: 600, maxWidth: mw }),
    ].join("");
    return doc(W, H, p.accent, body, input, 3);
  },
};

// A4 letterheads.
const A4W = 210;
const A4H = 297;
const letterFields = [
  { id: "company", maxLength: 60 },
  { id: "tagline", maxLength: 80 },
  { id: "phone", maxLength: 40 },
  { id: "email", maxLength: 60 },
  { id: "website", maxLength: 50 },
  { id: "address", maxLength: 140 },
  { id: "footerNote", maxLength: 80 },
];

export const letterheadCorporate: DesignTemplate = {
  id: "lh-corporate",
  service: "letterhead",
  widthMm: A4W,
  heightMm: A4H,
  safeMm: 10,
  fields: letterFields,
  palettes: docPalettes,
  logo: true,
  render(input) {
    const { values: v, palette: p } = input;
    const body = [
      `<rect x="0" y="0" width="${A4W}" height="4" fill="${p.accent}"/>`,
      logoMark(27, 24, 20, input, v.company, { bg: p.accent, fg: p.onAccent }),
      text(42, 24, v.company, { size: 7.6, fill: p.fg, weight: 700, maxWidth: 95, minSize: 4.5 }),
      text(42, 30.5, v.tagline, { size: 3.4, fill: p.muted, maxWidth: 95, minSize: 2.4 }),
      text(195, 18.5, v.phone, { size: 3.1, fill: p.fg, anchor: "end", maxWidth: 55 }),
      text(195, 23.5, v.email, { size: 3.1, fill: p.fg, anchor: "end", maxWidth: 55 }),
      text(195, 28.5, v.website, { size: 3.1, fill: p.accent, anchor: "end", maxWidth: 55 }),
      `<rect x="15" y="39" width="180" height="0.5" fill="${p.accent}"/>`,
      `<rect x="15" y="270" width="180" height="0.35" fill="${p.muted}"/>`,
      text(A4W / 2, 276.5, v.address, { size: 3, fill: p.muted, anchor: "middle", maxWidth: 180, minSize: 2.2 }),
      text(A4W / 2, 281.5, v.footerNote, { size: 2.6, fill: p.muted, anchor: "middle", maxWidth: 180 }),
    ].join("");
    return doc(A4W, A4H, p.bg, body, input, 10);
  },
};

export const letterheadTraditional: DesignTemplate = {
  id: "lh-traditional",
  service: "letterhead",
  widthMm: A4W,
  heightMm: A4H,
  safeMm: 10,
  fields: letterFields,
  palettes: docPalettes,
  logo: true,
  render(input) {
    const { values: v, palette: p } = input;
    const contactLine = [v.phone, v.email, v.website].filter((s) => s?.trim()).join("  •  ");
    const body = [
      logoMark(A4W / 2, 21, 17, input, v.company, { bg: p.accent, fg: p.onAccent }),
      text(A4W / 2, 41, v.company, { size: 9, fill: p.accent, weight: 700, anchor: "middle", family: SERIF, maxWidth: 175, minSize: 5 }),
      text(A4W / 2, 48, v.tagline, { size: 3.8, fill: p.muted, anchor: "middle", family: SERIF, italic: true, maxWidth: 170 }),
      text(A4W / 2, 55, contactLine, { size: 3.1, fill: p.fg, anchor: "middle", maxWidth: 180, minSize: 2.2 }),
      `<rect x="15" y="60" width="180" height="0.7" fill="${p.accent}"/><rect x="15" y="61.6" width="180" height="0.25" fill="${p.accent}"/>`,
      `<rect x="15" y="269" width="180" height="0.25" fill="${p.accent}"/><rect x="15" y="270.2" width="180" height="0.7" fill="${p.accent}"/>`,
      text(A4W / 2, 277, v.address, { size: 3, fill: p.muted, anchor: "middle", maxWidth: 180, minSize: 2.2 }),
      text(A4W / 2, 282, v.footerNote, { size: 2.6, fill: p.muted, anchor: "middle", maxWidth: 180 }),
    ].join("");
    return doc(A4W, A4H, p.bg, body, input, 10);
  },
};
