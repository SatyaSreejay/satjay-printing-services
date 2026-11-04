import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate, renderSnapshot, sizeLabel } from "@/lib/templates";
import { formatBytes, ticketStatuses } from "@/lib/tickets";
import { getTicket } from "@/lib/server/ticketStore";
import { designSvgLink, fileLink } from "@/lib/server/links";
import { translatorFor } from "@/lib/server/messages";
import { customerRows, summaryRows } from "@/lib/server/notify/ticketSummary";
import { DesignPreview } from "@/components/DesignPreview";
import { addNote, updateStatus } from "../../../actions";
import { statusClass, statusLabel } from "../../../statusStyle";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,38%)_1fr] gap-x-3 gap-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="whitespace-pre-wrap break-words">{v}</dd></div>
      ))}
    </dl>
  );
}

export default async function AdminTicket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTicket(id);
  if (!t) notFound();
  const tr = translatorFor("en");
  const tpl = t.design ? getTemplate(t.design.templateId) : undefined;
  const logo = t.design?.logoKey ? fileLink(t.id, t.design.logoKey, false) : undefined;
  const svg = t.design ? renderSnapshot(t.design, { logo }) : null;
  const wa = (t.customer.whatsappSame ? t.customer.phone : t.customer.whatsapp ?? "").replace(/\D/g, "");
  const waNumber = wa.length === 10 ? `91${wa}` : wa;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin" className="text-sm underline">← All tickets</Link>
        <h1 className="font-mono text-2xl font-bold">{t.id}</h1>
        <span className={`notice !px-2 !py-0.5 ${statusClass(t.status)}`}>{statusLabel[t.status]}</span>
        <span className="text-sm text-muted">Received {fmt(t.createdAt)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <a className="btn btn-primary !py-2 text-sm" href={`tel:${t.customer.phone.replace(/\s/g, "")}`}>Call {t.customer.name}</a>
        {waNumber && <a className="btn btn-ghost !py-2 text-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello ${t.customer.name}, about your order ${t.id}: `)}`}>WhatsApp</a>}
        {t.customer.email && <a className="btn btn-ghost !py-2 text-sm" href={`mailto:${t.customer.email}?subject=${encodeURIComponent(`Your order ${t.id}`)}`}>Email</a>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5"><h2 className="mb-3 font-bold">Customer</h2><Rows rows={customerRows(t)} /></section>
        <section className="card p-5"><h2 className="mb-3 font-bold">Job</h2><Rows rows={summaryRows(t)} /></section>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">Exact text to print</h2>
        <pre className="whitespace-pre-wrap rounded-lg bg-surface-2 p-4 font-sans text-base">{t.order.text}</pre>
        {t.order.instructions && (<><h3 className="mt-4 font-semibold">Other instructions</h3><p className="whitespace-pre-wrap">{t.order.instructions}</p></>)}
      </section>

      {svg && tpl && (
        <section className="card p-5">
          <h2 className="font-bold">Studio design</h2>
          <p className="mb-3 text-sm text-muted">{tr(`templates.names.${tpl.id}`)} · {tr(`templates.palettes.${t.design!.paletteId}`)} · {sizeLabel(tpl)}</p>
          <div className="max-w-xl"><DesignPreview svg={svg} label="Studio design" /></div>
          <a className="btn btn-ghost mt-3 !py-2 text-sm" href={designSvgLink(t.id)}>Download SVG</a>
        </section>
      )}

      <section className="card p-5">
        <h2 className="mb-3 font-bold">Files ({t.files.length})</h2>
        {t.files.length ? (
          <ul className="space-y-1 text-sm">
            {t.files.map((f) => (
              <li key={f.key}><a className="text-primary underline" href={fileLink(t.id, f.key, false)}>{f.name}</a> <span className="text-muted">({formatBytes(f.size)})</span></li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No files.</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-bold">Update status</h2>
          <form key={`${t.status}-${t.history.length}`} action={updateStatus} className="space-y-3">
            <input type="hidden" name="id" value={t.id} />
            <select name="status" defaultValue={t.status} className="input">
              {ticketStatuses.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
            <div>
              <label className="field-label" htmlFor="note">Note for the customer (optional, shown on their tracking page)</label>
              <textarea id="note" name="note" rows={2} maxLength={500} className="input" />
            </div>
            {t.customer.email && (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" defaultChecked /> Email the customer about this update</label>
            )}
            <div><button className="btn btn-primary">Save status</button></div>
          </form>
          <h3 className="mt-6 font-semibold">History</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {[...t.history].reverse().map((h, i) => (
              <li key={i}><span className="font-medium">{statusLabel[h.status]}</span> <span className="text-muted">· {fmt(h.at)}</span>{h.note && <span className="block text-muted">“{h.note}”</span>}</li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-bold">Internal notes</h2>
          <p className="mb-2 text-sm text-muted">Only visible here: quotes, paper stock, who is handling it…</p>
          <form action={addNote} className="space-y-3">
            <input type="hidden" name="id" value={t.id} />
            <textarea name="text" rows={3} maxLength={2000} className="input" required />
            <button className="btn btn-ghost">Add note</button>
          </form>
          <ul className="mt-4 space-y-3 text-sm">
            {[...t.notes].reverse().map((n, i) => (
              <li key={i} className="rounded-lg bg-surface-2 p-3"><p className="whitespace-pre-wrap">{n.text}</p><p className="mt-1 text-xs text-muted">{fmt(n.at)}</p></li>
            ))}
          </ul>
          <h3 className="mt-6 font-semibold">Notifications</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {t.notifications.map((n, i) => (
              <li key={i}>{n.ok ? "✓" : "✗"} {n.channel} · {fmt(n.at)}{n.detail ? ` · ${n.detail}` : ""}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
