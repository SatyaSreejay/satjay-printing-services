import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getLocalStorage } from "@/lib/server/storage";
import { verify } from "@/lib/server/signing";

/** Development-only stand-in for an S3 presigned GET URL. */
export async function GET(req: Request) {
  const local = getLocalStorage();
  if (!local) return NextResponse.json({ error: "notFound" }, { status: 404 });
  const q = new URL(req.url).searchParams;
  const key = q.get("key") ?? "";
  const name = q.get("name") ?? "file";
  const exp = Number(q.get("exp"));
  if (!exp || exp < Date.now() || !verify(`${key}|${name}|${exp}`, "local-download", q.get("sig"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const file = local.filePath(key);
  const s = await stat(file).catch(() => null);
  if (!s) return NextResponse.json({ error: "notFound" }, { status: 404 });
  const ascii = name.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return new NextResponse(Readable.toWeb(createReadStream(file)) as ReadableStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(s.size),
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
