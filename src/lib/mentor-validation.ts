import { z } from "zod";
import {
  MENTOR_NOTICE_HOURS,
  MENTOR_SESSION_LENGTHS,
  mentorSessionStartMinutes,
  parseMentorAvailabilitySelection,
} from "@/lib/mentor-schedule";

export {
  MENTOR_NOTICE_HOURS,
  MENTOR_SESSION_LENGTHS,
  MENTOR_WEEKDAYS,
} from "@/lib/mentor-schedule";

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
  "Web development",
  "Mobile apps",
  "Data analysis & data science",
  "AI & machine learning",
  "Cybersecurity",
  "Cloud & DevOps",
  "Networking & infrastructure",
  "UX/UI design",
  "Project management",
  "Business analysis",
  "IT support",
  "Entrepreneurship",
  "Other",
] as const;

export const MENTOR_LEGACY_EXPERTISE = [
  "Cloud",
  "Data & AI",
  "UX Design",
  "UX/UI Design",
  "Networking",
  "Networking & Infrastructure",
  "Career Growth",
  "Interview Prep",
  "CV Review",
] as const;
export const MENTOR_PROFILE_EXPERTISE = [
  ...MENTOR_EXPERTISE,
  ...MENTOR_LEGACY_EXPERTISE,
] as const;

export const MENTOR_MOTIVATION_REASONS = [
  "Give back what I've learned",
  "Help someone take their next step",
  "Grow as a mentor and leader",
  "Meet people with different perspectives",
  "Support and inspire women in tech",
  "Something else",
] as const;

export const MENTOR_HELP_TOPICS = [
  "Finding a career direction",
  "Reviewing a portfolio or resume",
  "Practicing for interviews",
  "Growing skills and solving work challenges",
  "Navigating offers and negotiation",
  "Leading people and working with others",
  "Building confidence and perspective",
  "WIL and internship guidance",
  "Learnerships and bursaries",
  "Starting a business",
  "Balancing work, study and family",
  "Something else",
] as const;

export const MENTOR_CURRENT_STATUSES = [
  "Industry professional",
  "TUT alumni",
  "Postgraduate student",
  "Final-year student",
  "Academic or lecturer",
  "Entrepreneur",
  "Other",
] as const;

export const MENTOR_EXPERIENCE_BANDS = [
  "LESS_THAN_1",
  "1-3",
  "4-6",
  "7-10",
  "10+",
] as const;

export const MENTOR_SESSION_FORMATS = [
  "ONLINE",
  "IN_PERSON",
  "BOTH",
  "PHONE_CALL",
  "CHAT_MESSAGING",
  "NO_PREFERENCE",
] as const;
export const MENTOR_SESSION_FORMAT_OPTIONS = [
  "ONLINE",
  "PHONE_CALL",
  "CHAT_MESSAGING",
  "IN_PERSON",
  "NO_PREFERENCE",
] as const;

export const MENTOR_MEETING_FREQUENCIES = [
  "Once a week",
  "Every two weeks",
  "Once a month",
  "As needed",
] as const;

export const MENTOR_MENTEE_GROUPS = [
  "First-year students",
  "Second-year students",
  "Final-year students",
  "Women returning to study or work",
  "Women over 35",
  "No preference",
] as const;

export const MENTOR_LANGUAGES = [
  "English",
  "isiZulu",
  "isiXhosa",
  "Sepedi",
  "Setswana",
  "Sesotho",
  "Afrikaans",
  "\u0058itsonga",
  "Tshivenda",
  "siSwati",
  "isiNdebele",
  "Other",
] as const;

export const MENTOR_CAMPUS_CONNECTIONS = [
  "Soshanguve",
  "Emalahleni",
  "Polokwane",
  "Giyane",
  "Pretoria",
  "Not linked to a campus",
] as const;

export const MENTOR_REFERRAL_SOURCES = [
  "Faculty or lecturer",
  "Girls in Tech event",
  "Social media",
  "A friend or colleague",
  "Other",
] as const;

export const MENTOR_CAMPUS_OPTIONS = [
  "SOSHANGUVE",
  "EMALAHLENI",
  "POLOKWANE",
  "GIYANE",
  "ONLINE_ONLY",
] as const;

export const MENTOR_MEETING_TOOLS = ["TEAMS", "ZOOM", "GOOGLE_MEET"] as const;

const emailSchema = z.string().trim().email("Enter a valid email address.").toLowerCase();

const mentorAccountFieldsSchema = z.object({
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
});

export const mentorMemberAccountSchema = mentorAccountFieldsSchema.omit({
  password: true,
  confirmPassword: true,
});

export const mentorAccountSchema = mentorAccountFieldsSchema.superRefine((account, context) => {
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
    .union([
      z.literal(""),
      z.url({
        protocol: /^https?$/,
        hostname: /^(?:[a-z0-9-]+\.)*linkedin\.com$/i,
        error: "Enter a valid LinkedIn profile URL.",
      }),
    ]),
  expertise: z.array(z.enum(MENTOR_EXPERTISE))
    .min(1, "Choose at least one area of expertise.")
    .max(3, "Choose no more than 3 areas of expertise."),
  expertiseOther: z.string().trim().max(120, "Keep your answer under 120 characters."),
}).superRefine(validateMentorExpertise);

const mentorScheduleFields = {
  sessionLengthMinutes: z.coerce.number().int().refine(
    (value) => (MENTOR_SESSION_LENGTHS as readonly number[]).includes(value),
    "Choose a session length of 30, 45, or 60 minutes.",
  ),
  minimumNoticeHours: z.coerce.number().int().refine(
    (value) => (MENTOR_NOTICE_HOURS as readonly number[]).includes(value),
    "Choose a minimum notice of 24 or 48 hours.",
  ),
  availability: z.array(z.string()),
};

function validateMentorSchedule(
  fields: {
    availability: string[];
    sessionLengthMinutes: number;
  },
  context: z.RefinementCtx,
) {
  const validStarts = new Set(mentorSessionStartMinutes(fields.sessionLengthMinutes));
  const seen = new Set<string>();
  for (const value of fields.availability) {
    const selection = parseMentorAvailabilitySelection(value);
    if (
      !selection ||
      !validStarts.has(selection.startMinute) ||
      seen.has(value)
    ) {
      context.addIssue({
        code: "custom",
        message: "Select valid, non-repeating availability slots.",
        path: ["availability"],
      });
      return;
    }
    seen.add(value);
  }
}

export const mentorScheduleSchema = z.object(mentorScheduleFields).superRefine(
  validateMentorSchedule,
);

export const mentorPreferencesSchema = z.object({
  sessionFormat: z.enum(MENTOR_SESSION_FORMATS).default("NO_PREFERENCE"),
  meetingTool: z.enum(MENTOR_MEETING_TOOLS, {
    error: "Select a preferred meeting tool.",
  }),
  campuses: z.array(z.enum(MENTOR_CAMPUS_OPTIONS)).min(1, "Select at least one campus or online only."),
  maxMentees: z.coerce.number().int().min(1).max(5).default(1),
  ...mentorScheduleFields,
  motivationReasons: z.array(z.enum(MENTOR_MOTIVATION_REASONS))
    .min(1, "Select at least one reason.")
    .max(6),
  motivationReasonsOther: z.string().trim().max(120, "Keep your answer under 120 characters."),
  helpWith: z.array(z.enum(MENTOR_HELP_TOPICS))
    .min(1, "Select at least one topic.")
    .max(12),
  helpWithOther: z.string().trim().max(120, "Keep your answer under 120 characters."),
  currentStatus: z.enum(MENTOR_CURRENT_STATUSES, { error: "Select your current status." }),
  currentStatusOther: z.string().trim().max(120, "Keep your answer under 120 characters."),
  meetingFrequency: z.union([z.literal(""), z.enum(MENTOR_MEETING_FREQUENCIES)]),
  menteeGroups: z.array(z.enum(MENTOR_MENTEE_GROUPS)).max(6),
  languages: z.array(z.enum(MENTOR_LANGUAGES)).max(12),
  languagesOther: z.string().trim().max(120, "Keep your answer under 120 characters."),
  campusConnection: z.union([z.literal(""), z.enum(MENTOR_CAMPUS_CONNECTIONS)]),
  referralSource: z.union([z.literal(""), z.enum(MENTOR_REFERRAL_SOURCES)]),
  referralSourceOther: z.string().trim().max(120, "Keep your answer under 120 characters."),
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

const mentorApplicationFieldsSchema = z.object({
  ...mentorMemberAccountSchema.shape,
  ...mentorProfessionalSchema.shape,
  ...mentorPreferencesSchema.shape,
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
  validateMentorExpertise(fields, context);
  validateMentorPreferences(fields, context);
});

export const mentorMemberApplicationSchema = mentorApplicationFieldsSchema.superRefine(
  (fields, context) => {
    validateMentorExpertise(fields, context);
    validateMentorPreferences(fields, context);
  },
);

function validateMentorExpertise(
  fields: {
    expertise: string[];
    expertiseOther: string;
  },
  context: z.RefinementCtx,
) {
  if (fields.expertise.includes("Other") && !fields.expertiseOther.trim()) {
    context.addIssue({
      code: "custom",
      message: "Add a short description for your other area of expertise.",
      path: ["expertiseOther"],
    });
  }
}

function validateMentorPreferences(
  fields: {
    availability: string[];
    campuses: (typeof MENTOR_CAMPUS_OPTIONS)[number][];
    sessionLengthMinutes: number;
    motivationReasons: string[];
    motivationReasonsOther: string;
    helpWith: string[];
    helpWithOther: string;
    currentStatus: string;
    currentStatusOther: string;
  },
  context: z.RefinementCtx,
) {
  validateMentorSchedule(fields, context);
  if (
    fields.motivationReasons.includes("Something else") &&
    !fields.motivationReasonsOther.trim()
  ) {
    context.addIssue({
      code: "custom",
      message: "Add a short description for your other reason.",
      path: ["motivationReasonsOther"],
    });
  }
  if (
    fields.helpWith.includes("Something else") &&
    !fields.helpWithOther.trim()
  ) {
    context.addIssue({
      code: "custom",
      message: "Add a short description for the other topic.",
      path: ["helpWithOther"],
    });
  }
  if (fields.currentStatus === "Other" && !fields.currentStatusOther.trim()) {
    context.addIssue({
      code: "custom",
      message: "Add a short description of your current status.",
      path: ["currentStatusOther"],
    });
  }
  if (fields.campuses.includes("ONLINE_ONLY") && fields.campuses.length > 1) {
    context.addIssue({
      code: "custom",
      message: "Online only cannot be selected with a campus.",
      path: ["campuses"],
    });
  }
}

export type MentorApplicationFields = z.infer<typeof mentorMemberApplicationSchema>;
export type MentorRegistrationFields = z.infer<typeof mentorRegistrationSchema>;

export function mentorExperienceYears(band: MentorRegistrationFields["yearsExperience"]) {
  return {
    LESS_THAN_1: 0,
    "1-3": 2,
    "4-6": 5,
    "7-10": 8,
    "10+": 10,
  }[band];
}
