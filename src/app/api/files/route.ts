import { NextResponse } from "next/server";
import { getStorage } from "@/lib/server/storage";
import { getTicket } from "@/lib/server/ticketStore";
import { verifyFileLink } from "@/lib/server/links";

/** Signed, long-lived link from emails and admin → short-lived storage URL. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = verifyFileLink(url.searchParams);
  if (!ref) return NextResponse.json({ error: "Link expired or invalid" }, { status: 403 });
  const ticket = await getTicket(ref.ticketId);
  const file = ticket?.files.find((f) => f.key === ref.key);
  if (!file) return NextResponse.json({ error: "notFound" }, { status: 404 });
  const target = await getStorage().downloadUrl(file.key, file.name);
  return NextResponse.redirect(new URL(target, url.origin), 302);
}
