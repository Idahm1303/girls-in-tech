export const MENTOR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const MENTOR_SESSION_LENGTHS = [30, 45, 60] as const;
export const MENTOR_NOTICE_HOURS = [24, 48] as const;
export const MENTOR_TIMEZONE = "Africa/Johannesburg";
export const MENTOR_AVAILABILITY_DAYS = 84;

export type MentorAvailabilitySelection = {
  weekday: number;
  startMinute: number;
};

export function parseMentorAvailabilitySelection(
  value: string,
): MentorAvailabilitySelection | null {
  const match = /^([0-6]):(\d{3,4})$/.exec(value);
  if (!match) return null;
  const weekday = Number(match[1]);
  const startMinute = Number(match[2]);
  if (startMinute < 9 * 60 || startMinute >= 20 * 60) return null;
  return { weekday, startMinute };
}

export function mentorSessionStartMinutes(sessionLengthMinutes: number) {
  const starts: number[] = [];
  for (
    let startMinute = 9 * 60;
    startMinute + sessionLengthMinutes <= 20 * 60;
    startMinute += sessionLengthMinutes
  ) {
    starts.push(startMinute);
  }
  return starts;
}

export function formatMentorMinute(minute: number) {
  const hours = Math.floor(minute / 60).toString().padStart(2, "0");
  const minutes = (minute % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function parseMentorLocalDateTime(date: string, time: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day, hour - 2, minute));
}

export function formatMentorDateForInput(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MENTOR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatMentorAvailability(
  availability: string[],
  sessionLengthMinutes: number,
) {
  return availability
    .map(parseMentorAvailabilitySelection)
    .filter((selection): selection is MentorAvailabilitySelection => selection !== null)
    .sort(
      (left, right) =>
        left.weekday - right.weekday || left.startMinute - right.startMinute,
    )
    .map(({ weekday, startMinute }) => {
      const endMinute = startMinute + sessionLengthMinutes;
      return `${MENTOR_WEEKDAYS[weekday]} ${formatMentorMinute(startMinute)}–${formatMentorMinute(endMinute)}`;
    })
    .join(", ");
}

export function buildMentorAvailabilityOccurrences(
  availability: string[],
  sessionLengthMinutes: number,
  now: Date,
  dayCount = MENTOR_AVAILABILITY_DAYS,
) {
  const validStarts = new Set(mentorSessionStartMinutes(sessionLengthMinutes));
  const selections = new Map<number, number[]>();
  for (const value of new Set(availability)) {
    const selection = parseMentorAvailabilitySelection(value);
    if (!selection || !validStarts.has(selection.startMinute)) continue;
    const starts = selections.get(selection.weekday) ?? [];
    starts.push(selection.startMinute);
    selections.set(selection.weekday, starts);
  }

  const southAfricanNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const occurrences: { startsAt: Date; endsAt: Date }[] = [];
  for (let offset = 0; offset < dayCount; offset += 1) {
    const localDate = new Date(
      Date.UTC(
        southAfricanNow.getUTCFullYear(),
        southAfricanNow.getUTCMonth(),
        southAfricanNow.getUTCDate() + offset,
      ),
    );
    const weekday = (localDate.getUTCDay() + 6) % 7;
    for (const startMinute of selections.get(weekday) ?? []) {
      const startsAt = new Date(
        Date.UTC(
          localDate.getUTCFullYear(),
          localDate.getUTCMonth(),
          localDate.getUTCDate(),
          Math.floor(startMinute / 60) - 2,
          startMinute % 60,
        ),
      );
      if (startsAt <= now) continue;
      occurrences.push({
        startsAt,
        endsAt: new Date(startsAt.getTime() + sessionLengthMinutes * 60 * 1000),
      });
    }
  }
  return occurrences;
}

export function uniqueMentorAvailabilitySlots<
  T extends { startsAt: Date; endsAt: Date },
>(slots: T[]) {
  const unique = new Map<string, T>();
  for (const slot of slots) {
    const key = `${slot.startsAt.toISOString()}-${slot.endsAt.toISOString()}`;
    if (!unique.has(key)) unique.set(key, slot);
  }
  return [...unique.values()];
}

export function formatMentorSessionDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: MENTOR_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
