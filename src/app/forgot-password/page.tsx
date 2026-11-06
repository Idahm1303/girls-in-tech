import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="brand-state">
      <p className="eyebrow">Account help</p>
      <h1>Password reset is not available yet</h1>
      <p className="coming-soon-copy">
        Please contact a GiT administrator for help accessing your account.
      </p>
      <Link className="button button-navy" href="/login">
        Back to log in
      </Link>
    </main>
  );
}
