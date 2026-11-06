import { Suspense } from "react";
import Link from "next/link";
import { requireStudent } from "@/lib/member-access";

const actions = [
  {
    icon: "👩🏽‍💻",
    title: "Choose a Mentor",
    description: "Find guidance and grow with someone who understands your goals.",
    href: "/mentors",
    button: "Find a mentor",
  },
  {
    icon: "📅",
    title: "Browse Events",
    description: "Meet your community and take part in what’s happening at GiT.",
    href: "/events",
    button: "Explore events",
  },
  {
    icon: "✨",
    title: "Opportunities",
    description: "Explore WIL, learnerships and bursaries for your next step.",
    href: "/opportunities",
    button: "View opportunities",
  },
];

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading your dashboard…</p>}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const member = await requireStudent();

  return (
    <main className="dashboard-page">
      <section className="dashboard-inner" aria-labelledby="dashboard-title">
        <p className="eyebrow">Your GiT community</p>
        <h1 id="dashboard-title">Hi {member.name}! What would you like to do today?</h1>
        <div className="dashboard-grid">
          {actions.map((action) => (
            <article className="dashboard-card" key={action.href}>
              <span aria-hidden="true" className="dashboard-icon">
                {action.icon}
              </span>
              <h2>{action.title}</h2>
              <p>{action.description}</p>
              <Link className="button button-navy" href={action.href}>
                {action.button} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
