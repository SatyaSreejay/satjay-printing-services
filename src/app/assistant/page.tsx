import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { aiConfig } from "@/lib/ai/config";
import { imageGenerationEnabled } from "@/lib/ai/imageProvider";
import { Assistant } from "./Assistant";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("assistant");
  return { title: t("title") };
}

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const t = await getTranslations("assistant");
  const nav = await getTranslations("nav");
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>
      {aiConfig.chatEnabled ? (
        <Assistant imagesEnabled={imageGenerationEnabled()} />
      ) : (
        <div className="card mt-8 p-6">
          <h2 className="text-xl font-bold">{t("offTitle")}</h2>
          <p className="mt-2 text-muted">{t("offBody")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/studio" className="btn btn-primary">{nav("studio")}</Link>
            <Link href="/order" className="btn btn-ghost">{nav("order")}</Link>
          </div>
        </div>
      )}
    </section>
  );
}
