import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { welcomeFlashSchema } from "@/lib/account-validation";
import { getCurrentMember, postLoginPath } from "@/lib/member-access";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading login…</p>}>
      <LoginContent />
    </Suspense>
  );
}

async function LoginContent() {
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

  const welcomeCookie = (await cookies()).get("git-welcome")?.value;
  let welcome = null;
  if (welcomeCookie) {
    try {
      const parsed = welcomeFlashSchema.safeParse(JSON.parse(welcomeCookie));
      if (parsed.success) welcome = parsed.data;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="login-title">
        {welcome && (
          <div className="welcome-banner" role="status">
            <p>
              Welcome to Girls in Tech, {welcome.name} {welcome.surname}! Your
              account is ready. Please log in to continue.
            </p>
            <p className="welcome-motto">Limitless minds. Infinite Code.</p>
          </div>
        )}
        <p className="eyebrow">Welcome back</p>
        <h1 id="login-title">Log in to GiT</h1>
        <LoginForm initialEmail={welcome?.email ?? ""} />
        <p className="account-switch">
          Administrator? <Link href="/admin/login">Admin log in</Link>
        </p>
      </section>
    </main>
  );
}
