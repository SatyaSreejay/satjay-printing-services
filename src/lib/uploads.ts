import { uploadLimits } from "@/config/business";

/** File types we refuse because they can run code on someone's computer. */
const BLOCKED = /\.(exe|msi|bat|cmd|com|scr|ps1|vbs|js|mjs|jar|sh|apk|app|dmg|html?|php|svgz?)$/i;

export function isBlockedFile(name: string) {
  return BLOCKED.test(name.trim());
}

export function safeFileName(name: string): string {
  const base = name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_").replace(/^[_.]+/, "");
  return (base || "file").slice(-80);
}

export function checkUploadList(files: { name: string; size: number }[]):
  | { ok: true; total: number }
  | { ok: false; reason: "tooMany" | "tooLarge" | "blocked" | "empty"; total: number } {
  const total = files.reduce((s, f) => s + f.size, 0);
  if (files.length > uploadLimits.maxFiles) return { ok: false, reason: "tooMany", total };
  if (files.some((f) => isBlockedFile(f.name))) return { ok: false, reason: "blocked", total };
  if (files.some((f) => f.size <= 0)) return { ok: false, reason: "empty", total };
  if (total > uploadLimits.maxTotalBytes) return { ok: false, reason: "tooLarge", total };
  return { ok: true, total };
}
