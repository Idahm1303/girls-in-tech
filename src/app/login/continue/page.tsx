import { Suspense } from "react";
import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { postLoginPath } from "@/lib/account-routing";

export default function LoginContinuePage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading your account…</p>}>
      <ContinueLogin />
    </Suspense>
  );
}

async function ContinueLogin() {
  await connection();
  const session = await auth();

  if (!session?.user) redirect("/login");

  return redirect(
    postLoginPath(session.user.role, session.user.profileCompleted),
  );
}
