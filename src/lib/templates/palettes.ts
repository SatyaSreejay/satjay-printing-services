import type { Palette } from "./types";

/** Fixed print colours. These never follow the site's light/dark theme. */
export const P = {
  ink: { id: "ink", bg: "#ffffff", fg: "#1d1d1f", accent: "#b0124f", onAccent: "#ffffff", muted: "#5c5c63" },
  navy: { id: "navy", bg: "#ffffff", fg: "#13233f", accent: "#1f4e8c", onAccent: "#ffffff", muted: "#5a6474" },
  gold: { id: "gold", bg: "#faf6ee", fg: "#2b2418", accent: "#9c7428", onAccent: "#ffffff", muted: "#6e6252" },
  forest: { id: "forest", bg: "#ffffff", fg: "#17291e", accent: "#2e7d4f", onAccent: "#ffffff", muted: "#5a6b60" },
  charcoal: { id: "charcoal", bg: "#1f2023", fg: "#f4f1ea", accent: "#e0b84c", onAccent: "#1f2023", muted: "#b9b4a8" },
  sunrise: { id: "sunrise", bg: "#fff7e6", fg: "#2a1a00", accent: "#e4572e", onAccent: "#ffffff", muted: "#7a5c3a" },
  ocean: { id: "ocean", bg: "#eef7fb", fg: "#0c2a3a", accent: "#0081a7", onAccent: "#ffffff", muted: "#4c6a7a" },
  festive: { id: "festive", bg: "#4a0d1c", fg: "#fff3d6", accent: "#f2b705", onAccent: "#3a0a14", muted: "#f0cfa0" },
  temple: { id: "temple", bg: "#fffaf0", fg: "#3b1d0e", accent: "#b5321f", onAccent: "#fff6e0", muted: "#7b5a43" },
  // T-shirt palettes: bg is the shirt colour, fg the main ink.
  shirtWhite: { id: "shirtWhite", bg: "#f7f7f5", fg: "#151515", accent: "#c2185b", onAccent: "#ffffff", muted: "#555555" },
  shirtBlack: { id: "shirtBlack", bg: "#1b1b1d", fg: "#ffffff", accent: "#f2b705", onAccent: "#1b1b1d", muted: "#c9c9c9" },
  shirtNavy: { id: "shirtNavy", bg: "#1d2b4f", fg: "#ffffff", accent: "#ff8a3d", onAccent: "#1d2b4f", muted: "#c7cee0" },
  shirtRed: { id: "shirtRed", bg: "#b3202a", fg: "#ffffff", accent: "#ffd23f", onAccent: "#b3202a", muted: "#ffd9d9" },
  shirtGrey: { id: "shirtGrey", bg: "#b9bcbf", fg: "#1a1a1a", accent: "#0b5394", onAccent: "#ffffff", muted: "#333333" },
} satisfies Record<string, Palette>;

export const cardPalettes = [P.ink, P.navy, P.gold, P.forest, P.charcoal];
export const bannerPalettes = [P.sunrise, P.ocean, P.ink, P.festive];
export const docPalettes = [P.navy, P.ink, P.forest, P.gold, P.temple];
export const menuPalettes = [P.gold, P.charcoal, P.forest, P.temple];
export const shirtPalettes = [P.shirtWhite, P.shirtBlack, P.shirtNavy, P.shirtRed, P.shirtGrey];
