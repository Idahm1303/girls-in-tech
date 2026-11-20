import { Suspense } from "react";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { connection } from "next/server";
import {
  createQrCodeAction,
  setQrCodeActiveAction,
  updateQrCodeAction,
} from "./actions";
import { DeleteQrCodeForm } from "./delete-qr-code-form";
import { requireAdmin } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";
import {
  QR_DATE_RANGE_OPTIONS,
  formatQrDateTime,
  getJohannesburgDateKey,
  getJohannesburgDayStart,
  getQrRangeStart,
  parseQrDateRange,
} from "@/lib/qr-analytics";
import { getQrSiteOrigin, QR_DESTINATIONS } from "@/lib/qr-public-url";

type QrSearchParams = Promise<{
  days?: string | string[];
  edit?: string | string[];
  error?: string | string[];
  created?: string | string[];
  updated?: string | string[];
  deleted?: string | string[];
}>;

const DAY_MS = 24 * 60 * 60 * 1000;

export default function QrCodesPage({
  searchParams,
}: {
  searchParams: QrSearchParams;
}) {
  return (
    <Suspense fallback={<p className="account-loading">Loading QR codes…</p>}>
      <QrCodesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function QrCodesContent({
  searchParams,
}: {
  searchParams: QrSearchParams;
}) {
  await connection();
  await requireAdmin();
  const query = await searchParams;
  const days = parseQrDateRange(
    typeof query.days === "string" ? query.days : undefined,
  );
  const editId = typeof query.edit === "string" ? query.edit : undefined;
  const now = new Date();
  const selectedStart = getQrRangeStart(days, now);
  const todayStart = getJohannesburgDayStart(now);
  const sevenDaysStart = new Date(todayStart.getTime() - 6 * DAY_MS);
  const thirtyDaysStart = new Date(todayStart.getTime() - 29 * DAY_MS);
  const selectedWhere = selectedStart
    ? { scannedAt: { gte: selectedStart } }
    : {};
  const uniqueWhere = selectedStart
    ? Prisma.sql`WHERE "scannedAt" >= ${selectedStart}`
    : Prisma.empty;
  const codes = await prisma.qrCode.findMany({
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
  });
  const editing = editId ? codes.find((code) => code.id === editId) : undefined;
  const [
    totalScans,
    todayScans,
    sevenDayScans,
    thirtyDayScans,
    selectedScans,
    uniqueVisitorsRows,
    registrations,
    codeScanStats,
    dailyScanRows,
  ] = await Promise.all([
    prisma.qrScan.count(),
    prisma.qrScan.count({ where: { scannedAt: { gte: todayStart } } }),
    prisma.qrScan.count({ where: { scannedAt: { gte: sevenDaysStart } } }),
    prisma.qrScan.count({ where: { scannedAt: { gte: thirtyDaysStart } } }),
    prisma.qrScan.count({ where: selectedWhere }),
    prisma.$queryRaw<Array<{ count: bigint }>>(
      Prisma.sql`SELECT COUNT(DISTINCT "visitorHash") AS count FROM "QrScan" ${uniqueWhere}`,
    ),
    prisma.user.count({
      where: {
        registrationQrCodeId: { not: null },
        ...(selectedStart
          ? {
              registrationQrScannedAt: { gte: selectedStart },
              createdAt: { gte: selectedStart },
            }
          : {}),
      },
    }),
    prisma.qrScan.groupBy({
      by: ["qrCodeId"],
      _count: { _all: true },
      _max: { scannedAt: true },
    }),
    prisma.$queryRaw<Array<{ day: string; count: bigint }>>(
      Prisma.sql`
        SELECT to_char(
          date_trunc(
            'day',
            ("scannedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Johannesburg'
          ),
          'YYYY-MM-DD'
        ) AS day, COUNT(*) AS count
        FROM "QrScan"
        WHERE "scannedAt" >= ${thirtyDaysStart}
        GROUP BY 1
        ORDER BY 1
      `,
    ),
  ]);
  let siteOrigin: URL | null = null;
  try {
    siteOrigin = getQrSiteOrigin();
  } catch (error) {
    console.error("QR code links require a valid NEXT_PUBLIC_SITE_URL.", error);
  }

  const scanStatsByCode = new Map(
    codeScanStats.map((row) => [
      row.qrCodeId,
      { total: row._count._all, lastScanned: row._max.scannedAt },
    ]),
  );
  const dailyCounts = new Map(
    dailyScanRows.map((row) => [row.day, Number(row.count)]),
  );
  const chartDays = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(todayStart.getTime() - (29 - index) * DAY_MS);
    return {
      key: getJohannesburgDateKey(date),
      label: new Intl.DateTimeFormat("en-ZA", {
        day: "2-digit",
        month: "short",
        timeZone: "Africa/Johannesburg",
      }).format(date),
      count: dailyCounts.get(getJohannesburgDateKey(date)) ?? 0,
    };
  });
  const maximumDailyScans = Math.max(1, ...chartDays.map((day) => day.count));
  const messages: Record<string, string> = {
    created: "QR code created.",
    updated: "QR code updated.",
    deleted: "QR code deleted. Its scans were removed too.",
  };
  const messageKey =
    query.created === "1"
      ? "created"
      : query.updated === "1"
        ? "updated"
        : query.deleted === "1"
          ? "deleted"
          : undefined;
  const errorMessages: Record<string, string> = {
    invalid: "Check the QR code name, slug, and destination.",
    "slug-taken": "That slug is already in use.",
    save: "The QR code could not be saved. Please try again.",
    "not-found": "That QR code could not be found. Refresh and try again.",
    delete: "The QR code could not be deleted. Please try again.",
  };
  const errorKey = typeof query.error === "string" ? query.error : undefined;
  const formAction = editing ? updateQrCodeAction : createQrCodeAction;

  return (
    <main className="dashboard-page qr-admin-page">
      <section className="dashboard-inner">
        <p className="eyebrow">Girls in Tech administration</p>
        <h1>QR Codes</h1>
        <p className="dashboard-welcome-copy">
          Create trackable links for posters and events. Change a destination later
          without replacing the printed QR code.
        </p>

        {messageKey && (
          <p className="welcome-banner" role="status">{messages[messageKey]}</p>
        )}
        {errorKey && (
          <p className="form-message" role="alert">
            {errorMessages[errorKey] ?? "The requested QR action could not be completed."}
          </p>
        )}
        {!siteOrigin && (
          <p className="form-message" role="alert">
            Set NEXT_PUBLIC_SITE_URL to the public site origin before generating QR images.
          </p>
        )}

        <section aria-label="QR scan summary" className="qr-summary-grid">
          <SummaryCard label="Total scans" value={totalScans} />
          <SummaryCard label="Scans today" value={todayScans} />
          <SummaryCard label="Last 7 days" value={sevenDayScans} />
          <SummaryCard label="Last 30 days" value={thirtyDayScans} />
          <SummaryCard
            label={`Unique visitors (daily hashes, ${days === "all" ? "all time" : `${days} days`})`}
            value={Number(uniqueVisitorsRows[0]?.count ?? 0)}
          />
          <SummaryCard
            label="Registrations after scanning"
            value={registrations}
          />
        </section>

        <section aria-labelledby="qr-chart-title" className="admin-students">
          <div className="qr-section-heading">
            <div>
              <p className="eyebrow">Scan activity</p>
              <h2 id="qr-chart-title">Scans per day</h2>
            </div>
            <div className="qr-chart-total">
              {selectedScans.toLocaleString()} scans in selected period
            </div>
          </div>
          <div
            aria-label="QR scans per day over the last 30 days"
            className="qr-chart-scroll"
            role="img"
          >
            <ol className="qr-chart">
              {chartDays.map((day) => (
                <li className="qr-chart-day" key={day.key}>
                  <span className="qr-chart-count">{day.count}</span>
                  <span
                    className="qr-chart-bar"
                    style={{
                      height: `${Math.max(3, (day.count / maximumDailyScans) * 100)}%`,
                    }}
                    title={`${day.label}: ${day.count} scans`}
                  />
                  <span className="qr-chart-label">{day.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="qr-list-title" className="admin-students">
          <div className="qr-section-heading">
            <div>
              <p className="eyebrow">Manage tracked links</p>
              <h2 id="qr-list-title">QR code list</h2>
            </div>
            <div className="qr-list-tools">
              <form action="/admin/qr-codes" className="qr-filter-form" method="get">
                <label htmlFor="qr-days">Date range</label>
                <select defaultValue={days} id="qr-days" name="days">
                  {QR_DATE_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button className="button button-outline-dark" type="submit">Apply</button>
              </form>
              <a
                className="button button-navy"
                href={`/api/admin/qr-codes/export?days=${days}`}
              >
                Export CSV
              </a>
            </div>
          </div>
          {codes.length ? (
            <div className="qr-table-scroll">
              <table className="qr-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th>Total scans</th>
                    <th>Last scanned</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => {
                    const stats = scanStatsByCode.get(code.id);
                    return (
                      <tr key={code.id}>
                        <td>{code.name}</td>
                        <td><code>{code.slug}</code></td>
                        <td>{code.destinationPath}</td>
                        <td>{code.isActive ? "Active" : "Inactive"}</td>
                        <td>{(stats?.total ?? 0).toLocaleString()}</td>
                        <td>{formatQrDateTime(stats?.lastScanned ?? null)}</td>
                        <td>
                          <div className="qr-row-actions">
                            <Link href={`/admin/qr-codes/${code.id}?days=${days}`}>View QR</Link>
                            <Link href={`/admin/qr-codes?edit=${code.id}`}>Edit</Link>
                            <form action={setQrCodeActiveAction}>
                              <input name="id" type="hidden" value={code.id} />
                              <input
                                name="isActive"
                                type="hidden"
                                value={String(!code.isActive)}
                              />
                              <button type="submit">
                                {code.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </form>
                            <DeleteQrCodeForm id={code.id} name={code.name} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="events-empty">No QR codes yet. Create one below.</p>
          )}
        </section>

        <section aria-labelledby="qr-form-title" className="admin-students">
          <p className="eyebrow">{editing ? "Update a tracked link" : "Add a tracked link"}</p>
          <h2 id="qr-form-title">{editing ? "Edit QR code" : "Create QR code"}</h2>
          <form action={formAction} className="account-form qr-code-form">
            {editing && <input name="id" type="hidden" value={editing.id} />}
            <div className="form-field">
              <label htmlFor="qr-name">Name</label>
              <input
                autoComplete="off"
                id="qr-name"
                maxLength={120}
                name="name"
                required
                defaultValue={editing?.name ?? ""}
              />
            </div>
            <div className="form-field">
              <label htmlFor="qr-slug">Slug</label>
              <input
                autoComplete="off"
                id="qr-slug"
                maxLength={80}
                name="slug"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
                defaultValue={editing?.slug ?? ""}
              />
              <p className="field-hint">Use lowercase letters, numbers, and hyphens.</p>
              <p className="field-hint">Changing the slug changes the printed link; edit the destination to reuse an existing QR.</p>
            </div>
            <div className="form-field">
              <label htmlFor="qr-destination">Destination</label>
              <select
                defaultValue={editing?.destinationPath ?? "/"}
                id="qr-destination"
                name="destinationPath"
                required
              >
                {QR_DESTINATIONS.map((destination) => (
                  <option key={destination.value} value={destination.value}>
                    {destination.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="qr-active-toggle">
              <input
                defaultChecked={editing?.isActive ?? true}
                name="isActive"
                type="checkbox"
              />
              Active
            </label>
            <div className="qr-form-actions">
              <button className="button button-navy" type="submit">
                {editing ? "Save QR code" : "Create QR code"}
              </button>
              {editing && (
                <Link className="button button-outline-dark" href="/admin/qr-codes">
                  Cancel edit
                </Link>
              )}
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="qr-summary-card">
      <p>{label}</p>
      <strong>{value.toLocaleString()}</strong>
    </article>
  );
}
