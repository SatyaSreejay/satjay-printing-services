import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getService, type ServiceId } from "@/lib/catalog";
import { Studio } from "./Studio";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("studio");
  return { title: t("title") };
}

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const t = await getTranslations("studio");
  const { service } = await searchParams;
  const initial = (getService(service)?.id ?? "visitingCard") as ServiceId;
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 max-w-3xl text-muted">{t("subtitle")}</p>
      <Studio key={initial} initialService={initial} />
    </section>
  );
}
