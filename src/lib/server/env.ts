import "server-only";

/**
 * Server-side configuration. Every secret comes from environment variables
 * (see .env.example) and is never sent to the browser.
 */
const isProd = process.env.NODE_ENV === "production";

function appSecret(): string {
  const s = process.env.APP_SECRET;
  if (s && s.length >= 32 && s !== "change-me-to-a-long-random-string") return s;
  if (isProd) throw new Error("APP_SECRET must be set to a random string of at least 32 characters.");
  return "dev-only-insecure-secret-change-me-0123456789";
}

export const env = {
  isProd,
  siteUrl: (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  get appSecret() {
    return appSecret();
  },
  storageDriver: (process.env.STORAGE_DRIVER || "local") as "local" | "s3",
  localDataDir: process.env.LOCAL_DATA_DIR || ".data",
  s3: {
    bucket: process.env.S3_BUCKET || "",
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  },
};
