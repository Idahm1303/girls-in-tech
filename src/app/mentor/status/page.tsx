import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getCurrentMember } from "@/lib/member-access";
import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { resubmitMentorApplication, uploadOwnMentorPhoto } from "./actions";

const statusCopy = {
  PENDING: {
    title: "Your application is under review",
    body: "Thank you for offering your time and experience. We will email you once a GiT admin has made a decision.",
  },
  NEEDS_INFO: {
    title: "A little more information is needed",
    body: "Please review the administrator's note, update the requested details below, and resubmit your application.",
  },
  REJECTED: {
    title: "Your application was not approved",
    body: "Thank you for your interest in mentoring with GiT. Please contact the GiT team if you have questions.",
  },
  SUSPENDED: {
    title: "Your mentor account is currently suspended",
    body: "Please contact the GiT administration team for assistance.",
  },
} as const;

export default function MentorStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  return (
    <Suspense fallback={<p className="account-loading">Loading your application status…</p>}>
      <MentorStatusContent searchParams={searchParams} />
    </Suspense>
  );
}

async function MentorStatusContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  await connection();
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role !== "MENTOR") redirect("/mentor");
  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: member.id },
    select: {
      status: true,
      reviewNote: true,
      jobTitle: true,
      company: true,
      bio: true,
      motivation: true,
      photoFileId: true,
    },
  });
  if (!profile) redirect("/mentor/register");
  if (profile.status === "APPROVED") redirect("/mentor");
  const content = statusCopy[profile.status];
  const query = await searchParams;
  const queryError = query.error === "choose-photo"
    ? "Choose an image to upload."
    : query.error;

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="mentor-status-title">
        <p className="eyebrow">Mentor application · {profile.status.replace("_", " ")}</p>
        <h1 id="mentor-status-title">{content.title}</h1>
        <p className="account-intro">{content.body}</p>
        {query.updated && <p className="welcome-banner" role="status">Your photo was updated.</p>}
        <form action={uploadOwnMentorPhoto} className="mentor-own-photo-form">
          <label htmlFor="mentor-own-photo">Your profile photo (JPG, PNG or WebP; max 2 MB)</label>
          <input accept="image/jpeg,image/png,image/webp" id="mentor-own-photo" name="photo" required type="file" />
          <p className="field-hint">Images are resized to 600px wide and compressed before secure storage.</p>
          <button className="button button-outline-dark" type="submit">Upload my photo</button>
        </form>
        {profile.photoFileId && (
          <p><Image alt="Your mentor profile" className="mentor-profile-photo" height={80} src={`/api/files/${profile.photoFileId}`} unoptimized width={80} /></p>
        )}
        {queryError && <p className="form-message" role="alert">{queryError}</p>}
        {profile.reviewNote && (
          <div className="mentor-review-note">
            <strong>Note from the GiT admin</strong>
            <p>{profile.reviewNote}</p>
          </div>
        )}
        {profile.status === "NEEDS_INFO" && (
          <form action={resubmitMentorApplication} className="account-form">
            <div className="form-field">
              <label htmlFor="mentor-update-job">Job title</label>
              <input defaultValue={profile.jobTitle} id="mentor-update-job" name="jobTitle" required />
            </div>
            <div className="form-field">
              <label htmlFor="mentor-update-company">Company or institution</label>
              <input defaultValue={profile.company} id="mentor-update-company" name="company" required />
            </div>
            <div className="form-field">
              <label htmlFor="mentor-update-bio">Short bio (max 600 characters)</label>
              <textarea defaultValue={profile.bio} id="mentor-update-bio" maxLength={600} name="bio" required rows={4} />
            </div>
            <div className="form-field">
              <label htmlFor="mentor-update-motivation">Why you want to mentor (max 500 characters)</label>
              <textarea defaultValue={profile.motivation} id="mentor-update-motivation" maxLength={500} name="motivation" required rows={4} />
            </div>
            <button className="account-submit" type="submit">Resubmit for review</button>
          </form>
        )}
        {profile.status === "REJECTED" && (
          <p className="account-switch">
            <Link href="/contact">Contact GiT administration</Link>
          </p>
        )}
        {profile.status === "SUSPENDED" && (
          <p className="account-switch">
            <Link href="/contact">Contact GiT administration</Link>
          </p>
        )}
      </section>
    </main>
  );
}
