import "server-only";
import { adminTicketLink } from "../links";
import { summaryRows } from "./ticketSummary";
import type { NewTicketContext, Notifier, NotifyResult } from "./types";

/**
 * WhatsApp Business Cloud API (Meta). Sends the shop owner an alert for each
 * new ticket.
 *
 * WhatsApp only allows business-initiated messages through an approved
 * message template. Create a template in Meta Business Manager with four body
 * variables, e.g.:
 *   New order {{1}} from {{2}} for {{3}}. Open: {{4}}
 * and put its name in WHATSAPP_TEMPLATE_NAME. Without a template name we send
 * plain text, which WhatsApp only delivers if the shop's number messaged the
 * business number in the last 24 hours (handy for testing).
 */
export class WhatsAppNotifier implements Notifier {
  readonly channel = "whatsapp";
  readonly requiredEnv = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_NOTIFY_TO"];

  private get cfg() {
    return {
      token: process.env.WHATSAPP_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      to: process.env.WHATSAPP_NOTIFY_TO,
      template: process.env.WHATSAPP_TEMPLATE_NAME,
      lang: process.env.WHATSAPP_TEMPLATE_LANG || "en",
      version: process.env.WHATSAPP_API_VERSION || "v21.0",
    };
  }

  isConfigured() {
    const c = this.cfg;
    return !!(c.token && c.phoneNumberId && c.to);
  }

  async newTicket(ctx: NewTicketContext): Promise<NotifyResult[]> {
    const c = this.cfg;
    const t = ctx.ticket;
    const service = summaryRows(t)[0][1];
    const link = adminTicketLink(t.id);
    const body = c.template
      ? {
          messaging_product: "whatsapp",
          to: c.to,
          type: "template",
          template: {
            name: c.template,
            language: { code: c.lang },
            components: [
              {
                type: "body",
                parameters: [t.id, t.customer.name, service, link].map((text) => ({ type: "text", text })),
              },
            ],
          },
        }
      : {
          messaging_product: "whatsapp",
          to: c.to,
          type: "text",
          text: { body: `New order ${t.id}\n${t.customer.name} · ${t.customer.phone}\n${service}\n${link}` },
        };
    try {
      const res = await fetch(`https://graph.facebook.com/${c.version}/${c.phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };
      if (!res.ok) return [{ channel: "whatsapp:shop", ok: false, detail: json.error?.message ?? `HTTP ${res.status}` }];
      return [{ channel: "whatsapp:shop", ok: true, detail: json.messages?.[0]?.id }];
    } catch (err) {
      return [{ channel: "whatsapp:shop", ok: false, detail: String(err) }];
    }
  }
}
