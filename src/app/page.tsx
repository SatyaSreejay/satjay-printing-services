import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { services } from "@/lib/catalog";

export default async function HomePage() {
  const t = await getTranslations("home");
  const c = await getTranslations("catalog");
  const steps = [1, 2, 3] as const;
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "conic-gradient(#00a0b0,#c2185b,#f2b705,#00a0b0)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t("eyebrow")}</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{t("subtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/order" className="btn btn-primary">{t("ctaOrder")}</Link>
            <Link href="/studio" className="btn btn-ghost">{t("ctaStudio")}</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">{t("servicesTitle")}</h2>
          <Link href="/services" className="text-sm font-semibold text-primary underline">{t("servicesAll")}</Link>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <li key={s.id}>
              <Link href={`/services#${s.id}`} className="card flex h-full flex-col p-4 transition hover:-translate-y-0.5">
                <span aria-hidden className="text-3xl">{s.icon}</span>
                <span className="mt-2 font-semibold">{c(`services.${s.id}.name`)}</span>
                <span className="mt-1 text-sm text-muted">{c(`services.${s.id}.description`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-surface-2/60 border-y border-border">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold">{t("howTitle")}</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((n) => (
              <li key={n} className="card p-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary font-bold text-primary-contrast">{n}</span>
                <h3 className="mt-3 font-semibold">{t(`how${n}Title`)}</h3>
                <p className="mt-1 text-muted">{t(`how${n}Body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="card flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">{t("trackTitle")}</h2>
            <p className="text-muted">{t("trackBody")}</p>
          </div>
          <Link href="/track" className="btn btn-ghost">{t("trackCta")}</Link>
        </div>
      </section>
    </>
  );
}
