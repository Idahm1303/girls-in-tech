import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { MentorApplicationStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  status?: string | string[];
  q?: string | string[];
  page?: string | string[];
}>;

const statusNames: Record<MentorApplicationStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NEEDS_INFO: "Needs info",
  SUSPENDED: "Suspended",
};
const pageSize = 10;

export default function AdminMentorsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<p className="account-loading">Loading mentor applications…</p>}>
      <AdminMentorsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminMentorsContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const statuses = Object.values(MentorApplicationStatus) as MentorApplicationStatus[];
  const selectedStatus = statuses.find((status) => status === params.status) ?? "PENDING";
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const pageNumber = typeof params.page === "string" && /^\d+$/.test(params.page)
    ? Math.max(1, Number(params.page))
    : 1;
  const where = {
    status: selectedStatus,
    ...(query
      ? {
          user: {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { surname: { contains: query, mode: "insensitive" as const } },
              { email: { contains: query, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };
  const [total, applications] = await prisma.$transaction([
    prisma.mentorProfile.count({ where }),
    prisma.mentorProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        industry: true,
        createdAt: true,
        user: { select: { id: true, name: true, surname: true, email: true } },
        interests: { select: { interest: { select: { name: true } } } },
      },
    }),
  ]);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const buildUrl = (page: number) => {
    const url = new URLSearchParams({ status: selectedStatus });
    if (query) url.set("q", query);
    if (page > 1) url.set("page", String(page));
    return `/admin/mentors?${url.toString()}`;
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-inner">
        <p className="eyebrow">Girls in Tech administration</p>
        <h1>Mentor applications</h1>
        <nav aria-label="Application status" className="mentor-admin-tabs">
          {statuses.map((status) => (
            <Link
              aria-current={status === selectedStatus ? "page" : undefined}
              href={`/admin/mentors?status=${status}`}
              key={status}
            >
              {statusNames[status]}
            </Link>
          ))}
        </nav>
        <section className="admin-students">
          <form action="/admin/mentors" className="mentor-admin-search" method="get">
            <input name="status" type="hidden" value={selectedStatus} />
            <label htmlFor="mentor-search">Search applications</label>
            <input defaultValue={query} id="mentor-search" name="q" placeholder="Name or email" />
            <button className="button button-navy" type="submit">Search</button>
          </form>
          <p className="admin-student-count">
            {total} {total === 1 ? "application" : "applications"} · {statusNames[selectedStatus]}
          </p>
          {applications.length ? (
            <div className="admin-student-list">
              {applications.map((application) => (
                <article className="admin-student-card" key={application.id}>
                  <div>
                    <h2>{application.user.name} {application.user.surname}</h2>
                    <p>{application.user.email} · {application.industry}</p>
                    <p>{application.interests.map(({ interest }) => interest.name).join(", ")}</p>
                  </div>
                  <Link className="button button-navy" href={`/admin/mentors/${application.user.id}`}>
                    Review application
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="events-empty">No {statusNames[selectedStatus].toLowerCase()} applications found.</p>
          )}
          <nav aria-label="Application pages" className="mentor-pagination">
            <span>Page {pageNumber} of {lastPage}</span>
            {pageNumber > 1 && <Link href={buildUrl(pageNumber - 1)}>Previous</Link>}
            {pageNumber < lastPage && <Link href={buildUrl(pageNumber + 1)}>Next</Link>}
          </nav>
        </section>
      </section>
    </main>
  );
}
