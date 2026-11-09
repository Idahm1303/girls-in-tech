import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentMember, roleHome } from "@/lib/member-access";
import { ProfileForm } from "./profile-form";

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading your profile…</p>}>
      <CompleteProfileContent />
    </Suspense>
  );
}

async function CompleteProfileContent() {
  await connection();
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role !== "STUDENT") redirect(roleHome[member.role]);
  if (member.studentProfile?.profileCompletedAt) redirect("/dashboard");

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="profile-title">
        <p className="eyebrow">One-time setup</p>
        <h1 id="profile-title">Hi {member.name}, let&apos;s finish setting you up</h1>
        <p className="account-intro">
          Add your TUT details so we can connect you with the GiT community.
        </p>
        <ProfileForm />
      </section>
    </main>
  );
}
