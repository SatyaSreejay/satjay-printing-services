import type { ServiceId } from "../catalog";
import {
  letterheadCorporate,
  letterheadTraditional,
  visitingCardBold,
  visitingCardClassic,
  visitingCardModern,
} from "./cards";
import { bannerFestival, bannerPromo, bookCover, flyerEvent, invitation, menuCafe, menuClassic, tshirtFront } from "./large";
import type { DesignSnapshot, DesignTemplate } from "./types";

export * from "./types";

export const templates: DesignTemplate[] = [
  visitingCardClassic,
  visitingCardModern,
  visitingCardBold,
  letterheadCorporate,
  letterheadTraditional,
  bannerPromo,
  bannerFestival,
  menuClassic,
  menuCafe,
  tshirtFront,
  bookCover,
  flyerEvent,
  invitation,
];

export function getTemplate(id: string | undefined | null) {
  return templates.find((t) => t.id === id);
}

export function templatesFor(service: ServiceId | string | undefined | null) {
  return templates.filter((t) => t.service === service);
}

/** Check a snapshot from the browser and keep only known fields, trimmed to length. */
export function cleanSnapshot(raw: unknown): DesignSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const tpl = getTemplate(typeof r.templateId === "string" ? r.templateId : null);
  if (!tpl) return null;
  const palette = tpl.palettes.find((p) => p.id === r.paletteId) ?? tpl.palettes[0];
  const src = (r.values && typeof r.values === "object" ? r.values : {}) as Record<string, unknown>;
  const values: Record<string, string> = {};
  for (const f of tpl.fields) {
    const v = src[f.id];
    if (typeof v === "string") values[f.id] = v.slice(0, f.maxLength);
  }
  return { templateId: tpl.id, paletteId: palette.id, values };
}

export function renderSnapshot(s: DesignSnapshot, extra?: { logo?: string; guides?: boolean }) {
  const tpl = getTemplate(s.templateId);
  if (!tpl) return null;
  const palette = tpl.palettes.find((p) => p.id === s.paletteId) ?? tpl.palettes[0];
  return tpl.render({ values: s.values, palette, logo: extra?.logo, guides: extra?.guides });
}

/** Human-readable trim size, e.g. "88.9 × 50.8 mm (3.5 × 2 in)". */
export function sizeLabel(t: DesignTemplate) {
  const inch = (mm: number) => Math.round((mm / 25.4) * 10) / 10;
  const ft = (mm: number) => Math.round((mm / 304.8) * 10) / 10;
  if (t.service === "tshirt") return "Print area 28 × 37 cm";
  if (t.widthMm > 1000) return `${ft(t.widthMm)} × ${ft(t.heightMm)} ft`;
  return `${t.widthMm} × ${t.heightMm} mm (${inch(t.widthMm)} × ${inch(t.heightMm)} in)`;
}
