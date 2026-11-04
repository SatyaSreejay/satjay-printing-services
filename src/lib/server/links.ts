import "server-only";
import { env } from "./env";
import { sign, verify } from "./signing";

const FILE_LINK_DAYS = 180;

/** Long-lived signed link to download one ticket file (used in emails/admin). */
export function fileLink(ticketId: string, key: string, absolute = true): string {
  const exp = Date.now() + FILE_LINK_DAYS * 86_400_000;
  const qs = new URLSearchParams({ t: ticketId, k: key, exp: String(exp), sig: sign(`${ticketId}|${key}|${exp}`, "file") });
  return `${absolute ? env.siteUrl : ""}/api/files?${qs}`;
}

export function verifyFileLink(p: URLSearchParams): { ticketId: string; key: string } | null {
  const t = p.get("t") ?? "";
  const k = p.get("k") ?? "";
  const exp = Number(p.get("exp"));
  if (!t || !k || !exp || exp < Date.now()) return null;
  return verify(`${t}|${k}|${exp}`, "file", p.get("sig")) ? { ticketId: t, key: k } : null;
}

/** Signed link to a page showing the ticket's studio design (with site fonts). */
export function designLink(ticketId: string, absolute = true): string {
  const sig = sign(ticketId, "design");
  return `${absolute ? env.siteUrl : ""}/design/${ticketId}?sig=${sig}`;
}

/** Signed link to download the ticket's studio design as an SVG file. */
export function designSvgLink(ticketId: string): string {
  return `/api/design/${ticketId}?sig=${sign(ticketId, "design")}&download=1`;
}

export function verifyDesignLink(ticketId: string, sig: string | null): boolean {
  return verify(ticketId, "design", sig);
}

export function trackingLink(token: string): string {
  return `${env.siteUrl}/t/${token}`;
}

export function adminTicketLink(ticketId: string): string {
  return `${env.siteUrl}/admin/tickets/${ticketId}`;
}
