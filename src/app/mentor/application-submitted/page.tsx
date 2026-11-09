import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getCurrentMember } from "@/lib/member-access";
import { ApplicationSubmittedMessage } from "./application-message";

export default function MentorApplicationSubmittedPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading confirmation…</p>}>
      <SubmittedContent />
    </Suspense>
  );
}

async function SubmittedContent() {
  await connection();
  const member = await getCurrentMember();

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="application-submitted-title">
        <p className="eyebrow">Application submitted</p>
        <h1 id="application-submitted-title">Thank you.</h1>
        <ApplicationSubmittedMessage />
        <p className="welcome-motto">Limitless minds. Infinite Code.</p>
        {member ? (
          <p className="account-switch">
            Your existing account is now pending mentor approval. <Link href="/mentor/status">View application status</Link>
          </p>
        ) : (
          <p className="account-switch">
            You can sign in to add a profile photo while your application is in
            review. <Link href="/login">Log in</Link>
          </p>
        )}
      </section>
    </main>
  );
}
