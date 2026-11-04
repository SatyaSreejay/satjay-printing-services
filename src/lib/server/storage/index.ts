import "server-only";
import { env } from "../env";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";
import type { BlobStorage } from "./types";

let instance: BlobStorage | undefined;

export function getStorage(): BlobStorage {
  if (!instance) instance = env.storageDriver === "s3" ? new S3Storage() : new LocalStorage();
  return instance;
}

export function getLocalStorage(): LocalStorage | null {
  const s = getStorage();
  return s instanceof LocalStorage ? s : null;
}

export type { BlobStorage, UploadTarget } from "./types";
