import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export function sign(payload: string, purpose: string): string {
  return createHmac("sha256", env.appSecret).update(`${purpose}\n${payload}`).digest("base64url");
}

export function verify(payload: string, purpose: string, signature: string | null | undefined): boolean {
  if (!signature) return false;
  const expected = Buffer.from(sign(payload, purpose));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Unguessable random token (URL-safe). */
export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/** Crockford-style base32 without look-alike characters. */
export function randomCode(length: number): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
