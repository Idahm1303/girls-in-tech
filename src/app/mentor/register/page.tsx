import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getCurrentMember, postLoginPath } from "@/lib/member-access";
import { MENTOR_EXPERTISE } from "@/lib/mentor-validation";
import { prisma } from "@/lib/prisma";
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
  const expertiseOptions = await prisma.interest.findMany({
    where: { name: { in: [...MENTOR_EXPERTISE] } },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const member = await getCurrentMember();
  if (member) {
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
          <p className="eyebrow">Mentor account</p>
          <h1>You&apos;re already signed in</h1>
          <p className="account-intro">
            Your account is active. <Link href={postLoginPath(
              member.role,
              Boolean(member.studentProfile?.profileCompletedAt),
              member.mentorProfile?.status,
            )}>Continue to your account</Link>.
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
        <MentorRegistrationForm expertiseOptions={expertiseOptions.map(({ name }) => name)} />
      </section>
    </main>
  );
}
