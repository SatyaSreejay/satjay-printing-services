/**
 * Small SVG helpers shared by all templates. Every bit of customer text goes
 * through esc(), so templates are safe to render as raw markup.
 */
import type { Artwork, RenderInput } from "./types";

export const SANS = `'Noto Sans','Noto Sans Telugu','Noto Sans Devanagari',sans-serif`;
export const SERIF = `'Noto Serif','Noto Sans Telugu','Noto Sans Devanagari',serif`;

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only allow embedded raster images or same-site paths as image sources. */
export function sanitizeHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(href)) return href;
  if (/^\/[a-z0-9/_\-.?=&%]+$/i.test(href) && !href.startsWith("//")) return href;
  return undefined;
}

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

function graphemes(s: string): string[] {
  return segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s);
}

/**
 * Rough text width estimate in the same units as `size`. Telugu and
 * Devanagari clusters are wider than Latin letters, so they get larger
 * factors. Used to shrink or wrap text so it stays inside the layout.
 */
export function measure(s: string, size: number, bold = false): number {
  let em = 0;
  size *= scriptScale(s);
  for (const g of graphemes(s)) {
    if (/[ఀ-౿]/.test(g)) em += 0.95;
    else if (/[ऀ-ॿ]/.test(g)) em += 0.78;
    else if (g === " ") em += 0.27;
    else if (/[A-Z0-9@#&%MW]/.test(g)) em += 0.66;
    else if (/[il.,:;'|!]/.test(g)) em += 0.28;
    else em += 0.54;
  }
  return em * size * (bold ? 1.06 : 1);
}

/** Largest font size between min and size that fits maxWidth. */
export function fit(s: string, size: number, maxWidth: number, min = size * 0.5, bold = false) {
  const w = measure(s, size, bold);
  if (w <= maxWidth) return size;
  return Math.max(min, (size * maxWidth) / w);
}

/** Word-wrap text into lines no wider than maxWidth. Keeps explicit newlines. */
export function wrap(s: string, size: number, maxWidth: number, bold = false): string[] {
  const out: string[] = [];
  for (const para of s.split(/\r?\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push("");
      continue;
    }
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (line && measure(next, size, bold) > maxWidth) {
        out.push(line);
        line = w;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}

export interface TextOpts {
  size: number;
  fill: string;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  family?: string;
  /** Shrink to fit this width (mm). */
  maxWidth?: number;
  minSize?: number;
  letterSpacing?: number;
  italic?: boolean;
}

/**
 * Noto Sans Telugu and Devanagari look smaller than Latin at the same point
 * size, so lines in those scripts get a small boost to read at a similar size.
 */
export function scriptScale(s: string): number {
  if (/[\u0C00-\u0C7F]/.test(s)) return 1.12;
  if (/[\u0900-\u097F]/.test(s)) return 1.05;
  return 1;
}

export function text(x: number, y: number, value: string | undefined, o: TextOpts): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  const bold = (o.weight ?? 400) >= 600;
  const base = o.size * scriptScale(v);
  const size = o.maxWidth ? fit(v, base, o.maxWidth, o.minSize, bold) : base;
  const attrs = [
    `x="${r(x)}"`,
    `y="${r(y)}"`,
    `font-size="${r(size)}"`,
    `fill="${o.fill}"`,
    `font-family="${o.family ?? SANS}"`,
    `font-weight="${o.weight ?? 400}"`,
    `text-anchor="${o.anchor ?? "start"}"`,
    o.letterSpacing ? `letter-spacing="${o.letterSpacing}"` : "",
    o.italic ? `font-style="italic"` : "",
  ].filter(Boolean);
  return `<text ${attrs.join(" ")}>${esc(v)}</text>`;
}

/** Multi-line block. Returns markup and the y after the last line. */
export function block(
  x: number,
  y: number,
  value: string | undefined,
  o: TextOpts & { lineHeight?: number; maxLines?: number; maxWidth: number },
): { svg: string; endY: number } {
  const v = (value ?? "").trim();
  if (!v) return { svg: "", endY: y };
  const bold = (o.weight ?? 400) >= 600;
  let lines = wrap(v, o.size, o.maxWidth, bold);
  if (o.maxLines && lines.length > o.maxLines) lines = lines.slice(0, o.maxLines);
  const lh = (o.lineHeight ?? 1.35) * o.size;
  const parts = lines.map((line, i) => text(x, y + i * lh, line, { ...o, maxWidth: o.maxWidth }));
  return { svg: parts.join(""), endY: y + (lines.length - 1) * lh };
}

export function r(n: number) {
  return Math.round(n * 100) / 100;
}

/** Up to two initials for the fallback logo mark. */
export function initials(name: string | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const g = (w: string) => graphemes(w)[0] ?? "";
  return words.length === 1 ? g(words[0]) : g(words[0]) + g(words[words.length - 1]);
}

/** Logo image if supplied, otherwise a circle with initials. */
export function logoMark(
  cx: number,
  cy: number,
  size: number,
  input: RenderInput,
  fallbackName: string | undefined,
  colors: { bg: string; fg: string },
): string {
  const href = sanitizeHref(input.logo);
  if (href) {
    return `<image href="${esc(href)}" x="${r(cx - size / 2)}" y="${r(cy - size / 2)}" width="${r(size)}" height="${r(size)}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  const ini = initials(fallbackName);
  if (!ini) return "";
  return (
    `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(size / 2)}" fill="${colors.bg}"/>` +
    text(cx, cy + size * 0.17, ini.toUpperCase(), { size: size * 0.42, fill: colors.fg, weight: 700, anchor: "middle" })
  );
}

/** Wrap template content in an SVG document sized in millimetres. */
export function doc(
  w: number,
  h: number,
  bg: string,
  body: string,
  input: RenderInput,
  safeMm: number,
): string {
  const art = artworkLayer(w, h, input.artwork);
  const guides = input.guides
    ? `<rect x="${safeMm}" y="${safeMm}" width="${r(w - safeMm * 2)}" height="${r(h - safeMm * 2)}" fill="none" stroke="#00a0e9" stroke-width="${r(Math.max(w, h) / 600)}" stroke-dasharray="${r(Math.max(w, h) / 120)}" opacity="0.8"/>`
    : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" role="img">` +
    `<rect width="${w}" height="${h}" fill="${bg}"/>` +
    art +
    body +
    guides +
    `</svg>`
  );
}

function artworkLayer(w: number, h: number, artwork: Artwork | undefined): string {
  const href = sanitizeHref(artwork?.href);
  if (!href) return "";
  const scrim = Math.min(0.8, Math.max(0, artwork?.scrim ?? 0));
  return (
    `<image href="${esc(href)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>` +
    (scrim ? `<rect width="${w}" height="${h}" fill="#000" opacity="${scrim}"/>` : "")
  );
}
