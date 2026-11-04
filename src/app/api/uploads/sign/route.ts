import { NextResponse } from "next/server";
import { z } from "zod";
import { checkUploadList, safeFileName } from "@/lib/uploads";
import { getStorage } from "@/lib/server/storage";
import { randomToken, sign } from "@/lib/server/signing";
import { checkLimits, clientIp, DAY, HOUR } from "@/lib/server/rateLimit";

const Body = z.object({
  files: z
    .array(z.object({ name: z.string().min(1).max(200), size: z.number().int().nonnegative(), type: z.string().max(120) }))
    .min(1),
});

/**
 * Step 1 of an upload: the browser lists its files, we check the 50 MB / file
 * count limits, and return one presigned URL per file so the browser uploads
 * straight to storage (the files never pass through this server).
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await checkLimits(ip, [{ name: "upload-sign", max: 30, windowMs: HOUR }, { name: "upload-sign-day", max: 100, windowMs: DAY }]))) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const check = checkUploadList(parsed.data.files);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: check.reason === "tooLarge" ? 413 : 400 });

  const batchId = randomToken(12);
  const exp = Date.now() + 2 * 3600_000;
  const batch = `${batchId}.${exp}.${sign(`${batchId}|${exp}`, "upload-batch")}`;
  const storage = getStorage();
  const uploads = await Promise.all(
    parsed.data.files.map(async (f, i) => {
      const key = `uploads/${batchId}/${i}-${safeFileName(f.name)}`;
      const target = await storage.createUpload(key, f.type, f.size);
      return { key, ...target };
    }),
  );
  return NextResponse.json({ batch, uploads });
}
