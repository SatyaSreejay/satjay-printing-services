import "server-only";
import { business } from "@/config/business";
import type { Ticket } from "@/lib/tickets";
import { getStorage } from "./storage";
import { randomCode, randomToken, sha256, sign } from "./signing";

/**
 * Tickets are stored as JSON objects in the same storage as uploads:
 *   tickets/<id>.json        the ticket
 *   tracking/<sha256>.json   maps a tracking token to its ticket id
 * That keeps the site free of a database; a small shop's volume is fine.
 */

export function newTicketId(now = new Date()): string {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${business.ticketPrefix}-${yy}${mm}${dd}-${randomCode(4)}`;
}

export function isTicketId(id: string) {
  return /^[A-Z0-9]{1,10}-\d{6}-[0-9A-Z]{4}$/.test(id);
}

export async function saveTicket(t: Ticket) {
  t.updatedAt = new Date().toISOString();
  await getStorage().putJson(`tickets/${t.id}.json`, t);
}

export async function getTicket(id: string): Promise<Ticket | null> {
  if (!isTicketId(id)) return null;
  return getStorage().getJson<Ticket>(`tickets/${id}.json`);
}

/**
 * Tracking tokens are derived from the ticket id and a random nonce with the
 * server secret, so the raw token is never stored, yet the shop can re-send
 * the same link later. A new nonce (re-issue) retires the old link.
 */
export function trackingToken(ticketId: string, nonce: string): string {
  return sign(`${ticketId}|${nonce}`, "track").slice(0, 32);
}

export async function createTracking(ticketId: string): Promise<{ token: string; hash: string; nonce: string }> {
  const nonce = randomToken(12);
  const token = trackingToken(ticketId, nonce);
  const hash = sha256(token);
  await getStorage().putJson(`tracking/${hash}.json`, { ticketId });
  return { token, hash, nonce };
}

/** Current tracking link token for a ticket. */
export function currentToken(t: Ticket): string {
  return trackingToken(t.id, t.trackingNonce);
}

export async function ticketByToken(token: string): Promise<Ticket | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const hash = sha256(token);
  const ref = await getStorage().getJson<{ ticketId: string | null }>(`tracking/${hash}.json`);
  if (!ref?.ticketId) return null;
  const t = await getTicket(ref.ticketId);
  // Only the ticket's current token works (older ones are retired on re-issue).
  return t && t.trackingHash === hash ? t : null;
}

export async function listTickets(): Promise<Ticket[]> {
  const keys = (await getStorage().list("tickets/")).filter((k) => k.endsWith(".json"));
  const all = await Promise.all(keys.map((k) => getStorage().getJson<Ticket>(k)));
  return all
    .filter((t): t is Ticket => !!t)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
