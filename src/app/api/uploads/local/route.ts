import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { NextResponse } from "next/server";
import { getLocalStorage } from "@/lib/server/storage";
import { verify } from "@/lib/server/signing";

/** Development-only stand-in for an S3 presigned PUT URL. */
export async function PUT(req: Request) {
  const local = getLocalStorage();
  if (!local) return NextResponse.json({ error: "notFound" }, { status: 404 });

  const q = new URL(req.url).searchParams;
  const key = q.get("key") ?? "";
  const size = Number(q.get("size"));
  const exp = Number(q.get("exp"));
  if (!exp || exp < Date.now() || !verify(`${key}|${size}|${exp}`, "local-upload", q.get("sig"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!req.body) return NextResponse.json({ error: "empty" }, { status: 400 });

  const file = local.filePath(key);
  await mkdir(path.dirname(file), { recursive: true });
  let received = 0;
  const limiter = new Transform({
    transform(chunk, _enc, cb) {
      received += chunk.length;
      if (received > size) cb(new Error("too large"));
      else cb(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), limiter, createWriteStream(file));
  } catch {
    await unlink(file).catch(() => {});
    return NextResponse.json({ error: "tooLarge" }, { status: 413 });
  }
  return new NextResponse(null, { status: 200 });
}
