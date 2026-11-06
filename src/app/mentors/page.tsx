import { Suspense } from "react";
import { ComingSoonPage } from "@/components/coming-soon-page";

export default function MentorsPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading mentors…</p>}>
      <ComingSoonPage title="Mentors" />
    </Suspense>
  );
}
