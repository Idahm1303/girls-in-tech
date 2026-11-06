import { Suspense } from "react";
import { requireRole } from "@/lib/member-access";

export default function MentorHomePage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading your account…</p>}>
      <MentorContent />
    </Suspense>
  );
}

async function MentorContent() {
  const member = await requireRole("MENTOR");
  return (
    <main className="dashboard-page">
      <section className="dashboard-inner">
        <p className="eyebrow">Girls in Tech</p>
        <h1>Welcome, {member.name}.</h1>
        <p className="account-intro">The mentor area is coming soon.</p>
      </section>
    </main>
  );
}
