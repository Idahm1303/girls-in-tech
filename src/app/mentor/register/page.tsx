import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getCurrentMember } from "@/lib/member-access";
import { MENTOR_EXPERTISE } from "@/lib/mentor-validation";
import { MentorRegistrationForm } from "./mentor-registration-form";

export default function MentorRegistrationPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading mentor application…</p>}>
      <MentorRegistrationContent />
    </Suspense>
  );
}

async function MentorRegistrationContent() {
  await connection();
  const member = await getCurrentMember();
  if (member && member.role !== "STUDENT") {
    if (member.role === "MENTOR" && member.mentorProfile?.status === "NEEDS_INFO") {
      return (
        <main className="account-page">
          <section className="account-card">
            <p className="eyebrow">Application update requested</p>
            <h1>Update your mentor application</h1>
            <p className="account-intro">
              Please review the administrator&apos;s note and update your
              application from your <Link href="/mentor/status">mentor status page</Link>.
            </p>
          </section>
        </main>
      );
    }

    return (
      <main className="account-page">
        <section className="account-card">
          <p className="eyebrow">{member.role === "MENTOR" ? "Mentor account" : "Admin account"}</p>
          <h1>{member.role === "MENTOR" ? "You already have a mentor account" : "Admin accounts cannot apply"}</h1>
          <p className="account-intro">
            {member.role === "MENTOR"
              ? <>View your <Link href="/mentor/status">mentor application status</Link>.</>
              : <>Sign in with a student account to apply as a mentor.</>}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="account-page">
      <section className="mentor-registration-card" aria-labelledby="mentor-register-title">
        <p className="eyebrow">Register as a mentor · Admin approval required</p>
        <h1 id="mentor-register-title">Share your experience. Shape what&apos;s next.</h1>
        <p className="account-intro">
          Complete the three steps below. Your profile will only appear to GiT
          members after an administrator approves your application.
        </p>
        <MentorRegistrationForm
          expertiseOptions={[...MENTOR_EXPERTISE]}
          member={member ? {
            name: member.name,
            surname: member.surname,
            email: member.email,
          } : undefined}
        />
      </section>
    </main>
  );
}
