import "server-only";
import { checkLimits, DAY, HOUR } from "../server/rateLimit";
import { aiConfig } from "./config";

/** Per-IP limits plus a site-wide daily cap, so costs stay predictable. */
export function allowChat(ip: string) {
  const l = aiConfig.limits;
  return Promise.all([
    checkLimits(ip, [
      { name: "ai-chat-hour", max: l.chatPerIpHour, windowMs: HOUR },
      { name: "ai-chat-day", max: l.chatPerIpDay, windowMs: DAY },
    ]),
    checkLimits("all", [{ name: "ai-chat-total", max: l.chatDailyTotal, windowMs: DAY }]),
  ]).then(([a, b]) => a && b);
}

export function allowImage(ip: string) {
  const l = aiConfig.limits;
  return Promise.all([
    checkLimits(ip, [{ name: "ai-image-day", max: l.imagePerIpDay, windowMs: DAY }]),
    checkLimits("all", [{ name: "ai-image-total", max: l.imageDailyTotal, windowMs: DAY }]),
  ]).then(([a, b]) => a && b);
}
