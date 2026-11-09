import { Suspense } from "react";
import { connection } from "next/server";
import Image from "next/image";
import { requireStudent } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";

export default function MentorsPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading mentors…</p>}>
      <MentorDirectory />
    </Suspense>
  );
}

async function MentorDirectory() {
  await connection();
  await requireStudent();
  const mentors = await prisma.mentorProfile.findMany({
    where: { status: "APPROVED" },
    orderBy: [{ industry: "asc" }, { jobTitle: "asc" }],
    select: {
      jobTitle: true,
      industry: true,
      bio: true,
      photoFileId: true,
      user: { select: { name: true, surname: true } },
      interests: { select: { interest: { select: { name: true } } } },
    },
  });

  return (
    <main className="events-page">
      <section className="events-inner">
        <p className="eyebrow">Learn from women in tech</p>
        <h1>Meet your mentors</h1>
        <p className="events-intro">Explore approved GiT mentors and the areas they can support.</p>
        {mentors.length ? (
          <div className="mentor-directory-grid">
            {mentors.map((mentor, index) => (
              <article className="mentor-directory-card" key={`${mentor.user.name}-${index}`}>
                {mentor.photoFileId ? (
                  <Image
                    alt={`${mentor.user.name} ${mentor.user.surname}`}
                    className="mentor-directory-photo"
                    height={80}
                    src={`/api/files/${mentor.photoFileId}`}
                    unoptimized
                    width={80}
                  />
                ) : (
                  <div aria-hidden="true" className="mentor-directory-photo mentor-photo-placeholder">
                    {mentor.user.name.slice(0, 1)}{mentor.user.surname.slice(0, 1)}
                  </div>
                )}
                <p className="eyebrow">{mentor.industry}</p>
                <h2>{mentor.user.name} {mentor.user.surname}</h2>
                <p className="mentor-directory-title">{mentor.jobTitle}</p>
                <p>{mentor.bio}</p>
                <p><strong>Can mentor on:</strong> {mentor.interests.map(({ interest }) => interest.name).join(", ")}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="events-empty">There are no approved mentors to show yet. Please check back soon.</p>
        )}
      </section>
    </main>
  );
}
