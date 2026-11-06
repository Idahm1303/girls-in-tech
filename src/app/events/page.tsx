import { Suspense } from "react";
import { ComingSoonPage } from "@/components/coming-soon-page";

export default function EventsPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading events…</p>}>
      <ComingSoonPage title="Events" />
    </Suspense>
  );
}
