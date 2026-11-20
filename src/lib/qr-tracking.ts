import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { QrDeviceType } from "@/lib/qr-utils";

const DEDUPLICATION_WINDOW_MS = 30 * 60 * 1000;

export async function recordQrScan(
  qrCodeId: string,
  visitorHash: string,
  deviceType: QrDeviceType,
) {
  const lockKey = `${qrCodeId}:${visitorHash}`;

  await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`,
    );

    const scannedAt = new Date();
    const recentScan = await transaction.qrScan.findFirst({
      where: {
        qrCodeId,
        visitorHash,
        scannedAt: {
          gte: new Date(scannedAt.getTime() - DEDUPLICATION_WINDOW_MS),
        },
      },
      select: { id: true },
    });
    if (recentScan) return;

    await transaction.qrScan.create({
      data: { qrCodeId, visitorHash, deviceType, scannedAt },
    });
  });
}
