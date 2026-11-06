import Link from "next/link";
import { requireStudent } from "@/lib/member-access";

export async function ComingSoonPage({ title }: { title: string }) {
  await requireStudent();

  return (
    <main className="brand-state">
      <p className="eyebrow">Girls in Tech · TUT Faculty of ICT</p>
      <h1>{title}</h1>
      <p className="coming-soon-copy">Coming soon in the next phase.</p>
      <Link className="button button-navy" href="/dashboard">
        Back to dashboard
      </Link>
    </main>
  );
}
