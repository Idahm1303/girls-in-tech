import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  QR_ATTRIBUTION_COOKIE,
  verifyQrAttribution,
} from "@/lib/qr-cookie";
export {
  QR_ATTRIBUTION_COOKIE,
  QR_ATTRIBUTION_MAX_AGE_SECONDS,
  signQrAttribution,
} from "@/lib/qr-cookie";

export async function getQrRegistrationAttribution() {
  const value = (await cookies()).get(QR_ATTRIBUTION_COOKIE)?.value;
  const attribution = verifyQrAttribution(value);
  if (!attribution) return null;

  try {
    const qrCode = await prisma.qrCode.findUnique({
      where: { id: attribution.qrCodeId },
      select: { id: true },
    });
    return qrCode ? attribution : null;
  } catch (error) {
    console.error("Could not read QR registration attribution.", error);
    return null;
  }
}

export async function clearQrRegistrationAttribution() {
  (await cookies()).delete(QR_ATTRIBUTION_COOKIE);
}
