export const locales = ["en", "te", "hi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeCookie = "NEXT_LOCALE";

/** Names shown in the language switcher, written in their own script. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
