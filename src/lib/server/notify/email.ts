import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { business } from "@/config/business";
import { formatBytes } from "@/lib/tickets";
import { env } from "../env";
import { adminTicketLink, designLink, fileLink } from "../links";
import { translatorFor } from "../messages";
import { customerRows, summaryRows } from "./ticketSummary";
import type { NewTicketContext, Notifier, NotifyResult } from "./types";

const e = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nl2br = (s: string) => e(s).replace(/\r?\n/g, "<br>");

function table(rows: [string, string][]) {
  return `<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="border-bottom:1px solid #eee;color:#666;width:34%;vertical-align:top">${e(k)}</td><td style="border-bottom:1px solid #eee;vertical-align:top">${nl2br(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

function section(title: string, body: string) {
  return `<h3 style="margin:22px 0 6px;font-size:15px;color:#b0124f">${e(title)}</h3>${body}`;
}

function wrap(inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f2ee;font-family:Arial,'Noto Sans','Noto Sans Telugu','Noto Sans Devanagari',sans-serif;color:#1c1b18"><div style="max-width:640px;margin:0 auto;background:#fff;padding:24px">${inner}</div></body></html>`;
}

export function shopEmail(ctx: NewTicketContext) {
  const t = ctx.ticket;
  const files = t.files.length
    ? `<ul style="padding-left:18px;font-size:14px">${t.files
        .map((f) => `<li><a href="${e(fileLink(t.id, f.key))}">${e(f.name)}</a> (${formatBytes(f.size)})</li>`)
        .join("")}</ul><p style="font-size:12px;color:#666">Download links work for 180 days.</p>`
    : `<p style="font-size:14px;color:#666">No files attached.</p>`;
  const design = t.design
    ? `<p style="font-size:14px"><a href="${e(designLink(t.id))}">Open the customer's design preview</a></p>`
    : "";
  const html = wrap(
    `<p style="margin:0;font-size:13px;color:#666">New order ticket</p>
     <h1 style="margin:4px 0 0;font-size:24px">${e(t.id)}</h1>
     <p style="font-size:14px;color:#666">${e(new Date(t.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))}</p>
     <p><a href="${e(adminTicketLink(t.id))}" style="display:inline-block;background:#b0124f;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:bold">Open in admin</a></p>
     ${section("Customer", table(customerRows(t)))}
     ${section("Job", table(summaryRows(t)))}
     ${section("Exact text to print", `<div style="white-space:pre-wrap;font-size:15px;background:#faf8f3;border:1px solid #eee;padding:12px;border-radius:8px">${e(t.order.text)}</div>`)}
     ${t.order.instructions ? section("Other instructions", `<p style="font-size:14px">${nl2br(t.order.instructions)}</p>`) : ""}
     ${t.design ? section("Design from the studio", design) : ""}
     ${section(`Files (${t.files.length})`, files)}`,
  );
  const text = [
    `New order ticket ${t.id}`,
    ...customerRows(t).map(([k, v]) => `${k}: ${v}`),
    "",
    ...summaryRows(t).map(([k, v]) => `${k}: ${v}`),
    "",
    "Exact text:",
    t.order.text,
    t.order.instructions ? `\nInstructions:\n${t.order.instructions}` : "",
    "",
    ...t.files.map((f) => `File: ${f.name} ${fileLink(t.id, f.key)}`),
    t.design ? `Design preview: ${designLink(t.id)}` : "",
    `Admin: ${adminTicketLink(t.id)}`,
  ].join("\n");
  const serviceLabel = summaryRows(t)[0][1];
  return { subject: `[New order] ${t.id} · ${serviceLabel} · ${t.customer.name}`, html, text };
}

export function customerEmail(ctx: NewTicketContext) {
  const t = ctx.ticket;
  const tr = translatorFor(t.locale);
  const html = wrap(
    `<h1 style="margin:0;font-size:22px">${e(tr("email.thanks", { name: t.customer.name }))}</h1>
     <p style="font-size:15px">${e(tr("email.received"))}</p>
     <p style="font-size:15px">${e(tr("email.ticketNumber"))}: <strong>${e(t.id)}</strong></p>
     <p><a href="${e(ctx.trackingUrl)}" style="display:inline-block;background:#b0124f;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:bold">${e(tr("email.track"))}</a></p>
     <p style="font-size:14px;color:#666">${e(tr("email.keepPrivate"))}</p>
     <p style="font-size:14px">${e(tr("email.questions"))}<br>${e(business.name)} · ${e(business.phoneDisplay)} · ${e(business.email)}</p>`,
  );
  const text = `${tr("email.thanks", { name: t.customer.name })}\n\n${tr("email.received")}\n${tr("email.ticketNumber")}: ${t.id}\n${tr("email.track")}: ${ctx.trackingUrl}\n\n${tr("email.keepPrivate")}\n\n${business.name} · ${business.phoneDisplay} · ${business.email}`;
  return { subject: tr("email.subject", { id: t.id, shop: business.name }), html, text };
}

/**
 * Email over SMTP (works with a Gmail account + app password, or any mail
 * provider). Without SMTP settings in development, emails are written to
 * .data/outbox/ so you can open them in a browser instead.
 */
export class EmailNotifier implements Notifier {
  readonly channel = "email";
  readonly requiredEnv = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SHOP_NOTIFY_EMAIL"];
  private transporter?: Transporter;

  private get cfg() {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE ?? "true") !== "false",
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.SHOP_NOTIFY_EMAIL,
    };
  }

  isConfigured() {
    const c = this.cfg;
    return !!(c.host && c.user && c.pass && c.to);
  }

  private devOutbox() {
    return !env.isProd && !this.isConfigured();
  }

  private async send(msg: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
    if (this.devOutbox()) {
      const dir = path.resolve(env.localDataDir, "outbox");
      await mkdir(dir, { recursive: true });
      const file = path.join(dir, `${Date.now()}-${msg.to.replace(/[^a-z0-9]+/gi, "_")}.html`);
      await writeFile(file, `<!-- To: ${msg.to}\nSubject: ${msg.subject} -->\n${msg.html}`);
      return `dev outbox: ${path.relative(process.cwd(), file)}`;
    }
    const c = this.cfg;
    this.transporter ??= nodemailer.createTransport({ host: c.host, port: c.port, secure: c.secure, auth: { user: c.user, pass: c.pass } });
    const info = await this.transporter.sendMail({ from: `"${business.name}" <${c.from}>`, ...msg });
    return info.messageId;
  }

  async newTicket(ctx: NewTicketContext): Promise<NotifyResult[]> {
    const results: NotifyResult[] = [];
    const to = this.cfg.to || business.email;
    try {
      const m = shopEmail(ctx);
      const id = await this.send({ to, ...m, replyTo: ctx.ticket.customer.email || undefined });
      results.push({ channel: "email:shop", ok: true, detail: id });
    } catch (err) {
      results.push({ channel: "email:shop", ok: false, detail: String(err) });
    }
    if (ctx.ticket.customer.email) {
      try {
        const m = customerEmail(ctx);
        const id = await this.send({ to: ctx.ticket.customer.email, ...m, replyTo: business.email });
        results.push({ channel: "email:customer", ok: true, detail: id });
      } catch (err) {
        results.push({ channel: "email:customer", ok: false, detail: String(err) });
      }
    }
    return results;
  }

  /** Send any message through the configured transport (or dev outbox). */
  sendTo(msg: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
    return this.send(msg);
  }

  /** In development without SMTP, the outbox stands in for real email. */
  usable() {
    return this.isConfigured() || this.devOutbox();
  }
}
