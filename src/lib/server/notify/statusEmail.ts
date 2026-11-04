import "server-only";
import { business } from "@/config/business";
import type { Ticket } from "@/lib/tickets";
import { translatorFor } from "../messages";
import { currentToken } from "../ticketStore";
import { trackingLink } from "../links";
import { EmailNotifier } from "./email";
import type { NotifyResult } from "./types";

const mailer = new EmailNotifier();

/** Email the customer that their order status changed, with their tracking link. */
export async function sendStatusEmail(t: Ticket, note: string): Promise<NotifyResult> {
  if (!t.customer.email) return { channel: "email:status", ok: false, detail: "no customer email" };
  if (!mailer.usable()) return { channel: "email:status", ok: false, detail: "skipped: not configured" };
  const tr = translatorFor(t.locale);
  const status = tr(`status.${t.status}`);
  const link = trackingLink(currentToken(t));
  const subject = tr("email.statusSubject", { id: t.id, status });
  const text = `${tr("email.statusBody", { id: t.id, status })}\n${note ? `\n${note}\n` : ""}\n${tr("email.track")}: ${link}\n\n${business.name} · ${business.phoneDisplay}`;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const html = `<!doctype html><html><body style="font-family:Arial,'Noto Sans','Noto Sans Telugu','Noto Sans Devanagari',sans-serif;color:#1c1b18"><div style="max-width:600px;margin:0 auto;padding:24px"><p style="font-size:16px">${esc(tr("email.statusBody", { id: t.id, status }))}</p>${note ? `<p style="font-size:15px;background:#faf8f3;padding:12px;border-radius:8px">${esc(note)}</p>` : ""}<p><a href="${esc(link)}" style="display:inline-block;background:#b0124f;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:bold">${esc(tr("email.track"))}</a></p><p style="font-size:13px;color:#666">${esc(tr("email.keepPrivate"))}</p><p style="font-size:14px">${esc(business.name)} · ${esc(business.phoneDisplay)}</p></div></body></html>`;
  try {
    const id = await mailer.sendTo({ to: t.customer.email, subject, html, text, replyTo: business.email });
    return { channel: "email:status", ok: true, detail: id };
  } catch (err) {
    return { channel: "email:status", ok: false, detail: String(err) };
  }
}
