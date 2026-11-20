import type { Metadata } from "next";
import { connection } from "next/server";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { prisma } from "@/lib/prisma";
import { teamRoster } from "@/lib/team-roster";

export const metadata: Metadata = {
  title: "Our Team | Girls in Tech",
  description: "Meet the Girls in Tech organisers for the Soshanguve Campus.",
};

export default async function TeamPage() {
  await connection();
  const photoByName = new Map<string, string>();
  try {
    const savedMembers = await prisma.teamMember.findMany({
      where: { name: { in: teamRoster.map((member) => member.name) } },
      select: { name: true, imageUrl: true },
    });
    for (const member of savedMembers) {
      if (member.imageUrl) photoByName.set(member.name, member.imageUrl);
    }
  } catch (error) {
    console.error(
      "Could not load saved team photos; using repository portraits.",
      error,
    );
  }

  const [leadOrganiser, ...coLeads] = teamRoster;

  return (
    <main className="team-page">
      <section aria-labelledby="team-title" className="team-inner">
        <p className="eyebrow">Girls in Tech · Soshanguve Campus</p>
        <h1 id="team-title">Meet our team</h1>
        <p className="team-intro">
          Meet the organisers bringing the Girls in Tech community together at
          the Soshanguve Campus.
        </p>

        <section aria-labelledby="lead-organiser-title" className="team-lead-section">
          <h2 className="team-section-title" id="lead-organiser-title">Lead organiser</h2>
          <TeamMemberCard
            featured
            imageSrc={photoByName.get(leadOrganiser.name) ?? leadOrganiser.imageSrc}
            fallbackImageSrc={leadOrganiser.imageSrc}
            name={leadOrganiser.name}
            portraitFraming={leadOrganiser.portraitFraming}
            role={leadOrganiser.role}
          />
        </section>

        <section aria-labelledby="campus-team-title" className="team-co-leads-section">
          <h2 className="team-section-title" id="campus-team-title">Soshanguve campus team</h2>
          <div className="team-co-leads-grid">
            {coLeads.map((member) => (
              <TeamMemberCard
                imageSrc={photoByName.get(member.name) ?? member.imageSrc}
                fallbackImageSrc={member.imageSrc}
                key={member.name}
                name={member.name}
                portraitFraming={member.portraitFraming}
                role={member.role}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
