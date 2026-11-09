import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
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
    icon: "calendar",
    title: "Browse Events",
    description: "View upcoming events and explore articles from past events.",
    href: "/events",
    button: "Events library",
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
  await connection();
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
                {action.icon === "calendar" ? (
                  <svg
                    aria-hidden="true"
                    className="dashboard-event-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      height="17"
                      rx="2.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      width="18"
                      x="3"
                      y="4.5"
                    />
                    <path
                      d="M8 2.75v3.5M16 2.75v3.5M3 9.5h18M8 13h3m-3 4h3m3-4h3m-3 4h3"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                ) : (
                  action.icon
                )}
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
