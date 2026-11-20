import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ABOUT_PAGE_CONTENT_ID, ABOUT_PAGE_DEFAULTS, ABOUT_TEAM_ROLES, aboutTeamRoleLabels } from "@/lib/about-content";
import { BRAND } from "@/lib/brand";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "About Girls in Tech",
  description: "Learn about the Girls in Tech community at Tshwane University of Technology.",
};

const aboutLinks = [
  { title: "Mentorship", href: "/mentors" },
  { title: "Events", href: "/events" },
  { title: "Opportunities (WIL, learnerships, bursaries)", href: "/opportunities" },
  { title: "Join GiT", href: "/register" },
];

export default function AboutPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading About Girls in Tech…</p>}>
      <AboutContent />
    </Suspense>
  );
}

async function AboutContent() {
  await connection();
  const [savedContent, teamMembers] = await Promise.all([
    prisma.aboutPageContent.findUnique({
      where: { id: ABOUT_PAGE_CONTENT_ID },
    }),
    prisma.teamMember.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, roleTitle: true, imageUrl: true },
    }),
  ]);
  const content = savedContent ?? ABOUT_PAGE_DEFAULTS;
  const members = teamMembers.length
    ? teamMembers
    : ABOUT_TEAM_ROLES.map((roleTitle) => ({
        id: `placeholder-${roleTitle.toLowerCase()}`,
        name: aboutTeamRoleLabels[roleTitle],
        roleTitle,
        imageUrl: null,
      }));

  return (
    <main className="events-page about-page">
      <section aria-labelledby="about-title" className="events-inner about-inner">
        <p className="eyebrow">Girls in Tech · Faculty of ICT</p>
        <h1 id="about-title">About Girls in Tech</h1>

        <section aria-label="Introduction" className="about-content-section">
          <p>{content.introduction}</p>
        </section>

        <section aria-labelledby="about-what-we-do" className="about-content-section">
          <h2 id="about-what-we-do">What we do</h2>
          <p>{content.whatWeDo}</p>
          <div className="about-links-grid">
            {aboutLinks.map((item) => (
              <Link className="highlight-card about-link-card" href={item.href} key={item.title}>
                <span>{item.title}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="about-commitment" className="about-content-section">
          <h2 id="about-commitment">Our commitment</h2>
          <p>{content.commitment}</p>
        </section>

        <section aria-label="Vision and mission" className="about-content-section about-vision-grid">
          <div>
            <h2>Our vision</h2>
            <p>{content.vision}</p>
          </div>
          <div>
            <h2>Our mission</h2>
            <p>{content.mission}</p>
          </div>
        </section>

        <section aria-labelledby="about-team" className="about-content-section">
          <h2 id="about-team">Meet the team</h2>
          <div className="team-co-leads-grid">
            {members.map((member) => (
              <article className="team-member-card about-team-card" key={member.id}>
                <div className="team-member-copy">
                  <p className="team-member-role">{aboutTeamRoleLabels[member.roleTitle]}</p>
                  <h3>{member.name}</h3>
                </div>
                <figure className="team-member-photo">
                  {member.imageUrl ? (
                    <Image
                      alt={`Portrait of ${member.name}`}
                      fill
                      sizes="(max-width: 520px) 100vw, (max-width: 760px) 50vw, 300px"
                      src={member.imageUrl}
                      unoptimized
                    />
                  ) : (
                    <div aria-label={`Photo of ${member.name} not added`} className="about-team-placeholder">
                      {member.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0] ?? "")
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}
                </figure>
              </article>
            ))}
          </div>
        </section>

        <p className="about-hashtags">{BRAND.hashtags.join(" ")}</p>
        <div className="about-cta">
          <Link className="button button-navy" href="/register">
            Join GiT
          </Link>
          <Link className="button button-outline-dark" href="/mentor/register">
            Become a Mentor
          </Link>
        </div>
      </section>
    </main>
  );
}
