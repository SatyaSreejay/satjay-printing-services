import "server-only";

/**
 * AI features are OFF unless explicitly enabled. Nothing here calls an AI
 * API until AI_ASSISTANT_ENABLED / AI_IMAGE_PROVIDER are set and keys exist.
 */
const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);

export const aiConfig = {
  chatEnabled: process.env.AI_ASSISTANT_ENABLED === "true" && !!process.env.ANTHROPIC_API_KEY,
  /** Claude model for the design assistant. */
  chatModel: process.env.AI_CHAT_MODEL || "claude-opus-5-5",
  imageProvider: (process.env.AI_IMAGE_PROVIDER || "none") as "none" | "gemini",
  limits: {
    chatPerIpHour: num(process.env.AI_CHAT_PER_IP_HOUR, 20),
    chatPerIpDay: num(process.env.AI_CHAT_PER_IP_DAY, 60),
    chatDailyTotal: num(process.env.AI_CHAT_DAILY_TOTAL, 500),
    imagePerIpDay: num(process.env.AI_IMAGE_PER_IP_DAY, 5),
    imageDailyTotal: num(process.env.AI_IMAGE_DAILY_TOTAL, 50),
  },
};
