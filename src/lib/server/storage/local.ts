import "server-only";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../env";
import { sign } from "../signing";
import type { BlobStorage } from "./types";

/** Development storage: everything lives under LOCAL_DATA_DIR (default .data/). */
export class LocalStorage implements BlobStorage {
  readonly root = path.resolve(env.localDataDir);

  /** Resolve a key to a path, refusing anything that escapes the root. */
  filePath(key: string): string {
    if (!/^[a-zA-Z0-9/_.\-]+$/.test(key) || key.includes("..")) throw new Error("bad key");
    const p = path.resolve(this.root, key);
    if (!p.startsWith(this.root + path.sep)) throw new Error("bad key");
    return p;
  }

  async createUpload(key: string, contentType: string, size: number) {
    const exp = Date.now() + 30 * 60_000;
    const payload = `${key}|${size}|${exp}`;
    const qs = new URLSearchParams({ key, size: String(size), exp: String(exp), sig: sign(payload, "local-upload") });
    return { url: `/api/uploads/local?${qs}`, headers: { "Content-Type": contentType || "application/octet-stream" } };
  }

  async head(key: string) {
    try {
      const s = await stat(this.filePath(key));
      return { size: s.size };
    } catch {
      return null;
    }
  }

  async downloadUrl(key: string, filename: string) {
    const exp = Date.now() + 10 * 60_000;
    const qs = new URLSearchParams({ key, name: filename, exp: String(exp), sig: sign(`${key}|${filename}|${exp}`, "local-download") });
    return `/api/files/local?${qs}`;
  }

  async putJson(key: string, value: unknown) {
    const p = this.filePath(key);
    await mkdir(path.dirname(p), { recursive: true });
    await writeFile(p, JSON.stringify(value, null, 2));
  }

  async getJson<T>(key: string) {
    try {
      return JSON.parse(await readFile(this.filePath(key), "utf8")) as T;
    } catch {
      return null;
    }
  }

  async list(prefix: string) {
    try {
      const dir = this.filePath(prefix.replace(/\/$/, ""));
      const names = await readdir(dir);
      return names.map((n) => `${prefix.replace(/\/$/, "")}/${n}`);
    } catch {
      return [];
    }
  }
}
