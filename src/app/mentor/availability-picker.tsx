"use client";

import { useState } from "react";
import {
  MENTOR_NOTICE_HOURS,
  MENTOR_SESSION_LENGTHS,
  MENTOR_TIMEZONE,
  MENTOR_WEEKDAYS,
  formatMentorMinute,
  mentorSessionStartMinutes,
} from "@/lib/mentor-schedule";

export function MentorAvailabilityPicker({
  initialAvailability = [],
  initialSessionLengthMinutes = 30,
  initialMinimumNoticeHours = 24,
}: {
  initialAvailability?: string[];
  initialSessionLengthMinutes?: number;
  initialMinimumNoticeHours?: number;
}) {
  const [sessionLengthMinutes, setSessionLengthMinutes] = useState(
    initialSessionLengthMinutes,
  );
  const [minimumNoticeHours, setMinimumNoticeHours] = useState(
    initialMinimumNoticeHours,
  );
  const [selectedSlots, setSelectedSlots] = useState(initialAvailability);
  const [activeDays, setActiveDays] = useState(() =>
    [...new Set(
      initialAvailability.flatMap((slot) => {
        const weekday = Number(slot.split(":")[0]);
        return Number.isInteger(weekday) && weekday >= 0 && weekday <= 6
          ? [weekday]
          : [];
      }),
    )],
  );
  const startMinutes = mentorSessionStartMinutes(sessionLengthMinutes);

  function toggleDay(weekday: number, checked: boolean) {
    setActiveDays((days) =>
      checked ? [...new Set([...days, weekday])] : days.filter((day) => day !== weekday),
    );
    if (!checked) {
      setSelectedSlots((slots) =>
        slots.filter((slot) => Number(slot.split(":")[0]) !== weekday),
      );
    }
  }

  function setDaySlots(weekday: number, minutes: number[]) {
    setSelectedSlots((slots) => {
      const otherDays = slots.filter((slot) => Number(slot.split(":")[0]) !== weekday);
      return [...otherDays, ...minutes.map((minute) => `${weekday}:${minute}`)];
    });
  }

  function changeSessionLength(value: number) {
    setSessionLengthMinutes(value);
    const allowedStarts = new Set(mentorSessionStartMinutes(value));
    setSelectedSlots((slots) =>
      slots.filter((slot) => allowedStarts.has(Number(slot.split(":")[1]))),
    );
  }

  return (
    <div className="mentor-availability-picker">
      <section aria-label="Session settings" className="mentor-session-summary">
        <p><strong>1:1 conversation</strong></p>
        <p>
          {sessionLengthMinutes} minutes · {minimumNoticeHours} hours&apos; notice
        </p>
        <details className="mentor-session-settings">
          <summary>Adjust session settings</summary>
          <div className="mentor-form-grid">
            <div className="form-field">
              <label htmlFor="mentor-session-length">Session length</label>
              <select
                id="mentor-session-length"
                name="sessionLengthMinutes"
                onChange={(event) => changeSessionLength(Number(event.target.value))}
                value={sessionLengthMinutes}
              >
                {MENTOR_SESSION_LENGTHS.map((length) => (
                  <option key={length} value={length}>{length} minutes</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="mentor-minimum-notice">Minimum notice</label>
              <select
                id="mentor-minimum-notice"
                name="minimumNoticeHours"
                onChange={(event) => setMinimumNoticeHours(Number(event.target.value))}
                value={minimumNoticeHours}
              >
                {MENTOR_NOTICE_HOURS.map((hours) => (
                  <option key={hours} value={hours}>{hours} hours</option>
                ))}
              </select>
            </div>
          </div>
        </details>
      </section>

      <p className="field-hint">
        Timezone: <strong>{MENTOR_TIMEZONE}</strong>
      </p>

      <div aria-label="Choose days" className="mentor-schedule-days">
        {MENTOR_WEEKDAYS.map((day, weekday) => (
          <label className="mentor-day-toggle" key={day}>
            <input
              checked={activeDays.includes(weekday)}
              onChange={(event) => toggleDay(weekday, event.target.checked)}
              type="checkbox"
            />
            <span>{day}</span>
          </label>
        ))}
      </div>

      {[...activeDays].sort((a, b) => a - b).map((weekday) => {
        const day = MENTOR_WEEKDAYS[weekday];
        const daySlots = selectedSlots.filter(
          (slot) => Number(slot.split(":")[0]) === weekday,
        );
        return (
          <fieldset className="mentor-day-slots" key={weekday}>
            <legend>{day}</legend>
            <div className="mentor-day-slot-actions">
              <button
                className="button button-outline-dark"
                onClick={() => setDaySlots(weekday, startMinutes)}
                type="button"
              >
                Select all
              </button>
              <button
                className="button button-outline-dark"
                onClick={() => setDaySlots(weekday, [])}
                type="button"
              >
                Clear
              </button>
            </div>
            <div className="mentor-time-slot-grid">
              {startMinutes.map((startMinute) => {
                const value = `${weekday}:${startMinute}`;
                const checked = daySlots.includes(value);
                return (
                  <label className="mentor-time-slot" key={startMinute}>
                    <input
                      checked={checked}
                      name="availability"
                      onChange={(event) =>
                        setSelectedSlots((slots) =>
                          event.target.checked
                            ? [...slots, value]
                            : slots.filter((slot) => slot !== value),
                        )
                      }
                      type="checkbox"
                      value={value}
                    />
                    <span>
                      {formatMentorMinute(startMinute)}–{formatMentorMinute(startMinute + sessionLengthMinutes)}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
      <p className="field-hint">
        Bookings stay within your available hours and notice period.
      </p>
    </div>
  );
}
