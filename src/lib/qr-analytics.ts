export const QR_DATE_RANGE_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
] as const;

export type QrDateRange = (typeof QR_DATE_RANGE_OPTIONS)[number]["value"];

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseQrDateRange(value: string | undefined): QrDateRange {
  return QR_DATE_RANGE_OPTIONS.find((option) => option.value === value)?.value ?? "30";
}

export function getQrRangeStart(range: QrDateRange, now = new Date()) {
  return range === "all" ? undefined : new Date(now.getTime() - Number(range) * DAY_MS);
}

export function getJohannesburgDayStart(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Africa/Johannesburg",
    year: "numeric",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day) - 2 * 60 * 60 * 1000);
}

export function getJohannesburgDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Africa/Johannesburg",
    year: "numeric",
  }).formatToParts(date);
  return [
    parts.find((part) => part.type === "year")?.value,
    parts.find((part) => part.type === "month")?.value,
    parts.find((part) => part.type === "day")?.value,
  ].join("-");
}

export function formatQrDateTime(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat("en-ZA", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Johannesburg",
      }).format(date)
    : "Never";
}
