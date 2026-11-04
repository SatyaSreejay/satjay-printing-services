import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { services } from "@/lib/catalog";
import { ServiceCard } from "@/components/ServiceCard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("services");
  return { title: t("title") };
}

export default async function ServicesPage() {
  const t = await getTranslations("services");
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 max-w-3xl text-muted">{t("subtitle")}</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} detailed />
        ))}
      </div>
    </section>
  );
}
