import { TeamRoleTitle } from "@prisma/client";

export const teamRoster = [
  {
    name: "Dr Thembeka Manetje",
    role: "Lead Organiser",
    roleTitle: TeamRoleTitle.LEAD,
    bio: "Lead organiser for Girls in Tech at the Soshanguve campus.",
    imageSrc: "/team/dr-thembeka-manetje.jpg",
    portraitFraming: "chin-clearance",
  },
  {
    name: "Idah Mokwena",
    role: "Co-Lead Organiser",
    roleTitle: TeamRoleTitle.COMMITTEE,
    bio: "Co-lead organiser for the Soshanguve campus team.",
    imageSrc: "/team/idah-mokwena.jpg",
    portraitFraming: "default",
  },
  {
    name: "Refiloe Mthethwa",
    role: "Co-Lead Organiser",
    roleTitle: TeamRoleTitle.COMMITTEE,
    bio: "Co-lead organiser for the Soshanguve campus team.",
    imageSrc: "/team/refiloe-mthethwa-full-face-v2.jpg",
    portraitFraming: "chin-clearance",
  },
  {
    name: "Tshegofatso Letsoalo",
    role: "Co-Lead Organiser",
    roleTitle: TeamRoleTitle.COMMITTEE,
    bio: "Co-lead organiser for the Soshanguve campus team.",
    imageSrc: null,
    portraitFraming: "default",
  },
  {
    name: "Kgothatso Monono",
    role: "Girls in Tech Journalist",
    roleTitle: TeamRoleTitle.JOURNALIST,
    bio: "Girls in Tech journalist for the Soshanguve campus team.",
    imageSrc: "/team/kgothatso-monono.jpg",
    portraitFraming: "default",
  },
] as const;
