import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Image from "next/image";
import { requireAdmin } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";
import { reviewMentorApplication } from "../actions";

const campusNames: Record<string, string> = {
  SOSHANGUVE: "Soshanguve",
  EMALAHLENI: "Emalahleni",
  POLOKWANE: "Polokwane",
  GIYANE: "Giyane",
  ONLINE_ONLY: "Online only",
};

export default function MentorApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  return (
    <Suspense fallback={<p className="account-loading">Loading application…</p>}>
      <MentorApplicationDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function MentorApplicationDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  await connection();
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const mentor = await prisma.user.findFirst({
    where: { id, role: "MENTOR" },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      mentorProfile: {
        include: {
          interests: { select: { interest: { select: { name: true } } } },
          reviewedBy: { select: { name: true, surname: true } },
        },
      },
    },
  });
  if (!mentor?.mentorProfile) notFound();
  const profile = mentor.mentorProfile;

  return (
    <main className="dashboard-page">
      <section className="dashboard-inner admin-mentor-detail">
        <Link className="events-back-link" href={`/admin/mentors?status=${profile.status}`}>
          ← Back to {profile.status.toLowerCase().replace("_", " ")} applications
        </Link>
        <p className="eyebrow">Mentor application · {profile.status.replace("_", " ")}</p>
        <h1>{mentor.name} {mentor.surname}</h1>
        {query.updated && <p className="welcome-banner" role="status">Application decision saved and mentor notified.</p>}
        {query.error === "note-required" && <p className="form-message" role="alert">A reason or message of at least five characters is required.</p>}
        <dl className="mentor-detail-grid">
          <div><dt>Email</dt><dd>{mentor.email}</dd></div>
          <div><dt>Phone (admin only)</dt><dd>{profile.phone}</dd></div>
          <div><dt>Job title</dt><dd>{profile.jobTitle || profile.title}</dd></div>
          <div><dt>Company</dt><dd>{profile.company || profile.organization}</dd></div>
          <div><dt>Industry</dt><dd>{profile.industry}</dd></div>
          <div><dt>Experience</dt><dd>{profile.yearsExperience} years</dd></div>
          <div><dt>Highest qualification</dt><dd>{profile.qualification}</dd></div>
          <div><dt>TUT alumna</dt><dd>{profile.isTutAlumna ? "Yes" : "No"}</dd></div>
          <div><dt>Session format</dt><dd>{profile.sessionFormat.replace("_", " ")}</dd></div>
          <div><dt>Meeting tool</dt><dd>{profile.meetingTool.replace("_", " ")}</dd></div>
          <div><dt>Campuses</dt><dd>{profile.campuses.map((campus) => campusNames[campus] ?? campus).join(", ")}</dd></div>
          <div><dt>Maximum mentees</dt><dd>{profile.maxMentees}</dd></div>
          <div><dt>Availability</dt><dd>{profile.availabilityNotes || "Not provided"}</dd></div>
          <div><dt>LinkedIn</dt><dd>{profile.linkedinUrl ?? "Not provided"}</dd></div>
          <div><dt>Expertise areas</dt><dd>{profile.interests.map(({ interest }) => interest.name).join(", ")}</dd></div>
          <div className="mentor-detail-wide"><dt>Bio</dt><dd>{profile.bio}</dd></div>
          <div className="mentor-detail-wide"><dt>Motivation (admin only)</dt><dd>{profile.motivation}</dd></div>
          <div className="mentor-detail-wide"><dt>Previous review note</dt><dd>{profile.reviewNote ?? "None"}</dd></div>
          <div><dt>Submitted</dt><dd>{profile.createdAt.toLocaleDateString()}</dd></div>
          {profile.reviewedAt && <div><dt>Last reviewed</dt><dd>{profile.reviewedAt.toLocaleDateString()} by {profile.reviewedBy?.name} {profile.reviewedBy?.surname}</dd></div>}
          {profile.photoFileId && (
            <div><dt>Profile photo</dt><dd><Image alt={`${mentor.name} ${mentor.surname}`} className="mentor-admin-photo" height={100} src={`/api/files/${profile.photoFileId}`} unoptimized width={100} /></dd></div>
          )}
        </dl>
        <section aria-labelledby="mentor-decision-title" className="admin-students">
          <h2 id="mentor-decision-title">Review decision</h2>
          <form action={reviewMentorApplication} className="account-form">
            <input name="mentorId" type="hidden" value={mentor.id} />
            <div className="form-field">
              <label htmlFor="mentor-review-note">Reason for rejection or message to mentor</label>
              <textarea id="mentor-review-note" maxLength={1000} name="note" rows={4} />
            </div>
            <div className="mentor-review-actions">
              {profile.status !== "APPROVED" && <button className="button button-navy" name="decision" value="APPROVED" type="submit">Approve</button>}
              {profile.status !== "REJECTED" && <button className="button button-outline-dark" name="decision" value="REJECTED" type="submit">Reject</button>}
              {profile.status !== "NEEDS_INFO" && <button className="button button-outline-dark" name="decision" value="NEEDS_INFO" type="submit">Request more information</button>}
              {profile.status !== "SUSPENDED" && <button className="button button-outline-dark" name="decision" value="SUSPENDED" type="submit">Suspend</button>}
              {profile.status === "SUSPENDED" && <button className="button button-navy" name="decision" value="APPROVED" type="submit">Reinstate</button>}
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
