import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { whatsappLink } from "@/config/business";
import { getService } from "@/lib/catalog";
import { renderSnapshot } from "@/lib/templates";
import { formatBytes, toPublic } from "@/lib/tickets";
import { ticketByToken } from "@/lib/server/ticketStore";
import { fileLink } from "@/lib/server/links";
import { StatusTimeline } from "@/components/StatusTimeline";
import { DesignPreview } from "@/components/DesignPreview";

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations("track");
  const c = await getTranslations("catalog");
  const s = await getTranslations("status");
  const format = await getFormatter();
  const ticket = await ticketByToken(token);

  if (!ticket) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16">
        <p className="notice notice-warn">{t("notFoundLink")}</p>
        <Link href="/track" className="btn btn-primary mt-6">{t("title")}</Link>
      </section>
    );
  }

  const p = toPublic(ticket);
  const svc = getService(p.service);
  const logo = ticket.design?.logoKey ? fileLink(ticket.id, ticket.design.logoKey, false) : undefined;
  const designSvg = ticket.design ? renderSnapshot(ticket.design, { logo }) : null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("orderTitle", { id: p.id })}</h1>
      <p className="mt-1 text-muted">{t("placed", { date: format.dateTime(new Date(p.createdAt), { dateStyle: "long", timeZone: "Asia/Kolkata" }) })}</p>
      <p className="mt-1 text-sm text-muted">{t("bookmark")}</p>

      <div className="card mt-6 p-5">
        <p className="text-sm text-muted">{t("currentStatus")}</p>
        <p className="text-2xl font-bold text-primary">{s(p.status)}</p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold">{t("history")}</h2>
          <StatusTimeline history={p.history} />
        </div>
        <div className="card p-5">
          <h2 className="font-bold">{t("summary")}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-muted">{t("service")}</dt><dd>{svc ? c(`services.${svc.id}.name`) : p.otherService}</dd></div>
            <div><dt className="text-muted">{t("quantity")}</dt><dd>{p.quantity}</dd></div>
            {p.files.length > 0 && (
              <div>
                <dt className="text-muted">{t("files")}</dt>
                <dd><ul>{p.files.map((f) => <li key={f.name}>{f.name} ({formatBytes(f.size)})</li>)}</ul></dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {designSvg && (
        <div className="mt-6">
          <h2 className="mb-3 font-bold">{t("design")}</h2>
          <div className="max-w-lg"><DesignPreview svg={designSvg} label={t("design")} /></div>
        </div>
      )}

      <p className="mt-8 text-sm">
        {t("help")}{" "}
        <a className="font-semibold text-primary underline" href={whatsappLink(p.id)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </p>
    </section>
  );
}
