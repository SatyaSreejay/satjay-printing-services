import "server-only";
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../env";
import type { BlobStorage } from "./types";

/**
 * S3-compatible storage. The bucket must stay private; the browser only ever
 * gets short-lived presigned URLs. The bucket also needs a CORS rule that
 * allows PUT from the site's origin (see SETUP.md).
 */
export class S3Storage implements BlobStorage {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const c = env.s3;
    if (!c.bucket || !c.accessKeyId || !c.secretAccessKey) {
      throw new Error("S3 storage needs S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.");
    }
    this.bucket = c.bucket;
    this.client = new S3Client({
      region: c.region,
      endpoint: c.endpoint,
      forcePathStyle: c.forcePathStyle,
      credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
    });
  }

  async createUpload(key: string, contentType: string, size: number) {
    const type = contentType || "application/octet-stream";
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: type, ContentLength: size }),
      { expiresIn: 30 * 60, signableHeaders: new Set(["content-type", "content-length"]) },
    );
    return { url, headers: { "Content-Type": type } };
  }

  async head(key: string) {
    try {
      const r = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { size: r.ContentLength ?? 0 };
    } catch {
      return null;
    }
  }

  async downloadUrl(key: string, filename: string) {
    const safe = filename.replace(/["\\\r\n]/g, "_");
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      }),
      { expiresIn: 10 * 60 },
    );
  }

  async putJson(key: string, value: unknown) {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: JSON.stringify(value), ContentType: "application/json" }),
    );
  }

  async getJson<T>(key: string) {
    try {
      const r = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const body = await r.Body?.transformToString();
      return body ? (JSON.parse(body) as T) : null;
    } catch {
      return null;
    }
  }

  async list(prefix: string) {
    const keys: string[] = [];
    let token: string | undefined;
    do {
      const r = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: token }),
      );
      for (const o of r.Contents ?? []) if (o.Key) keys.push(o.Key);
      token = r.IsTruncated ? r.NextContinuationToken : undefined;
    } while (token);
    return keys;
  }
}
