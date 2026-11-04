import { NextResponse } from "next/server";
import { z } from "zod";
import { uploadLimits } from "@/config/business";
import { isLocale } from "@/i18n/config";
import { getService } from "@/lib/catalog";
import { cleanSnapshot } from "@/lib/templates";
import { contactMethods, type Ticket, type TicketFile } from "@/lib/tickets";
import { isBlockedFile } from "@/lib/uploads";
import { notifyNewTicket } from "@/lib/server/notify";
import { checkLimits, clientIp, DAY, MINUTE } from "@/lib/server/rateLimit";
import { verify } from "@/lib/server/signing";
import { getStorage } from "@/lib/server/storage";
import { createTracking, newTicketId, saveTicket } from "@/lib/server/ticketStore";
import { trackingLink } from "@/lib/server/links";

const str = (max: number) => z.string().trim().max(max);

const Body = z.object({
  // Honeypot: real people never see or fill this field.
  website: z.string().max(0).optional().or(z.literal("")),
  locale: z.string().optional(),
  customer: z.object({
    name: str(80).min(2),
    phone: str(20).regex(/^[+\d][\d\s-]{6,19}$/),
    whatsappSame: z.boolean(),
    whatsapp: str(20).optional(),
    email: z.union([z.literal(""), z.string().trim().email().max(120)]).optional(),
    preferred: z.enum(contactMethods),
  }),
  order: z.object({
    service: str(40).min(1),
    otherService: str(200).optional(),
    options: z.record(z.string(), z.array(z.string().max(40)).max(12)).default({}),
    quantity: str(60).min(1),
    size: str(120).optional(),
    deadline: str(30).optional(),
    colours: str(200).optional(),
    text: str(5000).min(1),
    instructions: str(3000).optional(),
  }),
  design: z.unknown().optional(),
  designLogoKey: z.string().max(300).optional(),
  upload: z
    .object({
      batch: z.string().max(200),
      files: z.array(z.object({ key: z.string().max(300), name: z.string().max(200), type: z.string().max(120) })).max(uploadLimits.maxFiles),
    })
    .optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await checkLimits(ip, [{ name: "order", max: 5, windowMs: 10 * MINUTE }, { name: "order-day", max: 20, windowMs: DAY }]))) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", fields: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }
  const b = parsed.data;
  if (b.website) return NextResponse.json({ error: "invalid" }, { status: 400 });

  // Service and options must come from the catalog ("other" is free text).
  const service = getService(b.order.service);
  if (!service && b.order.service !== "other") return NextResponse.json({ error: "invalid", fields: ["order.service"] }, { status: 400 });
  if (b.order.service === "other" && !b.order.otherService) return NextResponse.json({ error: "invalid", fields: ["order.otherService"] }, { status: 400 });
  const options: Record<string, string[]> = {};
  if (service) {
    for (const g of service.groups) {
      const picked = (b.order.options[g.id] ?? []).filter((o) => g.options.includes(o));
      if (picked.length) options[g.id] = g.multiple ? picked : picked.slice(0, 1);
    }
  }

  // Uploaded files: the batch must be one we signed, and each file must exist.
  const files: TicketFile[] = [];
  if (b.upload?.files.length) {
    const [batchId, exp, sig] = b.upload.batch.split(".");
    if (!batchId || Number(exp) < Date.now() || !verify(`${batchId}|${exp}`, "upload-batch", sig)) {
      return NextResponse.json({ error: "uploadExpired" }, { status: 400 });
    }
    const storage = getStorage();
    for (const f of b.upload.files) {
      if (!f.key.startsWith(`uploads/${batchId}/`) || isBlockedFile(f.name)) {
        return NextResponse.json({ error: "invalid", fields: ["upload"] }, { status: 400 });
      }
      const head = await storage.head(f.key);
      if (!head) return NextResponse.json({ error: "uploadMissing", file: f.name }, { status: 400 });
      files.push({ key: f.key, name: f.name, size: head.size, type: f.type });
    }
    const total = files.reduce((s, f) => s + f.size, 0);
    if (total > uploadLimits.maxTotalBytes) return NextResponse.json({ error: "tooLarge" }, { status: 413 });
  }

  const snapshot = cleanSnapshot(b.design);
  const logoKey = b.designLogoKey && files.some((f) => f.key === b.designLogoKey) ? b.designLogoKey : undefined;

  const now = new Date().toISOString();
  const id = newTicketId();
  const { token, hash } = await createTracking(id);
  const c = b.customer;
  const ticket: Ticket = {
    id,
    createdAt: now,
    updatedAt: now,
    status: "received",
    history: [{ status: "received", at: now }],
    locale: isLocale(b.locale) ? b.locale : "en",
    customer: {
      name: c.name,
      phone: c.phone,
      whatsappSame: c.whatsappSame,
      whatsapp: c.whatsappSame ? undefined : c.whatsapp || undefined,
      email: c.email || undefined,
      preferred: c.preferred,
    },
    order: {
      service: service?.id ?? "other",
      otherService: service ? undefined : b.order.otherService,
      options,
      quantity: b.order.quantity,
      size: b.order.size || undefined,
      deadline: b.order.deadline || undefined,
      colours: b.order.colours || undefined,
      text: b.order.text,
      instructions: b.order.instructions || undefined,
    },
    design: snapshot ? { ...snapshot, logoKey } : undefined,
    files,
    trackingHash: hash,
    notes: [],
    notifications: [],
  };
  await saveTicket(ticket);

  const trackingUrl = trackingLink(token);
  const results = await notifyNewTicket({ ticket, trackingUrl });
  ticket.notifications = results.map((r) => ({ ...r, at: new Date().toISOString() }));
  await saveTicket(ticket);

  return NextResponse.json({ ticketId: id, trackingUrl, emailed: results.some((r) => r.channel === "email:customer" && r.ok) });
}
