import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/member-access";
import { getQrRangeStart, parseQrDateRange } from "@/lib/qr-analytics";
import { prisma } from "@/lib/prisma";

function csvCell(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  await requireAdmin();
  const days = parseQrDateRange(request.nextUrl.searchParams.get("days") ?? undefined);
  const start = getQrRangeStart(days);
  const scans = await prisma.qrScan.findMany({
    where: start ? { scannedAt: { gte: start } } : {},
    orderBy: { scannedAt: "desc" },
    select: {
      scannedAt: true,
      deviceType: true,
      visitorHash: true,
      qrCode: { select: { name: true, slug: true } },
    },
  });
  const rows = [
    ["scanned_at", "qr_name", "qr_slug", "device_type", "anonymous_visitor_hash"],
    ...scans.map((scan) => [
      scan.scannedAt.toISOString(),
      scan.qrCode.name,
      scan.qrCode.slug,
      scan.deviceType,
      scan.visitorHash,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="qr-scans-${days}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
