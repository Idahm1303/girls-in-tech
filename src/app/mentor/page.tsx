import { Suspense } from "react";
import { connection } from "next/server";
import Image from "next/image";
import { requireRole } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";
import {
  addMentorAvailability,
  updateMentorAvailability,
  updateMentorProfile,
} from "./actions";
import { MENTOR_PROFILE_EXPERTISE } from "@/lib/mentor-validation";
import { MentorAvailabilityPicker } from "./availability-picker";
import {
  formatMentorDateForInput,
  formatMentorSessionDate,
} from "@/lib/mentor-schedule";

export default function MentorHomePage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading your mentor dashboard…</p>}>
      <MentorContent />
    </Suspense>
  );
}

async function MentorContent() {
  await connection();
  const member = await requireRole("MENTOR");
  const [profile, slots] = await Promise.all([
    prisma.mentorProfile.findUnique({
      where: { userId: member.id },
      select: {
        jobTitle: true,
        company: true,
        industry: true,
        bio: true,
        availabilityNotes: true,
        weeklyAvailability: true,
        sessionLengthMinutes: true,
        minimumNoticeHours: true,
        timezone: true,
        photoFileId: true,
        expertiseOther: true,
        helpWith: true,
        helpWithOther: true,
        interests: { select: { interest: { select: { name: true } } } },
      },
    }),
    prisma.availabilitySlot.findMany({
      where: {
        mentorProfile: { userId: member.id },
        status: "AVAILABLE",
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      take: 8,
      select: { id: true, startsAt: true, endsAt: true },
    }),
  ]);
  if (!profile) return null;
  const sessions = await prisma.mentorshipSession.findMany({
    where: {
      mentorId: member.id,
      status: "ACCEPTED",
      availabilitySlot: { is: { startsAt: { gte: new Date() } } },
    },
    orderBy: { availabilitySlot: { startsAt: "asc" } },
    take: 20,
    select: {
      id: true,
      student: { select: { name: true, surname: true } },
      availabilitySlot: { select: { startsAt: true, endsAt: true } },
    },
  });

  return (
    <main className="dashboard-page">
      <section className="dashboard-inner">
        <p className="eyebrow">Girls in Tech</p>
        <h1>Welcome, {member.name} {member.surname}.</h1>
        <p className="account-intro">Thank you for sharing your experience with GiT.</p>
        <section aria-label="Your mentor profile" className="admin-students mentor-profile-summary">
          {profile.photoFileId && (
            <Image alt="" className="mentor-profile-photo" height={80} src={`/api/files/${profile.photoFileId}`} unoptimized width={80} />
          )}
          <div>
            <p className="eyebrow">{profile.jobTitle || profile.industry}</p>
            {profile.company && <p>{profile.company}</p>}
            <p>{profile.bio}</p>
            <p><strong>Areas:</strong> {[...profile.interests.map(({ interest }) => interest.name), profile.expertiseOther].filter(Boolean).join(", ")}</p>
            <p><strong>Can help with:</strong> {[...profile.helpWith, profile.helpWithOther].filter(Boolean).join(", ") || "Not provided"}</p>
            <p><strong>Usual availability:</strong> {profile.availabilityNotes || "Not set"}</p>
            <p><strong>Session settings:</strong> 1:1 conversation · {profile.sessionLengthMinutes} minutes · {profile.minimumNoticeHours} hours&apos; notice · {profile.timezone}</p>
          </div>
        </section>
        <details className="admin-students mentor-edit-panel">
          <summary>Edit profile</summary>
          <form action={updateMentorProfile} className="account-form">
            <div className="form-field">
              <label htmlFor="mentor-edit-bio">Bio</label>
              <textarea defaultValue={profile.bio} id="mentor-edit-bio" maxLength={600} name="bio" required rows={4} />
            </div>
            <div className="form-field">
              <label htmlFor="mentor-edit-availability">Availability notes</label>
              <textarea defaultValue={profile.availabilityNotes} id="mentor-edit-availability" maxLength={1000} name="availabilityNotes" rows={3} />
            </div>
            <div className="form-field">
              <label htmlFor="mentor-edit-photo">Replace profile photo (JPG, PNG or WebP; max 2 MB)</label>
              <input accept="image/jpeg,image/png,image/webp" id="mentor-edit-photo" name="photo" type="file" />
            </div>
            <fieldset className="mentor-choice-group">
              <legend>Expertise areas</legend>
              <div className="mentor-chip-grid">
                {MENTOR_PROFILE_EXPERTISE.map((item) => (
                  <label className="mentor-chip" key={item}>
                    <input
                      defaultChecked={profile.interests.some(({ interest }) => interest.name === item)}
                      name="expertise"
                      type="checkbox"
                      value={item}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form-field">
              <label htmlFor="mentor-edit-expertise-other">Other area of expertise</label>
              <input defaultValue={profile.expertiseOther ?? ""} id="mentor-edit-expertise-other" maxLength={120} name="expertiseOther" />
            </div>
            <button className="account-submit" type="submit">Save profile</button>
          </form>
        </details>
        <section className="admin-students mentor-availability">
          <h2>Weekly availability</h2>
          <p className="field-hint">
            Changes apply to future bookings. Existing booked sessions stay as scheduled.
          </p>
          <form action={updateMentorAvailability} className="account-form">
            <MentorAvailabilityPicker
              initialAvailability={profile.weeklyAvailability}
              initialMinimumNoticeHours={profile.minimumNoticeHours}
              initialSessionLengthMinutes={profile.sessionLengthMinutes}
            />
            <button className="account-submit" type="submit">Save availability</button>
          </form>
          <h2>Availability slots</h2>
          <p className="field-hint">
            One-off slots use your saved session length ({profile.sessionLengthMinutes} minutes) and notice period ({profile.minimumNoticeHours} hours).
          </p>
          <form action={addMentorAvailability} className="mentor-slot-form">
            <div className="form-field">
              <label htmlFor="mentor-slot-date">Date</label>
              <input id="mentor-slot-date" min={formatMentorDateForInput(new Date())} name="date" required type="date" />
            </div>
            <div className="form-field">
              <label htmlFor="mentor-slot-start">Start time</label>
              <input id="mentor-slot-start" name="startsAt" required type="time" />
            </div>
            <div className="form-field">
              <label htmlFor="mentor-slot-end">End time</label>
              <input id="mentor-slot-end" name="endsAt" required type="time" />
            </div>
            <label className="consent-field">
              <input name="repeatWeekly" type="checkbox" />
              <span>Repeat weekly for 12 weeks</span>
            </label>
            <button className="account-submit" type="submit">Add availability</button>
          </form>
          {slots.length ? (
            <ul className="mentor-slot-list">
              {slots.map((slot) => (
                <li key={slot.id}>
                  {slot.startsAt.toLocaleString()} – {slot.endsAt.toLocaleTimeString()}
                </li>
              ))}
            </ul>
          ) : <p className="field-hint">No upcoming availability slots.</p>}
        </section>
        <section aria-labelledby="mentor-sessions-title" className="admin-students">
          <h2 id="mentor-sessions-title">Upcoming sessions</h2>
          {sessions.length ? (
            <ul className="mentor-slot-list">
              {sessions.map((session) => (
                <li key={session.id}>
                  {session.availabilitySlot && (
                    <>
                      {formatMentorSessionDate(session.availabilitySlot.startsAt)}–
                      {new Intl.DateTimeFormat("en-ZA", {
                        timeZone: profile.timezone,
                        hour: "2-digit",
                        minute: "2-digit",
                        hourCycle: "h23",
                      }).format(session.availabilitySlot.endsAt)}
                    </>
                  )}
                  {" · "}{session.student.name} {session.student.surname}
                </li>
              ))}
            </ul>
          ) : <p className="field-hint">No upcoming sessions are booked.</p>}
        </section>
        <div className="mentor-placeholder-grid">
          <section className="admin-students"><h2>Bookings</h2><p>Bookings are confirmed automatically. Your confirmed sessions appear above.</p></section>
          <section className="admin-students"><h2>Student directory</h2><p>The mentee directory will be available in the next phase.</p></section>
        </div>
      </section>
    </main>
  );
}
