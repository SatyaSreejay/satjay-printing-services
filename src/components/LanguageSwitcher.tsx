"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { localeCookie, localeNames, locales, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    document.cookie = `${localeCookie}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <label className="inline-flex items-center gap-1.5 text-sm">
      <span className="sr-only">{t("label")}</span>
      <span aria-hidden>🌐</span>
      <select
        className="input !w-auto !py-1.5 !pl-2 !pr-7 text-sm"
        value={locale}
        disabled={pending}
        onChange={(e) => change(e.target.value as Locale)}
        aria-label={t("label")}
      >
        {locales.map((l) => (
          <option key={l} value={l} lang={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
