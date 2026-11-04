import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TrackForm } from "./TrackForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("track");
  return { title: t("title") };
}

export default async function TrackPage() {
  const t = await getTranslations("track");
  return (
    <section className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>
      <TrackForm />
    </section>
  );
}
