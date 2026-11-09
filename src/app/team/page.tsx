import type { Metadata } from "next";
import { TeamMemberCard } from "@/components/team/team-member-card";

export const metadata: Metadata = {
  title: "Our Team | Girls in Tech",
  description: "Meet the Girls in Tech organisers for the Soshanguve Campus.",
};

const coLeads = [
  {
    name: "Idah Mokwena",
    role: "Co-Lead Organiser",
    initials: "IM",
    imageSrc: "/team/idah-mokwena.png",
  },
  {
    name: "Refiloe Mthethwa",
    role: "Co-Lead Organiser",
    initials: "RM",
    imageSrc: "/team/refiloe-mthethwa.jpg",
  },
  {
    name: "Tshegofatso Letsoalo",
    role: "Co-Lead Organiser",
    initials: "TL",
    imageSrc: "/team/tshegofatso-letsoalo.jpg",
  },
  {
    name: "Kgothatso Monono",
    role: "Girls in Tech Journalist",
    initials: "KM",
    imageSrc: "/team/kgothatso-monono.jpg",
  },
];

export default function TeamPage() {
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
            imageSrc="/team/thembeka-manetje.jpg"
            initials="TM"
            name="Dr Thembeka Manetje"
            role="Lead Organiser"
          />
        </section>

        <section aria-labelledby="campus-team-title" className="team-co-leads-section">
          <h2 className="team-section-title" id="campus-team-title">Soshanguve campus team</h2>
          <div className="team-co-leads-grid">
            {coLeads.map((member) => (
              <TeamMemberCard
                imageSrc={member.imageSrc}
                initials={member.initials}
                key={member.name}
                name={member.name}
                role={member.role ?? "Co-Lead Organiser"}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
