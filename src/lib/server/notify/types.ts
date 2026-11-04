import type { Ticket } from "@/lib/tickets";

export interface NewTicketContext {
  ticket: Ticket;
  /** Customer's tracking link (contains the secret token). */
  trackingUrl: string;
}

export interface NotifyResult {
  channel: string;
  ok: boolean;
  detail?: string;
}

/**
 * A way of telling the shop (and optionally the customer) about a new ticket.
 * Add a channel by implementing this and registering it in notify/index.ts.
 */
export interface Notifier {
  readonly channel: string;
  /** False when required settings are missing; the channel is then skipped. */
  isConfigured(): boolean;
  /** Names of the env vars this channel needs, for the "skipped" log line. */
  readonly requiredEnv: string[];
  newTicket(ctx: NewTicketContext): Promise<NotifyResult[]>;
}
