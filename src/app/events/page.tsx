import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { TUT_EVENT_ARCHIVE } from "@/lib/event-archive";
import { requireStudent } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";

type EventsSearchParams = Promise<{ view?: string | string[] }>;

const articleDateFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "long",
  timeZone: "UTC",
});

const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "long",
  timeZone: "Africa/Johannesburg",
});

export default function EventsPage({
  searchParams,
}: {
  searchParams: EventsSearchParams;
}) {
  return (
    <Suspense fallback={<p className="account-loading">Loading events…</p>}>
      <EventsLibrary searchParams={searchParams} />
    </Suspense>
  );
}

async function EventsLibrary({
  searchParams,
}: {
  searchParams: EventsSearchParams;
}) {
  await connection();
  await requireStudent();

  const { view } = await searchParams;
  const showPast = view === "past";
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      ...(showPast ? { endsAt: { lt: now } } : { endsAt: { gte: now } }),
    },
    orderBy: { startsAt: showPast ? "desc" : "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      venue: true,
      onlineUrl: true,
    },
  });

  return (
    <main className="events-page">
      <section className="events-inner" aria-labelledby="events-title">
        <p className="eyebrow">Girls in Tech · TUT Faculty of ICT</p>
        <h1 id="events-title">Events library</h1>
        <p className="events-intro">
          Find your next GiT gathering or revisit highlights from events past.
        </p>

        <nav aria-label="Event library" className="events-tabs">
          <Link
            aria-current={!showPast ? "page" : undefined}
            className={!showPast ? "events-tab events-tab-active" : "events-tab"}
            href="/events?view=upcoming"
          >
            Upcoming events
          </Link>
          <Link
            aria-current={showPast ? "page" : undefined}
            className={showPast ? "events-tab events-tab-active" : "events-tab"}
            href="/events?view=past"
          >
            Past events &amp; articles
          </Link>
        </nav>

        {showPast ? (
          <PastEvents events={events} />
        ) : (
          <section aria-label="Upcoming events" className="event-list">
            {events.length ? (
              events.map((event) => (
                <article className="event-card" key={event.id}>
                  <p className="event-date">{dateFormatter.format(event.startsAt)}</p>
                  <h2>{event.title}</h2>
                  <p>{event.description}</p>
                  {event.venue && <p className="event-meta">{event.venue}</p>}
                  {event.onlineUrl && (
                    <a
                      className="event-article-link"
                      href={event.onlineUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Join event <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </article>
              ))
            ) : (
              <p className="events-empty">
                There are no upcoming events right now. Check back soon.
              </p>
            )}
          </section>
        )}

        <Link className="events-back-link" href="/dashboard">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}

function PastEvents({
  events,
}: {
  events: Array<{
    id: string;
    title: string;
    description: string;
    startsAt: Date;
    venue: string | null;
    onlineUrl: string | null;
  }>;
}) {
  return (
    <>
      <p className="events-archive-note">
        TUT newsroom articles related to Girls in Tech. Dates shown are
        publication dates unless an event date is specified in the article.
      </p>
      <section aria-label="TUT Girls in Tech articles" className="event-list">
        {TUT_EVENT_ARCHIVE.map((article) => (
          <article className="event-card" key={article.url}>
            <p className="event-date">
              TUT article ·{" "}
              {articleDateFormatter.format(
                new Date(`${article.publishedAt}T12:00:00Z`),
              )}
            </p>
            <h2>{article.title}</h2>
            <p>{article.summary}</p>
            {article.eventDate && (
              <p className="event-meta">
                Event held{" "}
                {articleDateFormatter.format(
                  new Date(`${article.eventDate}T12:00:00Z`),
                )}
              </p>
            )}
            <a
              className="event-article-link"
              href={article.url}
              rel="noreferrer"
              target="_blank"
            >
              Read TUT article <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}
      </section>

      {events.length > 0 && (
        <section aria-label="Other past events" className="event-list events-past-list">
          <h2 className="events-section-title">Other past events</h2>
          {events.map((event) => (
            <article className="event-card" key={event.id}>
              <p className="event-date">{dateFormatter.format(event.startsAt)}</p>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              {event.venue && <p className="event-meta">{event.venue}</p>}
              {event.onlineUrl && (
                <a
                  className="event-article-link"
                  href={event.onlineUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Read more <span aria-hidden="true">↗</span>
                </a>
              )}
            </article>
          ))}
        </section>
      )}
    </>
  );
}
