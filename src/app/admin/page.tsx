import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import {
  COURSE_OPTIONS,
  STUDY_YEAR_OPTIONS,
} from "@/lib/account-validation";
import { requireAdmin } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";

type AdminSearchParams = Promise<{
  year?: string | string[];
  course?: string | string[];
  mentor?: string | string[];
}>;

const yearLabels: Record<number, string> = {
  1: "First year",
  2: "Second year",
  3: "Third year",
};

export default function AdminHomePage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  return (
    <Suspense fallback={<p className="account-loading">Loading your account…</p>}>
      <AdminContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminContent({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  await connection();
  const member = await requireAdmin();
  const {
    year: requestedYear,
    course: requestedCourse,
    mentor: requestedMentor,
  } = await searchParams;
  const selectedYear = requestedYear === STUDY_YEAR_OPTIONS[0]
    ? 1
    : requestedYear === STUDY_YEAR_OPTIONS[1]
      ? 2
      : requestedYear === STUDY_YEAR_OPTIONS[2]
        ? 3
        : undefined;
  const selectedCourse =
    typeof requestedCourse === "string"
      ? COURSE_OPTIONS.find((course) => course === requestedCourse)
      : undefined;
  const mentors = await prisma.user.findMany({
    where: { role: "MENTOR" },
    orderBy: [{ name: "asc" }, { surname: "asc" }],
    select: { id: true, name: true, surname: true },
  });
  const selectedMentor =
    typeof requestedMentor === "string" &&
    mentors.some((mentor) => mentor.id === requestedMentor)
      ? requestedMentor
      : undefined;
  const selectedMentorProfile = mentors.find(
    (mentor) => mentor.id === selectedMentor,
  );
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(selectedYear === undefined ? {} : { yearOfStudy: selectedYear }),
      ...(selectedCourse === undefined
        ? {}
        : { studentProfile: { is: { qualification: selectedCourse } } }),
      ...(selectedMentor === undefined
        ? {}
        : { studentSessions: { some: { mentorId: selectedMentor } } }),
    },
    orderBy: [{ yearOfStudy: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      yearOfStudy: true,
      studentProfile: {
        select: {
          campus: true,
          qualification: true,
        },
      },
      studentSessions: {
        orderBy: { createdAt: "desc" },
        select: {
          status: true,
          mentor: { select: { name: true, surname: true } },
        },
      },
    },
  });

  return (
    <main className="dashboard-page">
      <section className="dashboard-inner">
        <p className="eyebrow">Girls in Tech administration</p>
        <h1>Welcome, {member.name}.</h1>
        <p className="admin-mentor-link">
          <Link className="button button-navy" href="/admin/mentors">
            Review mentor applications
          </Link>
        </p>
        <section aria-labelledby="student-list-title" className="admin-students">
          <div className="admin-students-heading">
            <div>
              <p className="eyebrow">Member directory</p>
              <h2 id="student-list-title">Students</h2>
            </div>
            <form action="/admin" className="admin-year-filter" method="get">
              <label htmlFor="filter-year">Year of study</label>
              <select
                defaultValue={selectedYear?.toString() ?? ""}
                id="filter-year"
                name="year"
              >
                <option value="">All years</option>
                <option value="1">First year</option>
                <option value="2">Second year</option>
                <option value="3">Third year</option>
              </select>
              <label htmlFor="filter-course">Course</label>
              <select
                defaultValue={selectedCourse ?? ""}
                id="filter-course"
                name="course"
              >
                <option value="">All courses</option>
                {COURSE_OPTIONS.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
              <label htmlFor="filter-mentor">Mentor chosen</label>
              <select
                defaultValue={selectedMentor ?? ""}
                id="filter-mentor"
                name="mentor"
              >
                <option value="">All mentors</option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.name} {mentor.surname}
                  </option>
                ))}
              </select>
              <button className="button button-navy" type="submit">
                Apply
              </button>
              {(selectedYear !== undefined ||
                selectedCourse !== undefined ||
                selectedMentor !== undefined) && (
                <Link href="/admin">Clear filter</Link>
              )}
            </form>
          </div>
          <p className="admin-student-count">
            {students.length} {students.length === 1 ? "student" : "students"}
            {selectedYear !== undefined && ` · ${yearLabels[selectedYear]}`}
            {selectedCourse !== undefined && ` · ${selectedCourse}`}
            {selectedMentorProfile &&
              ` · Mentor: ${selectedMentorProfile.name} ${selectedMentorProfile.surname}`}
          </p>
          {students.length ? (
            <div className="admin-student-list">
              {students.map((student) => (
                <article className="admin-student-card" key={student.id}>
                  <div>
                    <h3>
                      {student.name} {student.surname}
                    </h3>
                    <p>{student.email}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Year</dt>
                      <dd>
                        {student.yearOfStudy
                          ? yearLabels[student.yearOfStudy] ?? `Year ${student.yearOfStudy}`
                          : "Not provided"}
                      </dd>
                    </div>
                    <div>
                      <dt>Campus</dt>
                      <dd>{student.studentProfile?.campus ?? "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Course</dt>
                      <dd>
                        {student.studentProfile?.qualification ?? "Not provided"}
                      </dd>
                    </div>
                    <div>
                      <dt>Mentor(s) chosen</dt>
                      <dd>
                        {student.studentSessions.length
                          ? student.studentSessions
                              .map(
                                (session) =>
                                  `${session.mentor.name} ${session.mentor.surname} (${session.status.toLowerCase()})`,
                              )
                              .join(", ")
                          : "No mentor chosen yet"}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="events-empty">
              No students match the selected filters.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
