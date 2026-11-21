import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { connection } from "next/server";
import { CopyQrLinkButton, PrintQrPosterButton } from "./copy-link-button";
import { requireAdmin } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";
import {
  QR_DATE_RANGE_OPTIONS,
  formatQrDateTime,
  getQrRangeStart,
  parseQrDateRange,
} from "@/lib/qr-analytics";
import { getQrPublicUrl } from "@/lib/qr-public-url";

type QrDetailParams = Promise<{ id: string }>;
type QrDetailSearchParams = Promise<{ days?: string | string[] }>;

export default function QrCodeDetailPage({
  params,
  searchParams,
}: {
  params: QrDetailParams;
  searchParams: QrDetailSearchParams;
}) {
  return (
    <Suspense fallback={<p className="account-loading">Loading QR details…</p>}>
      <QrCodeDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function QrCodeDetail({
  params,
  searchParams,
}: {
  params: QrDetailParams;
  searchParams: QrDetailSearchParams;
}) {
  await connection();
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const days = parseQrDateRange(
    typeof query.days === "string" ? query.days : undefined,
  );
  const start = getQrRangeStart(days);
  const code = await prisma.qrCode.findUnique({ where: { id } });
  if (!code) {
    return (
      <main className="dashboard-page qr-admin-page">
        <section className="dashboard-inner">
          <p className="eyebrow">Girls in Tech administration</p>
          <h1>QR code not found</h1>
          <Link className="button button-outline-dark" href="/admin/qr-codes">
            Back to QR codes
          </Link>
        </section>
      </main>
    );
  }

  const dateFilter = start ? { scannedAt: { gte: start } } : {};
  const [
    scanCount,
    uniqueVisitorsRows,
    deviceBreakdown,
    registrationCount,
    lastScan,
  ] = await Promise.all([
    prisma.qrScan.count({ where: { qrCodeId: id, ...dateFilter } }),
    prisma.$queryRaw<Array<{ count: bigint }>>(
      start
        ? Prisma.sql`SELECT COUNT(DISTINCT "visitorHash") AS count FROM "QrScan" WHERE "qrCodeId" = ${id} AND "scannedAt" >= ${start}`
        : Prisma.sql`SELECT COUNT(DISTINCT "visitorHash") AS count FROM "QrScan" WHERE "qrCodeId" = ${id}`,
    ),
    prisma.qrScan.groupBy({
      by: ["deviceType"],
      where: { qrCodeId: id, ...dateFilter },
      _count: { _all: true },
    }),
    prisma.user.count({
      where: {
        registrationQrCodeId: id,
        ...(start
          ? {
              registrationQrScannedAt: { gte: start },
              createdAt: { gte: start },
            }
          : {}),
      },
    }),
    prisma.qrScan.findFirst({
      where: { qrCodeId: id },
      orderBy: { scannedAt: "desc" },
      select: { scannedAt: true },
    }),
  ]);
  let publicUrl: string | null = null;
  let urlError = false;
  try {
    publicUrl = getQrPublicUrl(code.slug);
  } catch (error) {
    urlError = true;
    console.error("Could not build the public QR link.", error);
  }
  const downloads = [
    { format: "svg", label: "Download SVG" },
    { format: "png", label: "Download PNG (2400px wide)" },
  ];

  return (
    <main className="dashboard-page qr-admin-page">
      <section className="dashboard-inner">
        <p className="eyebrow">Girls in Tech administration</p>
        <h1>{code.name}</h1>
        <p className="account-intro">
          {code.isActive ? "Active" : "Inactive"} · {code.destinationPath} ·{" "}
          <code>{code.slug}</code>
        </p>
        <p className="admin-mentor-link">
          <Link className="button button-outline-dark" href="/admin/qr-codes">
            Back to QR codes
          </Link>
        </p>
        {urlError && (
          <p className="form-message" role="alert">
            Set NEXT_PUBLIC_SITE_URL to the public site origin before generating QR images.
          </p>
        )}

        <section aria-labelledby="qr-detail-title" className="admin-students qr-detail-card">
          <div className="qr-image-panel">
            {publicUrl ? (
              <>
                <div className="qr-print-poster">
                  <h2>Join Girls in Tech</h2>
                  <Image
                    alt={`QR code for ${code.name}`}
                    className="qr-detail-image"
                    height={2800}
                    src={`/api/admin/qr-codes/${code.id}/image?format=png`}
                    unoptimized
                    width={2400}
                  />
                  <p className="qr-image-caption">Scan to join Girls in Tech</p>
                </div>
                <div className="qr-download-actions">
                  {downloads.map((download) => (
                    <a
                      className="button button-navy"
                      download
                      href={`/api/admin/qr-codes/${code.id}/image?format=${download.format}&download=1`}
                      key={download.format}
                    >
                      {download.label}
                    </a>
                  ))}
                  <PrintQrPosterButton />
                </div>
                <CopyQrLinkButton link={publicUrl} />
                <label className="qr-link-label" htmlFor="qr-public-link">Printed QR link</label>
                <input id="qr-public-link" readOnly value={publicUrl} />
              </>
            ) : (
              <p className="events-empty">The QR image is unavailable until the site URL is configured.</p>
            )}
          </div>
          <div className="qr-detail-stat-panel">
            <p className="eyebrow">Performance</p>
            <h2 id="qr-detail-title">Scan statistics</h2>
            <form action={`/admin/qr-codes/${code.id}`} className="qr-filter-form" method="get">
              <label htmlFor="qr-detail-days">Date range</label>
              <select defaultValue={days} id="qr-detail-days" name="days">
                {QR_DATE_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button className="button button-outline-dark" type="submit">Apply</button>
            </form>
            <dl className="qr-detail-stats">
              <div><dt>Scans</dt><dd>{scanCount.toLocaleString()}</dd></div>
              <div>
                <dt>Unique visitors (daily hashes)</dt>
                <dd>{Number(uniqueVisitorsRows[0]?.count ?? 0).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Registrations after scanning</dt>
                <dd>{registrationCount.toLocaleString()}</dd>
              </div>
              <div><dt>Last scanned</dt><dd>{formatQrDateTime(lastScan?.scannedAt ?? null)}</dd></div>
            </dl>
            <h3>Device breakdown</h3>
            {deviceBreakdown.length ? (
              <ul className="qr-device-list">
                {deviceBreakdown.map((device) => (
                  <li key={device.deviceType}>
                    <span>{device.deviceType}</span>
                    <strong>{device._count._all.toLocaleString()}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="field-hint">No scans in this date range.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
