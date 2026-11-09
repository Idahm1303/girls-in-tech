import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentMember, postLoginPath } from "@/lib/member-access";
import { LoginForm } from "@/app/login/login-form";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading admin login…</p>}>
      <AdminLoginContent />
    </Suspense>
  );
}

async function AdminLoginContent() {
  await connection();
  const member = await getCurrentMember();

  if (member) {
    redirect(
      postLoginPath(
        member.role,
        Boolean(member.studentProfile?.profileCompletedAt),
        member.mentorProfile?.status,
      ),
    );
  }

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="admin-login-title">
        <p className="eyebrow">Girls in Tech administration</p>
        <h1 id="admin-login-title">Admin log in</h1>
        <p className="account-intro">
          Sign in with your administrator account to view and filter student
          information.
        </p>
        <LoginForm initialEmail="" showRegisterLink={false} />
      </section>
    </main>
  );
}
