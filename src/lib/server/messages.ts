import "server-only";
import { createTranslator } from "next-intl";
import en from "../../../messages/en.json";
import te from "../../../messages/te.json";
import hi from "../../../messages/hi.json";
import { defaultLocale, isLocale } from "@/i18n/config";

type Messages = Record<string, unknown>;
const all: Record<string, Messages> = { en, te, hi };

function merge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = base[k];
    out[k] =
      v && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object" && !Array.isArray(b)
        ? merge(b as Messages, v as Messages)
        : v;
  }
  return out;
}

/** Translator for code that runs outside a page request (emails, WhatsApp). */
export function translatorFor(locale: string): (key: string, values?: Record<string, string | number>) => string {
  const l = isLocale(locale) ? locale : defaultLocale;
  const messages = (l === "en" ? en : merge(en, all[l] ?? {})) as Messages;
  const t = createTranslator({ locale: l, messages }) as unknown as (key: string, values?: Record<string, string | number>) => string;
  return (key, values) => t(key, values);
}
