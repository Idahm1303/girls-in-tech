import Link from "next/link";
import { GitLogo } from "@/components/brand/git-logo";
import { MottoBanner } from "@/components/brand/motto-banner";

export default function NotFound() {
  return (
    <main className="brand-state" aria-labelledby="not-found-title">
      <span className="brand-state-mark">
        <GitLogo />
      </span>
      <p className="eyebrow">404 · Page not found</p>
      <h1 id="not-found-title">This page took a different path.</h1>
      <MottoBanner className="brand-state-motto" />
      <Link className="button button-periwinkle" href="/">
        Back to home <span aria-hidden="true">↗</span>
      </Link>
    </main>
  );
}
