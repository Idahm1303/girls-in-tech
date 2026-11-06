import { Suspense } from "react";
import { ComingSoonPage } from "@/components/coming-soon-page";

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading opportunities…</p>}>
      <ComingSoonPage title="Opportunities" />
    </Suspense>
  );
}
