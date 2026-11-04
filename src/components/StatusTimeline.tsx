import { getFormatter, getTranslations } from "next-intl/server";
import type { TicketStatus } from "@/lib/tickets";

export async function StatusTimeline({ history }: { history: { status: TicketStatus; at: string; note?: string }[] }) {
  const s = await getTranslations("status");
  const format = await getFormatter();
  return (
    <ol className="relative ml-2 border-l-2 border-border">
      {[...history].reverse().map((h, i) => (
        <li key={`${h.at}-${i}`} className="mb-5 ml-5">
          <span className={`absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-bg ${i === 0 ? "bg-primary" : "bg-border"}`} />
          <p className="font-semibold">{s(h.status)}</p>
          <p className="text-sm text-muted">{format.dateTime(new Date(h.at), { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</p>
          {h.note && <p className="mt-1 text-sm">{h.note}</p>}
        </li>
      ))}
    </ol>
  );
}
