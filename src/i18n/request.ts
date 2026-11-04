import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, localeCookie, type Locale } from "./config";

type Messages = Record<string, unknown>;

/** Deep-merge so any key missing from a translation falls back to English. */
function merge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = base[key];
    if (
      value && typeof value === "object" && !Array.isArray(value) &&
      baseValue && typeof baseValue === "object" && !Array.isArray(baseValue)
    ) {
      out[key] = merge(baseValue as Messages, value as Messages);
    } else {
      out[key] = value;
    }
  }
  return out;
}

async function detectLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(localeCookie)?.value;
  // English is the default; visitors switch with the language switcher.
  return isLocale(fromCookie) ? fromCookie : defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await detectLocale();
  const en = (await import("../../messages/en.json")).default as Messages;
  if (locale === "en") return { locale, messages: en };
  const local = (await import(`../../messages/${locale}.json`)).default as Messages;
  return { locale, messages: merge(en, local) };
});
