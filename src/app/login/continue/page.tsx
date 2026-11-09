import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentMember, postLoginPath } from "@/lib/member-access";

export default function LoginContinuePage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading your account…</p>}>
      <ContinueLogin />
    </Suspense>
  );
}

async function ContinueLogin() {
  await connection();
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  return redirect(
    postLoginPath(
      member.role,
      Boolean(member.studentProfile?.profileCompletedAt),
      member.mentorProfile?.status,
    ),
  );
}
