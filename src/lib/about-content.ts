import { z } from "zod";

export const ABOUT_PAGE_CONTENT_ID = "main";

export const ABOUT_PAGE_DEFAULTS = {
  introduction:
    "Girls in Tech (GiT) is a community in the Faculty of ICT at Tshwane University of Technology, created to make sure every woman in technology knows she belongs and graduates ready for the industry. Open to women across our Soshanguve, Emalahleni, Polokwane and Giyane campuses, GiT brings together students, mentors, facilitators and industry partners to learn, grow and lift each other up.",
  whatWeDo:
    "Through mentorship, workshops, webinars and events, members build technical skills, confidence and professional networks. Our platform connects students with mentors who share their interests, and opens doors to Work Integrated Learning placements, learnerships and bursaries, so that talent is matched with opportunity.",
  commitment:
    "GiT also supports TUT's vision of being an entrepreneurship university by encouraging young women to think beyond employment and create solutions, businesses and careers of their own. Championed by Dr Thembeka Manetje and led by our chairperson, together with our facilitators, journalist and committee members, GiT is proud to say: Limitless minds. Infinite Code.",
  vision:
    "Women in technology are confident, connected and recognised as leaders who shape an inclusive digital future.",
  mission:
    "To build a supportive community that equips women in technology with skills, mentorship, networks and opportunities to thrive.",
} as const;

export const aboutPageContentSchema = z.object({
  introduction: z.string().trim().min(1).max(2000),
  whatWeDo: z.string().trim().min(1).max(2000),
  commitment: z.string().trim().min(1).max(2000),
  vision: z.string().trim().min(1).max(1000),
  mission: z.string().trim().min(1).max(1000),
});

export const ABOUT_TEAM_ROLES = [
  "LEAD",
  "FACILITATOR",
  "JOURNALIST",
  "COMMITTEE",
] as const;

export const aboutTeamRoleLabels: Record<(typeof ABOUT_TEAM_ROLES)[number], string> = {
  LEAD: "GiT lead",
  FACILITATOR: "Facilitator",
  JOURNALIST: "Journalist",
  COMMITTEE: "Committee member",
};

export const aboutTeamMemberSchema = z.object({
  id: z.string().trim().max(128).optional(),
  name: z.string().trim().min(1).max(120),
  roleTitle: z.enum(ABOUT_TEAM_ROLES),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) =>
        value === "" ||
        (/^https?:\/\//i.test(value) && !/\s/.test(value)) ||
        (value.startsWith("/") && !value.startsWith("//")),
      "Use an HTTPS URL or a local image path.",
    ),
});
