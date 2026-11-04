import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getService } from "@/lib/catalog";
import { OrderForm } from "./OrderForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("order");
  return { title: t("title") };
}

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ service?: string; design?: string }> }) {
  const t = await getTranslations("order");
  const sp = await searchParams;
  const service = getService(sp.service)?.id ?? "";
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>
      <OrderForm initialService={service} withDesign={sp.design === "1"} />
    </section>
  );
}
