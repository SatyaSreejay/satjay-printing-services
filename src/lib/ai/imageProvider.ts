import "server-only";
import { aiConfig } from "./config";

/**
 * Image generation behind one interface so the provider can be swapped.
 *
 * The hybrid approach: the provider only paints TEXT-FREE artwork
 * (backgrounds, patterns, illustrations). Our print templates then overlay the
 * customer's real text, so spelling, Telugu/Hindi shaping and phone numbers
 * are always exact. Images shown on their own are labelled
 * "Inspiration concept, not final artwork".
 */

export interface ArtworkRequest {
  /** What the customer wants, in their words (any language). */
  prompt: string;
  /** Target aspect ratio of the layout, e.g. { w: 1829, h: 914 } for a 6×3 ft banner. */
  aspect: { w: number; h: number };
  /** "background": sits behind text, keep it calm; "concept": standalone inspiration. */
  purpose: "background" | "concept";
}

export interface ArtworkResult {
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  /** Base64 image data (no data: prefix). */
  base64: string;
  provider: string;
}

export interface ImageProvider {
  readonly id: string;
  isConfigured(): boolean;
  generateArtwork(req: ArtworkRequest): Promise<ArtworkResult>;
}

/** Wording that keeps generated images free of text, which models often garble. */
export function textFreePrompt(req: ArtworkRequest): string {
  const ratio = req.aspect.w / req.aspect.h;
  const shape = ratio > 1.3 ? "wide landscape" : ratio < 0.77 ? "tall portrait" : "roughly square";
  const role =
    req.purpose === "background"
      ? "a print background that text will be placed on top of: keep the centre calm and low-contrast, put detail toward the edges"
      : "a design inspiration concept";
  return [
    `Create ${role}, ${shape} format, suitable for high-quality printing.`,
    `Theme from the customer: """${req.prompt.slice(0, 600)}"""`,
    "IMPORTANT: the image must contain absolutely no text, letters, numbers, words, logos, signatures or watermarks in any language or script.",
  ].join("\n");
}

class DisabledProvider implements ImageProvider {
  readonly id = "none";
  isConfigured() {
    return false;
  }
  async generateArtwork(): Promise<ArtworkResult> {
    throw new Error("AI image generation is switched off (AI_IMAGE_PROVIDER=none).");
  }
}

/**
 * Google Gemini image generation over its REST API.
 * Needs GEMINI_API_KEY; the model can be changed with GEMINI_IMAGE_MODEL.
 * NOTE: not exercised yet (AI calls are off for now). Check the request and
 * response shape against Google's current docs before switching it on.
 */
class GeminiImageProvider implements ImageProvider {
  readonly id = "gemini";
  private key = process.env.GEMINI_API_KEY ?? "";
  private model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

  isConfigured() {
    return !!this.key;
  }

  async generateArtwork(req: ArtworkRequest): Promise<ArtworkResult> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": this.key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: textFreePrompt(req) }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
        signal: AbortSignal.timeout(90_000),
      },
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
    };
    const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    const mime = part?.inlineData?.mimeType;
    if (!part?.inlineData?.data || !mime || !/^image\/(png|jpeg|webp)$/.test(mime)) throw new Error("Gemini returned no image");
    return { mimeType: mime as ArtworkResult["mimeType"], base64: part.inlineData.data, provider: this.id };
  }
}

export function getImageProvider(): ImageProvider {
  if (aiConfig.imageProvider === "gemini") return new GeminiImageProvider();
  return new DisabledProvider();
}

export function imageGenerationEnabled() {
  return getImageProvider().isConfigured();
}
