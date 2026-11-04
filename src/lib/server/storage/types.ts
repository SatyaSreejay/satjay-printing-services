export interface UploadTarget {
  /** Where the browser PUTs the file. */
  url: string;
  /** Headers the browser must send with the PUT. */
  headers: Record<string, string>;
}

/**
 * File storage used for customer uploads and ticket records.
 * "local" keeps files in a folder for development; "s3" works with any
 * S3-compatible service (AWS S3, Cloudflare R2, Backblaze B2, MinIO...).
 */
export interface BlobStorage {
  /** A short-lived URL the browser can upload one file to directly. */
  createUpload(key: string, contentType: string, size: number): Promise<UploadTarget>;
  /** Size of a stored object, or null if it doesn't exist. */
  head(key: string): Promise<{ size: number } | null>;
  /** A short-lived URL (or local route) to download the object as an attachment. */
  downloadUrl(key: string, filename: string): Promise<string>;
  putJson(key: string, value: unknown): Promise<void>;
  getJson<T>(key: string): Promise<T | null>;
  list(prefix: string): Promise<string[]>;
}
