import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { business, whatsappLink } from "@/config/business";

export async function Footer() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold">{business.name}</p>
          <p className="text-muted">{business.tagline}</p>
          <p className="mt-3 text-sm text-muted">{t("noPrices")}</p>
        </div>
        <div>
          <p className="font-semibold">{t("contact")}</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              {t("phone")}: <a className="underline" href={`tel:${business.phoneE164}`}>{business.phoneDisplay}</a>
            </li>
            <li>
              WhatsApp: <a className="underline" href={whatsappLink()} target="_blank" rel="noopener noreferrer">{business.phoneDisplay}</a>
            </li>
            <li>
              {t("email")}: <a className="underline" href={`mailto:${business.email}`}>{business.email}</a>
            </li>
            {business.addressLines.length > 0 && (
              <li className="pt-1 text-muted">
                {business.addressLines.map((line) => (
                  <span key={line} className="block">{line}</span>
                ))}
              </li>
            )}
            {business.hours && <li className="text-muted">{t("hours")}: {business.hours}</li>}
            {business.mapUrl && (
              <li>
                <a className="underline" href={business.mapUrl} target="_blank" rel="noopener noreferrer">{t("map")}</a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="font-semibold">{t("links")}</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link className="underline" href="/services">{nav("services")}</Link></li>
            <li><Link className="underline" href="/studio">{nav("studio")}</Link></li>
            <li><Link className="underline" href="/order">{nav("order")}</Link></li>
            <li><Link className="underline" href="/track">{nav("track")}</Link></li>
          </ul>
        </div>
      </div>
      <p className="pb-20 text-center text-xs text-muted">
        © {new Date().getFullYear()} {business.name}
      </p>
    </footer>
  );
}
