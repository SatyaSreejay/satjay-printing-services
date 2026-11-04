import { NextResponse } from "next/server";
import { z } from "zod";
import { aiConfig } from "@/lib/ai/config";
import { allowChat } from "@/lib/ai/limits";
import { askDesignAssistant } from "@/lib/ai/designAssistant";
import { clientIp } from "@/lib/server/rateLimit";

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) })).min(1).max(20),
});

export async function POST(req: Request) {
  if (!aiConfig.chatEnabled) return NextResponse.json({ error: "disabled" }, { status: 503 });
  if (!(await allowChat(clientIp(req)))) return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    return NextResponse.json(await askDesignAssistant(parsed.data.messages));
  } catch (err) {
    console.error("[ai] chat failed:", err);
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
