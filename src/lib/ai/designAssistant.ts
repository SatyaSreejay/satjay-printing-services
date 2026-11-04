import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { serviceIds } from "../catalog";
import { cleanSnapshot, templates, type DesignSnapshot } from "../templates";
import { aiConfig } from "./config";

/**
 * Design assistant powered by Claude. It never draws text itself: it picks one
 * of our print templates, a palette, and fills the template fields with the
 * customer's real text. The browser renders that accurately. It can also
 * suggest a text-free artwork prompt for the image provider.
 */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantSuggestion {
  design: DesignSnapshot;
  why: string;
  artworkPrompt?: string;
}

export interface AssistantReply {
  reply: string;
  suggestions: AssistantSuggestion[];
}

const catalogText = templates
  .map((t) => `- ${t.id} (service: ${t.service}; fields: ${t.fields.map((f) => f.id).join(", ")}; palettes: ${t.palettes.map((p) => p.id).join(", ")}${t.artwork ? "; supports background artwork" : ""})`)
  .join("\n");

const SYSTEM = `You are the friendly design assistant on a small Indian print shop's website. The shop prints ${serviceIds.join(", ")}.

Help customers decide what their print job should look like and turn their request into concrete layout suggestions.

How suggestions work:
- You can only suggest these layout templates; the website renders them at true print size with the customer's exact text:
${catalogText}
- For each suggestion, pick a templateId and paletteId from the list, and fill "values" with the customer's real text for that template's fields. Use only facts the customer gave; leave a field empty rather than inventing phone numbers, addresses or names. Keep the customer's language and script (English, Telugu or Hindi) exactly as they wrote it.
- In the "items" field of menu templates, one item per line, "# " starts a section heading, and "Name | price" adds a price.
- If the layout supports background artwork and it would help, add an artworkPrompt describing a TEXT-FREE background (no words, letters or logos).
- Give 1 to 3 suggestions, each with a one-sentence reason.

Never quote prices or promise delivery dates: prices depend on size, material and quantity, and the shop quotes each job personally. Suggest placing an order when the customer is ready. Reply in the customer's language, briefly and warmly.`;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "suggestions"],
  properties: {
    reply: { type: "string" },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["templateId", "paletteId", "values", "why"],
        properties: {
          templateId: { type: "string", enum: templates.map((t) => t.id) },
          paletteId: { type: "string" },
          values: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["field", "text"],
              properties: { field: { type: "string" }, text: { type: "string" } },
            },
          },
          why: { type: "string" },
          artworkPrompt: { type: "string" },
        },
      },
    },
  },
} as const;

let client: Anthropic | undefined;

export async function askDesignAssistant(history: ChatTurn[]): Promise<AssistantReply> {
  if (!aiConfig.chatEnabled) throw new Error("AI assistant is switched off.");
  client ??= new Anthropic();
  const response = await client.beta.messages.create({
    model: aiConfig.chatModel,
    max_tokens: 16000,
    system: SYSTEM,
    messages: history.slice(-12).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
    thinking: { type: "adaptive" },
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    // If a request is declined by a safety classifier, the API retries it on
    // Anthropic's recommended fallback model instead of failing.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  if (response.stop_reason === "refusal") {
    return { reply: "Sorry, I can't help with that request. Please describe your print job and I'll suggest some designs.", suggestions: [] };
  }
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const raw = JSON.parse(text) as {
    reply: string;
    suggestions: { templateId: string; paletteId: string; values: { field: string; text: string }[]; why: string; artworkPrompt?: string }[];
  };
  const suggestions: AssistantSuggestion[] = [];
  for (const s of raw.suggestions ?? []) {
    const design = cleanSnapshot({ templateId: s.templateId, paletteId: s.paletteId, values: Object.fromEntries(s.values.map((v) => [v.field, v.text])) });
    if (design) suggestions.push({ design, why: s.why, artworkPrompt: s.artworkPrompt || undefined });
  }
  return { reply: raw.reply, suggestions: suggestions.slice(0, 3) };
}
