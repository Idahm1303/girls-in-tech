import { z } from "zod";

export const MENTOR_INDUSTRIES = [
  "Software Development",
  "Cybersecurity",
  "Cloud",
  "Data & AI",
  "UX/UI Design",
  "Networking & Infrastructure",
  "Entrepreneurship",
  "Education & Research",
  "Other",
] as const;

export const MENTOR_EXPERTISE = [
  "Software Development",
  "Cybersecurity",
  "Cloud",
  "Data & AI",
  "UX Design",
  "Networking",
  "Entrepreneurship",
  "Career Growth",
  "Interview Prep",
  "CV Review",
] as const;

export const MENTOR_CAMPUS_OPTIONS = [
  "SOSHANGUVE",
  "EMALAHLENI",
  "POLOKWANE",
  "GIYANE",
  "ONLINE_ONLY",
] as const;

export const MENTOR_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export const MENTOR_TIME_BANDS = ["Morning", "Afternoon", "Evening"] as const;
export const MENTOR_EXPERIENCE_BANDS = ["0-2", "3-5", "6-10", "10+"] as const;
export const MENTOR_SESSION_FORMATS = ["ONLINE", "IN_PERSON", "BOTH"] as const;
export const MENTOR_MEETING_TOOLS = ["TEAMS", "ZOOM", "GOOGLE_MEET"] as const;

const emailSchema = z.string().trim().email("Enter a valid email address.").toLowerCase();

export const mentorAccountSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100),
  surname: z.string().trim().min(1, "Enter your surname.").max(100),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid cell number.")
    .max(25, "Enter a valid cell number.")
    .regex(/^[+\d() .-]+$/, "Enter a valid cell number."),
}).superRefine((account, context) => {
  if (account.password !== account.confirmPassword) {
    context.addIssue({
      code: "custom",
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });
  }
});

export const mentorProfessionalSchema = z.object({
  jobTitle: z.string().trim().min(1, "Enter your job title.").max(120),
  company: z.string().trim().min(1, "Enter your company or institution.").max(160),
  industry: z.enum(MENTOR_INDUSTRIES, { error: "Select an industry." }),
  yearsExperience: z.enum(MENTOR_EXPERIENCE_BANDS, {
    error: "Select your years of experience.",
  }),
  qualification: z.string().trim().min(1, "Enter your highest qualification.").max(160),
  isTutAlumna: z.enum(["yes", "no"], { error: "Please select an answer." }),
  bio: z.string().trim().min(20, "Bio must be at least 20 characters.").max(600),
  linkedinUrl: z
    .union([z.literal(""), z.url("Enter a valid LinkedIn URL.")])
    .refine((value) => !value || new URL(value).hostname.toLowerCase().includes("linkedin.com"), {
      message: "Enter a LinkedIn profile URL.",
    }),
  expertise: z.array(z.enum(MENTOR_EXPERTISE)).min(1, "Choose at least one area."),
});

export const mentorPreferencesSchema = z.object({
  sessionFormat: z.enum(MENTOR_SESSION_FORMATS, {
    error: "Select a session format.",
  }),
  meetingTool: z.enum(MENTOR_MEETING_TOOLS, {
    error: "Select a preferred meeting tool.",
  }),
  campuses: z.array(z.enum(MENTOR_CAMPUS_OPTIONS)).min(1, "Select at least one campus or online only."),
  maxMentees: z.coerce.number().int().min(1).max(5),
  availability: z.array(z.string()).min(1, "Select your usual availability."),
  motivation: z.string().trim().min(10, "Please tell us why you want to mentor.").max(500),
  consentPublicProfile: z.literal(true, {
    error: "Consent to displaying your profile is required.",
  }),
  consentCodeOfConduct: z.literal(true, {
    error: "Agreement to the code of conduct is required.",
  }),
  consentPrivacy: z.literal(true, {
    error: "Agreement to the privacy notice is required.",
  }),
});

export const mentorRegistrationSchema = z.object({
  ...mentorAccountSchema.shape,
  ...mentorProfessionalSchema.shape,
  ...mentorPreferencesSchema.shape,
}).superRefine((fields, context) => {
  if (fields.password !== fields.confirmPassword) {
    context.addIssue({
      code: "custom",
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });
  }
  for (const available of fields.availability) {
    const [day, time] = available.split(" ");
    if (
      !MENTOR_WEEKDAYS.includes(day as (typeof MENTOR_WEEKDAYS)[number]) ||
      !MENTOR_TIME_BANDS.includes(time as (typeof MENTOR_TIME_BANDS)[number])
    ) {
      context.addIssue({
        code: "custom",
        message: "Select valid availability options.",
        path: ["availability"],
      });
      break;
    }
  }
  if (
    fields.campuses.includes("ONLINE_ONLY") &&
    fields.campuses.length > 1
  ) {
    context.addIssue({
      code: "custom",
      message: "Online only cannot be selected with a campus.",
      path: ["campuses"],
    });
  }
});

export type MentorRegistrationFields = z.infer<typeof mentorRegistrationSchema>;

export function mentorExperienceYears(band: MentorRegistrationFields["yearsExperience"]) {
  return { "0-2": 1, "3-5": 4, "6-10": 8, "10+": 10 }[band];
}
