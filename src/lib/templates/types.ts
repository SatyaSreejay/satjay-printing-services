import type { ServiceId } from "../catalog";

export interface Palette {
  id: string;
  /** Page / background colour. */
  bg: string;
  /** Main text colour. */
  fg: string;
  /** Accent used for bands, rules and highlights. */
  accent: string;
  /** Text colour placed on top of the accent. */
  onAccent: string;
  /** Secondary text colour. */
  muted: string;
}

export interface TemplateField {
  id: string;
  multiline?: boolean;
  maxLength: number;
}

export interface Artwork {
  /** data:image/... URL or a same-site path. Validated by sanitizeHref. */
  href: string;
  /** Darken/lighten the artwork so overlaid text stays readable (0–0.8). */
  scrim?: number;
}

export interface RenderInput {
  values: Record<string, string>;
  palette: Palette;
  /** Optional logo image (data URL or same-site path). */
  logo?: string;
  /** Optional text-free AI artwork placed behind the text. */
  artwork?: Artwork;
  /** Draw trim and safe-area guides (screen only, never for print files). */
  guides?: boolean;
}

export interface DesignTemplate {
  id: string;
  service: ServiceId;
  /** Trim size in millimetres. The SVG viewBox uses the same units. */
  widthMm: number;
  heightMm: number;
  /** Safe margin inside the trim line, in mm. */
  safeMm: number;
  fields: TemplateField[];
  palettes: Palette[];
  /** Whether the layout has a logo slot. */
  logo?: boolean;
  /** Whether AI artwork can sit behind the layout. */
  artwork?: boolean;
  render(input: RenderInput): string;
}

/** What a customer's design choice looks like when saved with an order. */
export interface DesignSnapshot {
  templateId: string;
  paletteId: string;
  values: Record<string, string>;
}
