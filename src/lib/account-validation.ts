import { z } from "zod";

export const EMAIL_DOMAIN_ERROR =
  "Please use a Gmail or South African email address (e.g. tut.ac.za, tut4life.ac.za).";

export const STUDENT_NUMBER_ERROR =
  "Wrong student number. Use exactly 9 digits, numbers only.";

export const DUPLICATE_EMAIL_ERROR =
  "This email is already registered. Please log in.";

export const DUPLICATE_STUDENT_NUMBER_ERROR =
  "This student number is already registered. If this is a mistake, please contact a GiT admin.";

export const CAMPUS_OPTIONS = [
  "SOSHANGUVE",
  "EMALAHLENI",
  "POLOKWANE",
  "GIYANE",
] as const;

export const COURSE_OPTIONS = [
  "Computer Science",
  "Computer System Engineering",
  "Information Technology",
  "Informatics",
  "Multimedia",
] as const;

export const STUDY_YEAR_OPTIONS = ["1", "2", "3"] as const;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(EMAIL_DOMAIN_ERROR)
  .refine((email) => {
    const domain = email.split("@").at(-1) ?? "";
    return domain === "gmail.com" || domain.endsWith(".za");
  }, EMAIL_DOMAIN_ERROR);

export const registrationSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name."),
    surname: z.string().trim().min(1, "Enter your surname."),
    email: emailSchema,
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    consent: z.boolean().refine(
      (accepted) => accepted,
      "Consent is required to create an account.",
    ),
  })
  .superRefine((fields, context) => {
    if (fields.password !== fields.confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const studentProfileSchema = z.object({
  studentNumber: z.string().regex(/^\d{9}$/, STUDENT_NUMBER_ERROR),
  yearOfStudy: z.enum(STUDY_YEAR_OPTIONS, {
    error: "Select your year of study.",
  }).transform(Number),
  campus: z.enum(CAMPUS_OPTIONS, { error: "Select your campus." }),
  qualification: z.enum(COURSE_OPTIONS, {
    error: "Select your course or qualification.",
  }),
});

export const welcomeFlashSchema = z.object({
  name: z.string(),
  surname: z.string(),
  email: z.string().email(),
});

export type RegistrationFields = z.infer<typeof registrationSchema>;
export type StudentProfileFields = z.infer<typeof studentProfileSchema>;
export type FormActionState = {
  errors?: Record<string, string>;
  message?: string;
};
