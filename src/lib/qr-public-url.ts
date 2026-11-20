import { z } from "zod";

export const QR_DESTINATIONS = [
  { label: "Home", value: "/" },
  { label: "Join GiT", value: "/register" },
  { label: "Events", value: "/events" },
  { label: "Opportunities", value: "/opportunities" },
  { label: "Mentors", value: "/mentors" },
  { label: "About", value: "/about" },
] as const;

export const qrDestinationSchema = z.enum([
  "/",
  "/register",
  "/events",
  "/opportunities",
  "/mentors",
  "/about",
]);

export const qrSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

export function getQrSiteOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredUrl) {
    throw new Error("Set NEXT_PUBLIC_SITE_URL to the public site origin.");
  }

  const siteUrl = new URL(configuredUrl);
  if (
    siteUrl.protocol !== "https:" ||
    siteUrl.pathname !== "/" ||
    siteUrl.search ||
    siteUrl.hash
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTPS origin without a path.");
  }

  if (/^(localhost|127(?:\.\d{1,3}){3}|\[::1\])$/i.test(siteUrl.hostname)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use a publicly reachable production domain.");
  }

  return siteUrl;
}

export function getQrPublicUrl(slug: string) {
  return new URL(`/join/${encodeURIComponent(slug)}`, getQrSiteOrigin()).toString();
}
