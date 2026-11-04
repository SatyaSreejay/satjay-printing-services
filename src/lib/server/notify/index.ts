import "server-only";
import { EmailNotifier } from "./email";
import { WhatsAppNotifier } from "./whatsapp";
import type { NewTicketContext, Notifier, NotifyResult } from "./types";

const email = new EmailNotifier();
const notifiers: Notifier[] = [email, new WhatsAppNotifier()];

/**
 * Send a new ticket through every channel. Channels with missing settings are
 * skipped with a log line, and one channel failing never blocks the others.
 */
export async function notifyNewTicket(ctx: NewTicketContext): Promise<NotifyResult[]> {
  const results: NotifyResult[] = [];
  await Promise.all(
    notifiers.map(async (n) => {
      const usable = n === email ? email.usable() : n.isConfigured();
      if (!usable) {
        console.info(`[notify] ${n.channel} skipped for ${ctx.ticket.id}: set ${n.requiredEnv.join(", ")} to enable it.`);
        results.push({ channel: n.channel, ok: false, detail: "skipped: not configured" });
        return;
      }
      const r = await n.newTicket(ctx);
      for (const x of r) {
        if (!x.ok) console.error(`[notify] ${x.channel} failed for ${ctx.ticket.id}: ${x.detail}`);
      }
      results.push(...r);
    }),
  );
  return results;
}

export type { NewTicketContext, Notifier, NotifyResult } from "./types";
