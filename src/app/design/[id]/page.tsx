import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getTemplate, renderSnapshot, sizeLabel } from "@/lib/templates";
import { getTicket } from "@/lib/server/ticketStore";
import { designSvgLink, fileLink, verifyDesignLink } from "@/lib/server/links";
import { DesignPreview } from "@/components/DesignPreview";

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

/** Signed page (linked from the shop's email) showing a ticket's studio design. */
export default async function DesignView({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sig?: string }> }) {
  const { id } = await params;
  const { sig } = await searchParams;
  if (!verifyDesignLink(id, sig ?? null)) notFound();
  const ticket = await getTicket(id);
  if (!ticket?.design) notFound();
  const t = await getTranslations("designView");
  const tt = await getTranslations("templates");
  const tpl = getTemplate(ticket.design.templateId);
  const logo = ticket.design.logoKey ? fileLink(ticket.id, ticket.design.logoKey, false) : undefined;
  const svg = renderSnapshot(ticket.design, { logo });
  if (!svg || !tpl) notFound();
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">{t("title")} · {ticket.id}</h1>
      <p className="text-muted">{tt(`names.${tpl.id}`)} · {tt(`palettes.${ticket.design.paletteId}`)} · {sizeLabel(tpl)}</p>
      <div className="mt-6"><DesignPreview svg={svg} label={t("title")} /></div>
      <p className="mt-3 text-sm text-muted">{t("note")}</p>
      <a className="btn btn-ghost mt-4" href={designSvgLink(ticket.id)}>SVG</a>
    </section>
  );
}
