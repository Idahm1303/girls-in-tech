import { GitLogo } from "@/components/brand/git-logo";
import { MottoBanner } from "@/components/brand/motto-banner";

export default function Loading() {
  return (
    <main className="brand-state" aria-busy="true" aria-live="polite">
      <span className="brand-state-mark loading-mark">
        <GitLogo />
      </span>
      <p className="eyebrow">Making space for what&apos;s next</p>
      <MottoBanner className="brand-state-motto" />
      <span className="loading-indicator" role="progressbar" aria-label="Loading" />
    </main>
  );
}
