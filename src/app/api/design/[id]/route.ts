import { NextResponse } from "next/server";
import { renderSnapshot } from "@/lib/templates";
import { getTicket } from "@/lib/server/ticketStore";
import { fileLink, verifyDesignLink } from "@/lib/server/links";

/** The customer's studio design for a ticket, rendered as SVG at print size. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sig = new URL(req.url).searchParams.get("sig");
  if (!verifyDesignLink(id, sig)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ticket = await getTicket(id);
  if (!ticket?.design) return NextResponse.json({ error: "notFound" }, { status: 404 });
  const logo = ticket.design.logoKey ? fileLink(ticket.id, ticket.design.logoKey, false) : undefined;
  const svg = renderSnapshot(ticket.design, { logo });
  if (!svg) return NextResponse.json({ error: "notFound" }, { status: 404 });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; font-src 'self'",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=300",
      ...(new URL(req.url).searchParams.get("download") ? { "Content-Disposition": `attachment; filename="${ticket.id}-design.svg"` } : {}),
    },
  });
}
