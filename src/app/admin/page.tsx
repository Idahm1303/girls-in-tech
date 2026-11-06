import { Suspense } from "react";
import { requireRole } from "@/lib/member-access";

export default function AdminHomePage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading your account…</p>}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  const member = await requireRole("ADMIN");
  return (
    <main className="dashboard-page">
      <section className="dashboard-inner">
        <p className="eyebrow">Girls in Tech administration</p>
        <h1>Welcome, {member.name}.</h1>
      </section>
    </main>
  );
}
