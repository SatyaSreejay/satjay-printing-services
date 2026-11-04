import { NextResponse } from "next/server";
import { z } from "zod";
import { allowImage } from "@/lib/ai/limits";
import { getImageProvider } from "@/lib/ai/imageProvider";
import { getTemplate } from "@/lib/templates";
import { clientIp } from "@/lib/server/rateLimit";

const Body = z.object({
  prompt: z.string().trim().min(3).max(600),
  templateId: z.string().optional(),
  purpose: z.enum(["background", "concept"]),
});

/** Text-free artwork for a template background, or a standalone inspiration concept. */
export async function POST(req: Request) {
  const provider = getImageProvider();
  if (!provider.isConfigured()) return NextResponse.json({ error: "disabled" }, { status: 503 });
  if (!(await allowImage(clientIp(req)))) return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const tpl = getTemplate(parsed.data.templateId);
  const aspect = tpl ? { w: tpl.widthMm, h: tpl.heightMm } : { w: 1, h: 1 };
  try {
    const img = await provider.generateArtwork({ prompt: parsed.data.prompt, aspect, purpose: parsed.data.purpose });
    return NextResponse.json({ dataUrl: `data:${img.mimeType};base64,${img.base64}`, provider: img.provider });
  } catch (err) {
    console.error("[ai] artwork failed:", err);
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
