import { Suspense } from "react";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roleHome, requireMember } from "@/lib/member-access";
import { canBrowseMentors } from "@/lib/mentor-access";
import { prisma } from "@/lib/prisma";
import {
  MENTOR_CAMPUS_CONNECTIONS,
  MENTOR_EXPERTISE,
  MENTOR_HELP_TOPICS,
  MENTOR_LANGUAGES,
  MENTOR_LEGACY_EXPERTISE,
} from "@/lib/mentor-validation";
import { bookMentorshipSession } from "./actions";
import {
  formatMentorSessionDate,
  uniqueMentorAvailabilitySlots,
} from "@/lib/mentor-schedule";

type SearchParams = Promise<{
  booking?: string | string[];
  expertise?: string | string[];
  help?: string | string[];
  language?: string | string[];
  campus?: string | string[];
}>;

function getFilterValue(value: string | string[] | undefined, options: readonly string[]) {
  return typeof value === "string" && options.includes(value) ? value : "";
}

export default function MentorsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<p className="account-loading">Loading mentors…</p>}>
      <MentorDirectory searchParams={searchParams} />
    </Suspense>
  );
}

async function MentorDirectory({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const member = await requireMember();
  if (!canBrowseMentors(member.role)) redirect(roleHome[member.role]);
  const params = await searchParams;
  const bookingStatus = typeof params.booking === "string" ? params.booking : "";
  const expertiseOptions = [
    ...MENTOR_EXPERTISE,
    ...MENTOR_LEGACY_EXPERTISE,
  ];
  const selectedExpertise = getFilterValue(params.expertise, expertiseOptions);
  const selectedHelp = getFilterValue(params.help, MENTOR_HELP_TOPICS);
  const selectedLanguage = getFilterValue(params.language, MENTOR_LANGUAGES);
  const selectedCampus = getFilterValue(params.campus, MENTOR_CAMPUS_CONNECTIONS);
  const now = new Date();
  const result = await prisma.mentorProfile.findMany({
    where: {
      status: "APPROVED",
      ...(selectedExpertise && {
        interests: { some: { interest: { name: selectedExpertise } } },
      }),
      ...(selectedHelp && { helpWith: { has: selectedHelp } }),
      ...(selectedLanguage && { languages: { has: selectedLanguage } }),
      ...(selectedCampus && { campusConnection: selectedCampus }),
    },
    orderBy: [{ industry: "asc" }, { jobTitle: "asc" }],
    select: {
      id: true,
      jobTitle: true,
      industry: true,
      bio: true,
      photoFileId: true,
      sessionLengthMinutes: true,
      minimumNoticeHours: true,
      timezone: true,
      helpWith: true,
      helpWithOther: true,
      expertiseOther: true,
      languages: true,
      languagesOther: true,
      campusConnection: true,
      user: { select: { name: true, surname: true } },
      interests: { select: { interest: { select: { name: true } } } },
      availability: {
        where: {
          status: "AVAILABLE",
          startsAt: { gte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
        },
        orderBy: { startsAt: "asc" },
        take: 100,
        select: { id: true, startsAt: true, endsAt: true },
      },
    },
  }).then(
    (mentors) => ({ mentors }),
    (error: unknown) => ({ error }),
  );
  if ("error" in result) {
    console.error("Failed to load the approved mentor directory.", result.error);
    return (
      <main className="events-page">
        <section className="events-inner">
          <p className="eyebrow">Learn from women in tech</p>
          <h1>Meet your mentors</h1>
          <p className="form-message" role="alert">
            We couldn&apos;t load mentors right now. Please try again later.
          </p>
        </section>
      </main>
    );
  }
  const mentors = result.mentors;

  return (
    <main className="events-page">
      <section className="events-inner">
        <p className="eyebrow">Learn from women in tech</p>
        <h1>Meet your mentors</h1>
        <p className="events-intro">Explore approved GiT mentors and the areas they can support.</p>
        {bookingStatus === "confirmed" && (
          <p className="welcome-banner" role="status">
            Your session is booked and confirmed. You can see it on your dashboard.
          </p>
        )}
        {bookingStatus === "unavailable" && (
          <p className="form-message" role="alert">
            That time is no longer available or does not meet the mentor&apos;s notice period. Choose another slot.
          </p>
        )}
        <form action="/mentors" className="mentor-directory-filters" method="get">
          <div className="form-field">
            <label htmlFor="mentor-filter-expertise">Expertise</label>
            <select defaultValue={selectedExpertise} id="mentor-filter-expertise" name="expertise">
              <option value="">All areas</option>
              {expertiseOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="mentor-filter-help">Can help with</label>
            <select defaultValue={selectedHelp} id="mentor-filter-help" name="help">
              <option value="">Any topic</option>
              {MENTOR_HELP_TOPICS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="mentor-filter-language">Language</label>
            <select defaultValue={selectedLanguage} id="mentor-filter-language" name="language">
              <option value="">Any language</option>
              {MENTOR_LANGUAGES.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="mentor-filter-campus">Campus connection</label>
            <select defaultValue={selectedCampus} id="mentor-filter-campus" name="campus">
              <option value="">Any campus</option>
              {MENTOR_CAMPUS_CONNECTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <button className="button button-navy" type="submit">Apply filters</button>
          <Link className="button button-outline-dark" href="/mentors">Clear filters</Link>
        </form>
        {mentors.length ? (
          <div className="mentor-directory-grid">
            {mentors.map((mentor) => {
              const firstName = mentor.user.name || "GiT";
              const fullName = [firstName, mentor.user.surname].filter(Boolean).join(" ");
              const expertiseTags = mentor.interests.map(({ interest }) =>
                interest.name === "Other" && mentor.expertiseOther
                  ? mentor.expertiseOther
                  : interest.name,
              );
              const helpTags = mentor.helpWith.map((topic) =>
                topic === "Something else" && mentor.helpWithOther
                  ? mentor.helpWithOther
                  : topic,
              );
              const languageTags = mentor.languages.map((language) =>
                language === "Other" && mentor.languagesOther
                  ? mentor.languagesOther
                  : language,
              );
              const bookableSlots = uniqueMentorAvailabilitySlots(mentor.availability).filter(
                (slot) =>
                  slot.startsAt.getTime() >=
                  now.getTime() + mentor.minimumNoticeHours * 60 * 60 * 1000,
              );
              return (
              <article className="mentor-directory-card" key={mentor.id}>
                {mentor.photoFileId ? (
                  <Image
                    alt={fullName}
                    className="mentor-directory-photo"
                    height={80}
                    src={`/api/files/${mentor.photoFileId}`}
                    unoptimized
                    width={80}
                  />
                ) : (
                  <div aria-hidden="true" className="mentor-directory-photo mentor-photo-placeholder">
                    {firstName.slice(0, 1)}{mentor.user.surname.slice(0, 1)}
                  </div>
                )}
                <p className="eyebrow">{mentor.industry || "Industry not specified"}</p>
                <h2>{fullName}</h2>
                <p className="mentor-directory-title">{mentor.jobTitle || "GiT mentor"}</p>
                <p>{mentor.bio || "Profile details coming soon."}</p>
                <p><strong>Expertise:</strong> {expertiseTags.join(", ") || "Not provided"}</p>
                <p><strong>Can help with:</strong> {helpTags.join(", ") || "Not provided"}</p>
                <p><strong>Languages:</strong> {languageTags.join(", ") || "Not provided"}</p>
                <p><strong>Campus connection:</strong> {mentor.campusConnection || "Not provided"}</p>
                <p>
                  <strong>Session settings:</strong> 1:1 conversation · {mentor.sessionLengthMinutes} minutes ·
                  {" "}{mentor.minimumNoticeHours} hours&apos; notice
                </p>
                <section aria-label={`Book a session with ${mentor.user.name}`} className="mentor-booking-slots">
                  <h3>Available times</h3>
                  {bookableSlots.length ? (
                    <ul>
                      {bookableSlots.slice(0, 10)
                        .map((slot) => (
                          <li key={slot.id}>
                            <span>
                              {formatMentorSessionDate(slot.startsAt)}–
                              {new Intl.DateTimeFormat("en-ZA", {
                                timeZone: mentor.timezone,
                                hour: "2-digit",
                                minute: "2-digit",
                                hourCycle: "h23",
                              }).format(slot.endsAt)}
                            </span>
                            <form action={bookMentorshipSession}>
                              <input name="availabilitySlotId" type="hidden" value={slot.id} />
                              <button className="button button-navy" type="submit">Book this slot</button>
                            </form>
                          </li>
                        ))}
                    </ul>
                  ) : <p className="field-hint">No bookable times are available yet.</p>}
                </section>
              </article>
            );
            })}
          </div>
        ) : (
          <p className="events-empty">No mentors available yet, please check back soon</p>
        )}
      </section>
    </main>
  );
}
