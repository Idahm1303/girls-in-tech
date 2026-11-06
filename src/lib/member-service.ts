import {
  DUPLICATE_EMAIL_ERROR,
  DUPLICATE_STUDENT_NUMBER_ERROR,
  type RegistrationFields,
  type StudentProfileFields,
} from "@/lib/account-validation";

export function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

type RegistrationRepository = {
  emailExists(email: string): Promise<boolean>;
  createStudent(input: RegistrationFields & { passwordHash: string }): Promise<void>;
};

export async function registerStudent(
  input: RegistrationFields,
  passwordHash: string,
  repository: RegistrationRepository,
) {
  if (await repository.emailExists(input.email)) {
    return { ok: false as const, message: DUPLICATE_EMAIL_ERROR };
  }

  try {
    await repository.createStudent({ ...input, passwordHash });
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return { ok: false as const, message: DUPLICATE_EMAIL_ERROR };
    }
    throw error;
  }

  return { ok: true as const };
}

type ProfileRepository = {
  studentNumberExists(studentNumber: string, exceptUserId: string): Promise<boolean>;
  updateStudentProfile(
    userId: string,
    input: StudentProfileFields & { profileCompletedAt: Date },
  ): Promise<void>;
};

export async function completeStudentProfile(
  userId: string,
  input: StudentProfileFields,
  repository: ProfileRepository,
) {
  if (await repository.studentNumberExists(input.studentNumber, userId)) {
    return { ok: false as const, message: DUPLICATE_STUDENT_NUMBER_ERROR };
  }

  try {
    await repository.updateStudentProfile(userId, {
      ...input,
      profileCompletedAt: new Date(),
    });
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return { ok: false as const, message: DUPLICATE_STUDENT_NUMBER_ERROR };
    }
    throw error;
  }

  return { ok: true as const };
}
