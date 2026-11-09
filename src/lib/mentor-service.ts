import type { MentorRegistrationFields } from "@/lib/mentor-validation";

type MentorRegistrationRepository = {
  emailExists(email: string): Promise<boolean>;
  createApplication(
    input: MentorRegistrationFields,
    passwordHash: string,
  ): Promise<void>;
};

export const DUPLICATE_MENTOR_EMAIL_ERROR =
  "This email is already registered. Please log in or use another email.";

export async function registerMentor(
  input: MentorRegistrationFields,
  passwordHash: string,
  repository: MentorRegistrationRepository,
) {
  if (await repository.emailExists(input.email)) {
    return { ok: false as const, message: DUPLICATE_MENTOR_EMAIL_ERROR };
  }

  try {
    await repository.createApplication(input, passwordHash);
    return { ok: true as const };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { ok: false as const, message: DUPLICATE_MENTOR_EMAIL_ERROR };
    }
    throw error;
  }
}
