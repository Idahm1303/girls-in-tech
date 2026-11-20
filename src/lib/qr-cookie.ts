import { createHmac, timingSafeEqual } from "node:crypto";

export const QR_ATTRIBUTION_COOKIE = "git-qr-attribution";
export const QR_ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24;

export type QrRegistrationAttribution = {
  qrCodeId: string;
  scannedAt: Date;
};

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signQrAttribution(
  qrCodeId: string,
  scannedAt: Date,
  secret = process.env.AUTH_SECRET,
) {
  if (!secret) return null;

  const payload = Buffer.from(
    `${qrCodeId}\n${scannedAt.getTime()}`,
    "utf8",
  ).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyQrAttribution(
  value: string | undefined,
  secret = process.env.AUTH_SECRET,
  now = new Date(),
): QrRegistrationAttribution | null {
  if (!value || !secret) return null;

  const [payload, providedSignature, ...extra] = value.split(".");
  if (!payload || !providedSignature || extra.length) return null;

  const expectedSignature = signature(payload, secret);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  try {
    const [qrCodeId, timestamp] = Buffer.from(payload, "base64url")
      .toString("utf8")
      .split("\n");
    const milliseconds = Number(timestamp);
    const age = now.getTime() - milliseconds;
    if (
      !qrCodeId ||
      !Number.isSafeInteger(milliseconds) ||
      age < 0 ||
      age > QR_ATTRIBUTION_MAX_AGE_SECONDS * 1000
    ) {
      return null;
    }

    return { qrCodeId, scannedAt: new Date(milliseconds) };
  } catch {
    return null;
  }
}
