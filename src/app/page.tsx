import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t("eyebrow")}</p>
      <h1 className="mt-2 max-w-3xl text-4xl font-bold sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{t("subtitle")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/order" className="btn btn-primary">{t("ctaOrder")}</Link>
        <Link href="/studio" className="btn btn-ghost">{t("ctaStudio")}</Link>
      </div>
    </section>
  );
}
