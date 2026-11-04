import { NextResponse } from "next/server";
import { z } from "zod";
import { checkLimits, clientIp, DAY, HOUR } from "@/lib/server/rateLimit";
import { getStorage } from "@/lib/server/storage";
import { createTracking, getTicket, saveTicket } from "@/lib/server/ticketStore";

const Body = z.object({ ticketId: z.string().trim().toUpperCase().max(30), phone: z.string().max(25) });

const digits = (s: string) => s.replace(/\D/g, "").slice(-10);

/**
 * Lost the tracking link? Ticket number + the phone number used on the order
 * issues a fresh tracking link (the old one stops working).
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await checkLimits(ip, [{ name: "track", max: 10, windowMs: HOUR }, { name: "track-day", max: 30, windowMs: DAY }]))) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "notFound" }, { status: 404 });
  const t = await getTicket(parsed.data.ticketId);
  const given = digits(parsed.data.phone);
  if (!t || given.length < 10 || (digits(t.customer.phone) !== given && digits(t.customer.whatsapp ?? "") !== given)) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }
  // Rotate the token: write the new mapping, then retire the old one.
  const old = t.trackingHash;
  const { token, hash, nonce } = await createTracking(t.id);
  t.trackingHash = hash;
  t.trackingNonce = nonce;
  await saveTicket(t);
  await getStorage().putJson(`tracking/${old}.json`, { ticketId: null }).catch(() => {});
  return NextResponse.json({ url: `/t/${token}` });
}
