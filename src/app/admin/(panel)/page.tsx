import Link from "next/link";
import { getService } from "@/lib/catalog";
import { ticketStatuses, type TicketStatus } from "@/lib/tickets";
import { listTickets } from "@/lib/server/ticketStore";
import { translatorFor } from "@/lib/server/messages";
import { statusClass, statusLabel } from "../statusStyle";

const open: TicketStatus[] = ["received", "reviewing", "quoted", "designing", "awaitingApproval", "printing", "ready"];

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const tr = translatorFor("en");
  const all = await listTickets();
  const filter = sp.status ?? "open";
  const q = (sp.q ?? "").trim().toLowerCase();
  const tickets = all.filter((t) => {
    if (filter === "open" && !open.includes(t.status)) return false;
    if (filter !== "open" && filter !== "all" && t.status !== filter) return false;
    if (q && ![t.id, t.customer.name, t.customer.phone, t.customer.email ?? ""].some((v) => v.toLowerCase().includes(q))) return false;
    return true;
  });
  const counts = Object.fromEntries(ticketStatuses.map((s) => [s, all.filter((t) => t.status === s).length]));
  const tabs = [
    ["open", `Open (${all.filter((t) => open.includes(t.status)).length})`],
    ...ticketStatuses.map((s) => [s, `${statusLabel[s]} (${counts[s]})`]),
    ["all", `All (${all.length})`],
  ];

  return (
    <>
      <form className="mb-4 flex flex-wrap gap-2">
        <input type="hidden" name="status" value={filter} />
        <input name="q" defaultValue={sp.q} placeholder="Search ticket, name, phone, email" className="input max-w-sm" />
        <button className="btn btn-ghost">Search</button>
      </form>
      <nav className="mb-4 flex flex-wrap gap-2 text-sm">
        {tabs.map(([id, label]) => (
          <Link key={id} href={`/admin?status=${id}`} className={`rounded-full border px-3 py-1 ${filter === id ? "border-primary bg-primary text-primary-contrast" : "border-border"}`}>
            {label}
          </Link>
        ))}
      </nav>
      {tickets.length === 0 ? (
        <p className="text-muted">No tickets here.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr className="border-b border-border">
                <th className="p-3">Ticket</th><th className="p-3">Received</th><th className="p-3">Customer</th><th className="p-3">Job</th><th className="p-3">Needed by</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const svc = getService(t.order.service);
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="p-3 font-mono"><Link className="text-primary underline" href={`/admin/tickets/${t.id}`}>{t.id}</Link></td>
                    <td className="p-3 whitespace-nowrap">{new Date(t.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="p-3">{t.customer.name}<br /><span className="text-muted">{t.customer.phone}</span></td>
                    <td className="p-3">{svc ? tr(`catalog.services.${svc.id}.name`) : t.order.otherService}<br /><span className="text-muted">{t.order.quantity}</span></td>
                    <td className="p-3 whitespace-nowrap">{t.order.deadline ?? "—"}</td>
                    <td className="p-3"><span className={`notice !px-2 !py-0.5 whitespace-nowrap ${statusClass(t.status)}`}>{statusLabel[t.status]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
