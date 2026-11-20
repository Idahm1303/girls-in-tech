import { createHash } from "node:crypto";

export type QrDeviceType = "mobile" | "tablet" | "desktop";

const BOT_USER_AGENT =
  /bot|crawler|spider|slurp|headless|preview|facebookexternalhit|whatsapp|telegrambot|discordbot|linkedinbot|google-inspectiontool/i;

export function shouldIgnoreQrRequest(headers: Headers) {
  const userAgent = headers.get("user-agent") ?? "";
  if (BOT_USER_AGENT.test(userAgent)) return true;
  if (
    headers.has("next-router-prefetch") ||
    headers.has("x-middleware-prefetch")
  ) {
    return true;
  }

  return [
    headers.get("purpose"),
    headers.get("sec-purpose"),
  ].some((value) => value?.toLowerCase().includes("prefetch"));
}

export function getQrDeviceType(userAgent: string): QrDeviceType {
  if (/ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i.test(userAgent)) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|windows phone|android/i.test(userAgent)) {
    return "mobile";
  }
  return "desktop";
}

export function getClientIp(headers: Headers) {
  const forwardedIp = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedIp ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-vercel-forwarded-for")?.trim() ||
    "unknown"
  );
}

export function hashQrVisitor(ip: string, userAgent: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Africa/Johannesburg",
    year: "numeric",
  }).formatToParts(date);
  const dateKey = [
    parts.find((part) => part.type === "year")?.value,
    parts.find((part) => part.type === "month")?.value,
    parts.find((part) => part.type === "day")?.value,
  ].join("-");

  return createHash("sha256")
    .update(`${ip}\n${userAgent}\n${dateKey}`)
    .digest("hex");
}
