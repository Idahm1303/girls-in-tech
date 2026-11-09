import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentMember, postLoginPath } from "@/lib/member-access";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading registration…</p>}>
      <RegisterContent />
    </Suspense>
  );
}

async function RegisterContent() {
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
      <section className="account-card" aria-labelledby="register-title">
        <p className="eyebrow">Find your people. Grow your skills.</p>
        <h1 id="register-title">Join Girls in Tech</h1>
        <p className="account-intro">
          Create your GiT account to connect with the community.
        </p>
        <RegisterForm />
        <p className="account-switch">
          Already a member? <Link href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
